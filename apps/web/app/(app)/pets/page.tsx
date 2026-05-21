import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PetCard } from "@/components/PetCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyPetsPage() {
  const session = await getSession();
  if (!session.userId) {
    return (
      <div className="rounded-lg border border-neutral-200 p-6 text-center dark:border-neutral-800">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Log in with Pi to view your pets.
        </p>
      </div>
    );
  }

  const pets = await prisma.pet.findMany({
    where: { ownerId: session.userId },
    include: { attributes: true },
    orderBy: { mintedAt: "desc" },
  });

  if (pets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
        <h2 className="text-lg font-semibold">No pets yet</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Mint your first Gen-0 PI ANIMALS to start mining Pet tokens.
        </p>
        <Link
          href="/mint"
          className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-fg"
        >
          Mint a pet
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My pets</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {pets.map((p) => (
          <PetCard
            key={p.id}
            species={p.species}
            generation={p.generation}
            tokenId={p.tokenId.toString()}
            rarityScore={p.rarityScore}
            attributes={p.attributes.map((a) => ({
              trait: a.trait,
              value: a.value,
              rarity: a.rarity,
            }))}
          />
        ))}
      </div>
    </div>
  );
}
