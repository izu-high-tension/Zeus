import { NextRequest, NextResponse } from "next/server";
import { PaymentCompleteRequestSchema } from "@pianimals/shared";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { limiters } from "@/lib/ratelimit";
import {
  completePayment,
  PaymentStateError,
} from "@/lib/payments";
import { piCompletePayment } from "@/lib/pi/server";

/**
 * Step 3: invoked by Pi SDK's `onReadyForServerCompletion`. We tell Pi to
 * finalize, then in a single Prisma transaction we both mark the payment
 * COMPLETED and apply its side-effect (credit Pet, enqueue mint, etc.).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rl = await limiters.paymentComplete.limit(`complete:${session.userId}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const csrf = req.headers.get("x-csrf");
  if (!csrf || csrf !== session.csrf) {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }

  let body: ReturnType<typeof PaymentCompleteRequestSchema.parse>;
  try {
    body = PaymentCompleteRequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const updated = await completePayment(prisma, {
      userId: session.userId,
      piPaymentId: body.paymentId,
      txid: body.txid,
      callPiComplete: async (pid, txid) => {
        await piCompletePayment(pid, txid);
      },
      onComplete: async (paymentId, tx) => {
        // Apply payment-purpose side-effects atomically.
        const p = await tx.payment.findUnique({ where: { id: paymentId } });
        if (!p) return;
        switch (p.purpose) {
          case "TOPUP": {
            await tx.user.update({
              where: { id: p.userId },
              data: {
                petBalance: { increment: Number(p.amountPi) * 100 },
              },
            });
            break;
          }
          case "MINT": {
            // Award 25 vitality up to cap; the actual on-chain mint is enqueued
            // by the indexer / worker (out of scope for MVP-α).
            await tx.user.update({
              where: { id: p.userId },
              data: {
                vitality: { increment: 25 },
              },
            });
            break;
          }
          case "LISTING_FEE":
          case "PET_PURCHASE":
            // No-op in MVP-α; marketplace settlement lives in MVP-β.
            break;
        }
      },
    });
    return NextResponse.json({ status: updated.status });
  } catch (err) {
    if (err instanceof PaymentStateError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "complete_failed" }, { status: 502 });
  }
}
