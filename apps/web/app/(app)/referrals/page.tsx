import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await getSession();
  if (!session.userId) return <p className="text-sm">Please log in.</p>;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { referralsMade: true },
  });
  if (!user) return null;

  const link = `${env.NEXT_PUBLIC_APP_URL}/?ref=${user.piUid}`;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Refer friends</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Each friend who signs up via your link gives you +10 vitality and 50
        Pet bonus once they make their first payment.
      </p>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-900">
        {link}
      </div>
      <p className="mt-4 text-sm">
        Friends referred: <strong>{user.referralsMade.length}</strong>
      </p>
    </div>
  );
}
