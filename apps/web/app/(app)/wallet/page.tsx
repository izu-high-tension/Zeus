import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PiPaymentButton } from "@/components/PiPaymentButton";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getSession();
  if (!session.userId) {
    return <p className="text-sm">Please log in.</p>;
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">Pet balance</p>
        <p className="mt-1 text-3xl font-semibold">
          {user.petBalance.toString()} <span className="text-base font-normal">Pet</span>
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Equivalent ≈ {(Number(user.petBalance) / 100).toFixed(4)} Pi
        </p>
      </div>
      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold">Top up Pet</h2>
        <p className="mt-1 text-xs text-neutral-500">1 Pi → 100 Pet</p>
        <div className="mt-3">
          <PiPaymentButton
            label="Buy 100 Pet (1 Pi)"
            purpose="TOPUP"
            metadata={{ amountPi: "1" }}
          />
        </div>
      </div>
    </div>
  );
}
