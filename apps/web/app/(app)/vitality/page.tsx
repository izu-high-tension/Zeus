import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VitalityPage() {
  const session = await getSession();
  if (!session.userId) return <p className="text-sm">Please log in.</p>;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  const pct = Math.min(100, user.vitality);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Vitality</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Reach 100 to qualify for a free Gen-0 pet at mainnet launch.
      </p>
      <div className="mt-6">
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm">{pct} / 100</p>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        <li>+5 daily check-in</li>
        <li>+10 per referred friend</li>
        <li>+25 per Pi payment (any purpose)</li>
        <li>+50 first Gen-0 mint</li>
      </ul>
    </div>
  );
}
