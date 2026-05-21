import { NextRequest, NextResponse } from "next/server";
import { PaymentApproveRequestSchema } from "@pianimals/shared";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { limiters } from "@/lib/ratelimit";
import { approvePayment, PaymentStateError } from "@/lib/payments";
import { piApprovePayment, piGetPayment } from "@/lib/pi/server";

/**
 * Step 2: invoked by Pi SDK's `onReadyForServerApproval`. We bind the SDK-
 * supplied `paymentId` to the intent created earlier, verify the amount, and
 * call Pi Platform `/approve`.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rl = await limiters.paymentApprove.limit(`approve:${session.userId}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const csrf = req.headers.get("x-csrf");
  if (!csrf || csrf !== session.csrf) {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }

  let body: ReturnType<typeof PaymentApproveRequestSchema.parse>;
  try {
    body = PaymentApproveRequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Find the intent we created earlier and bind the real Pi payment ID to it.
  const intent = await prisma.payment.findUnique({
    where: { idempotencyKey: body.idempotencyKey },
  });
  if (!intent || intent.userId !== session.userId) {
    return NextResponse.json({ error: "intent_not_found" }, { status: 404 });
  }
  if (intent.piPaymentId !== body.paymentId) {
    if (intent.piPaymentId.startsWith("pending:")) {
      await prisma.payment.update({
        where: { id: intent.id },
        data: { piPaymentId: body.paymentId },
      });
    } else {
      return NextResponse.json({ error: "payment_id_mismatch" }, { status: 409 });
    }
  }

  // Cross-check with Pi Platform: verify amount matches what we priced.
  try {
    const piPayment = await piGetPayment(body.paymentId);
    if (Number(piPayment.amount) !== Number(intent.amountPi)) {
      return NextResponse.json(
        { error: "amount_mismatch" },
        { status: 409 },
      );
    }
    if (piPayment.user_uid !== session.piUid) {
      return NextResponse.json({ error: "uid_mismatch" }, { status: 409 });
    }
  } catch {
    return NextResponse.json({ error: "pi_lookup_failed" }, { status: 502 });
  }

  try {
    const updated = await approvePayment(prisma, {
      userId: session.userId,
      piPaymentId: body.paymentId,
      callPiApprove: async (pid) => {
        await piApprovePayment(pid);
      },
    });
    return NextResponse.json({ status: updated.status });
  } catch (err) {
    if (err instanceof PaymentStateError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "approve_failed" }, { status: 502 });
  }
}
