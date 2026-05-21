import { describe, expect, it, beforeEach } from "vitest";
import {
  approvePayment,
  completePayment,
  createIntent,
  PaymentStateError,
  resolvePrice,
} from "../lib/payments";

/**
 * In-memory fake of just the slice of Prisma the FSM touches.
 * Lets us assert state-machine invariants without spinning up Postgres.
 */
function makeFakePrisma() {
  type Row = {
    id: string;
    piPaymentId: string;
    userId: string;
    amountPi: string;
    purpose: "MINT" | "PET_PURCHASE" | "LISTING_FEE" | "TOPUP";
    metadata: Record<string, unknown>;
    status: "CREATED" | "APPROVED" | "COMPLETED" | "CANCELLED" | "FAILED";
    idempotencyKey: string;
    approvedAt: Date | null;
    completedAt: Date | null;
    txid: string | null;
  };
  const rows: Row[] = [];
  let i = 0;

  const payment = {
    async findUnique({ where }: { where: { piPaymentId?: string; idempotencyKey?: string; id?: string } }) {
      return (
        rows.find(
          (r) =>
            (where.piPaymentId && r.piPaymentId === where.piPaymentId) ||
            (where.idempotencyKey && r.idempotencyKey === where.idempotencyKey) ||
            (where.id && r.id === where.id),
        ) ?? null
      );
    },
    async create({ data }: { data: Omit<Row, "id" | "approvedAt" | "completedAt" | "txid"> & Partial<Row> }) {
      // Enforce unique constraints we care about.
      if (rows.some((r) => r.piPaymentId === data.piPaymentId)) {
        throw new Error("Unique constraint failed on piPaymentId");
      }
      if (rows.some((r) => r.idempotencyKey === data.idempotencyKey)) {
        throw new Error("Unique constraint failed on idempotencyKey");
      }
      const row: Row = {
        id: `pmt_${++i}`,
        piPaymentId: data.piPaymentId,
        userId: data.userId,
        amountPi: String(data.amountPi),
        purpose: data.purpose as Row["purpose"],
        metadata: (data.metadata as Record<string, unknown>) ?? {},
        status: (data.status as Row["status"]) ?? "CREATED",
        idempotencyKey: data.idempotencyKey,
        approvedAt: null,
        completedAt: null,
        txid: null,
      };
      rows.push(row);
      return row;
    },
    async update({ where, data }: { where: { id?: string; piPaymentId?: string }; data: Partial<Row> }) {
      const row = rows.find(
        (r) =>
          (where.id && r.id === where.id) ||
          (where.piPaymentId && r.piPaymentId === where.piPaymentId),
      );
      if (!row) throw new Error("not found");
      Object.assign(row, data);
      return row;
    },
  };

  const prisma = {
    payment,
    async $transaction<T>(fn: (tx: typeof prisma) => Promise<T>) {
      return fn(prisma);
    },
  };
  return prisma;
}

describe("resolvePrice", () => {
  it("uses fixed MINT price", () => {
    expect(resolvePrice("MINT", { species: "DOG" }).amountPi).toBe("1.00");
  });
  it("requires TOPUP amount", () => {
    expect(() => resolvePrice("TOPUP", {})).toThrow(PaymentStateError);
  });
  it("rejects negative amounts", () => {
    expect(() => resolvePrice("TOPUP", { amountPi: "-5" })).toThrow(
      PaymentStateError,
    );
  });
});

describe("payment FSM", () => {
  let prisma: ReturnType<typeof makeFakePrisma>;

  beforeEach(() => {
    prisma = makeFakePrisma();
  });

  async function setup() {
    const { payment } = await createIntent(prisma as any, {
      userId: "u1",
      purpose: "MINT",
      metadata: { species: "DOG" },
      idempotencyKey: "11111111-1111-1111-1111-111111111111",
      piPaymentId: "pi_abc",
    });
    return payment;
  }

  it("happy path: CREATED → APPROVED → COMPLETED", async () => {
    const intent = await setup();
    expect(intent.status).toBe("CREATED");

    const approved = await approvePayment(prisma as any, {
      userId: "u1",
      piPaymentId: "pi_abc",
      callPiApprove: async () => {},
    });
    expect(approved.status).toBe("APPROVED");

    const completed = await completePayment(prisma as any, {
      userId: "u1",
      piPaymentId: "pi_abc",
      txid: "0xdead",
      callPiComplete: async () => {},
    });
    expect(completed.status).toBe("COMPLETED");
    expect(completed.txid).toBe("0xdead");
  });

  it("intent is idempotent on the same key", async () => {
    const a = await createIntent(prisma as any, {
      userId: "u1",
      purpose: "MINT",
      metadata: { species: "DOG" },
      idempotencyKey: "22222222-2222-2222-2222-222222222222",
      piPaymentId: "pi_x",
    });
    const b = await createIntent(prisma as any, {
      userId: "u1",
      purpose: "MINT",
      metadata: { species: "DOG" },
      idempotencyKey: "22222222-2222-2222-2222-222222222222",
      piPaymentId: "pi_x",
    });
    expect(a.payment.id).toBe(b.payment.id);
  });

  it("approve is idempotent (double-approve returns row, no re-call)", async () => {
    await setup();
    let calls = 0;
    await approvePayment(prisma as any, {
      userId: "u1",
      piPaymentId: "pi_abc",
      callPiApprove: async () => {
        calls++;
      },
    });
    await approvePayment(prisma as any, {
      userId: "u1",
      piPaymentId: "pi_abc",
      callPiApprove: async () => {
        calls++;
      },
    });
    expect(calls).toBe(1);
  });

  it("cannot complete without approve", async () => {
    await setup();
    await expect(
      completePayment(prisma as any, {
        userId: "u1",
        piPaymentId: "pi_abc",
        txid: "0xdead",
        callPiComplete: async () => {},
      }),
    ).rejects.toThrow(PaymentStateError);
  });

  it("rejects approve for wrong user", async () => {
    await setup();
    await expect(
      approvePayment(prisma as any, {
        userId: "u2",
        piPaymentId: "pi_abc",
        callPiApprove: async () => {},
      }),
    ).rejects.toThrow(/belong to user/);
  });

  it("complete runs the onComplete side-effect transactionally", async () => {
    await setup();
    await approvePayment(prisma as any, {
      userId: "u1",
      piPaymentId: "pi_abc",
      callPiApprove: async () => {},
    });
    let sideEffectId: string | null = null;
    await completePayment(prisma as any, {
      userId: "u1",
      piPaymentId: "pi_abc",
      txid: "0xdead",
      callPiComplete: async () => {},
      onComplete: async (paymentId) => {
        sideEffectId = paymentId;
      },
    });
    expect(sideEffectId).not.toBeNull();
  });
});
