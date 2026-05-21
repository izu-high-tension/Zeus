import type { Prisma, PrismaClient } from "@prisma/client";
import { PaymentPurpose, PaymentStatus } from "@prisma/client";
import { PRICE_LIST, memoFor } from "@pianimals/shared";

/**
 * Payment FSM: CREATED → APPROVED → COMPLETED.
 * The functions below are pure(-ish) so they can be unit tested against
 * either a real Prisma client or an injected fake.
 */

export class PaymentStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentStateError";
  }
}

/** Server-controlled price/memo resolution. */
export function resolvePrice(
  purpose: PaymentPurpose,
  metadata: Record<string, unknown>,
): { amountPi: string; memo: string } {
  let amountPi: string;
  switch (purpose) {
    case "MINT":
      amountPi = PRICE_LIST.MINT;
      break;
    case "LISTING_FEE":
      amountPi = PRICE_LIST.LISTING_FEE;
      break;
    case "PET_PURCHASE": {
      const raw = metadata.priceInPi;
      if (typeof raw !== "string" && typeof raw !== "number") {
        throw new PaymentStateError("PET_PURCHASE requires priceInPi");
      }
      amountPi = String(raw);
      break;
    }
    case "TOPUP": {
      const raw = metadata.amountPi;
      if (typeof raw !== "string" && typeof raw !== "number") {
        throw new PaymentStateError("TOPUP requires amountPi");
      }
      amountPi = String(raw);
      break;
    }
    default: {
      const _exhaustive: never = purpose;
      throw new PaymentStateError(`Unhandled purpose: ${String(_exhaustive)}`);
    }
  }
  if (Number.isNaN(Number(amountPi)) || Number(amountPi) <= 0) {
    throw new PaymentStateError(`Invalid amount: ${amountPi}`);
  }
  return { amountPi, memo: memoFor(purpose, metadata) };
}

export interface CreateIntentInput {
  userId: string;
  purpose: PaymentPurpose;
  metadata: Record<string, unknown>;
  idempotencyKey: string; // uuid generated client-side or server-side
  piPaymentId: string; // surface the Pi-side identifier (or a placeholder for tests)
}

export async function createIntent(
  prisma: Pick<PrismaClient, "payment">,
  input: CreateIntentInput,
) {
  const { amountPi, memo } = resolvePrice(input.purpose, input.metadata);

  // Idempotency: if the same key already exists, return it.
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return { payment: existing, amountPi, memo };

  const payment = await prisma.payment.create({
    data: {
      piPaymentId: input.piPaymentId,
      userId: input.userId,
      amountPi: amountPi as unknown as Prisma.Decimal,
      purpose: input.purpose,
      metadata: input.metadata as Prisma.JsonObject,
      status: PaymentStatus.CREATED,
      idempotencyKey: input.idempotencyKey,
    },
  });
  return { payment, amountPi, memo };
}

export interface ApproveInput {
  userId: string;
  piPaymentId: string;
  callPiApprove: (paymentId: string) => Promise<void>;
}

export async function approvePayment(
  prisma: Pick<PrismaClient, "payment">,
  input: ApproveInput,
) {
  const payment = await prisma.payment.findUnique({
    where: { piPaymentId: input.piPaymentId },
  });
  if (!payment) throw new PaymentStateError("payment not found");
  if (payment.userId !== input.userId) {
    throw new PaymentStateError("payment does not belong to user");
  }
  if (payment.status === PaymentStatus.APPROVED) return payment;
  if (payment.status !== PaymentStatus.CREATED) {
    throw new PaymentStateError(
      `cannot approve from status ${payment.status}`,
    );
  }
  await input.callPiApprove(input.piPaymentId);
  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.APPROVED, approvedAt: new Date() },
  });
}

export interface CompleteInput {
  userId: string;
  piPaymentId: string;
  txid: string;
  callPiComplete: (paymentId: string, txid: string) => Promise<void>;
  onComplete?: (paymentId: string, tx: Prisma.TransactionClient) => Promise<void>;
}

export async function completePayment(
  prisma: PrismaClient,
  input: CompleteInput,
) {
  const payment = await prisma.payment.findUnique({
    where: { piPaymentId: input.piPaymentId },
  });
  if (!payment) throw new PaymentStateError("payment not found");
  if (payment.userId !== input.userId) {
    throw new PaymentStateError("payment does not belong to user");
  }
  if (payment.status === PaymentStatus.COMPLETED) return payment;
  if (payment.status !== PaymentStatus.APPROVED) {
    throw new PaymentStateError(
      `cannot complete from status ${payment.status}`,
    );
  }

  await input.callPiComplete(input.piPaymentId, input.txid);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        completedAt: new Date(),
        txid: input.txid,
      },
    });
    if (input.onComplete) {
      await input.onComplete(updated.id, tx);
    }
    return updated;
  });
}
