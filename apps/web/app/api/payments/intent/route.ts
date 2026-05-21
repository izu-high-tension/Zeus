import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PaymentIntentRequestSchema } from "@pianimals/shared";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { limiters } from "@/lib/ratelimit";
import { createIntent } from "@/lib/payments";

/**
 * Step 1 of the Pi payment flow.
 *
 * Client calls this BEFORE `Pi.createPayment(...)`. We assign an idempotency
 * key, compute the server-controlled price+memo, and return them. The client
 * passes those exact values into the SDK so amount tampering is impossible.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rl = await limiters.paymentIntent.limit(`intent:${session.userId}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const csrf = req.headers.get("x-csrf");
  if (!csrf || csrf !== session.csrf) {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }

  let body: ReturnType<typeof PaymentIntentRequestSchema.parse>;
  try {
    body = PaymentIntentRequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Pi-side payment ID isn't known until the SDK call returns; the FE will
  // send it on /approve. We persist a placeholder keyed by idempotencyKey here.
  const idempotencyKey = randomUUID();
  const piPaymentIdPlaceholder = `pending:${idempotencyKey}`;

  try {
    const { payment, amountPi, memo } = await createIntent(prisma, {
      userId: session.userId,
      purpose: body.purpose,
      metadata: body.metadata,
      idempotencyKey,
      piPaymentId: piPaymentIdPlaceholder,
    });
    return NextResponse.json({
      idempotencyKey,
      amountPi,
      memo,
      metadata: payment.metadata,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "intent_failed", message: (err as Error).message },
      { status: 400 },
    );
  }
}
