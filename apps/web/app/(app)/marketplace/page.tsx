import { prisma } from "@/lib/prisma";
import { PetCard } from "@/components/PetCard";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const listings = await prisma.marketplaceListing.findMany({
    where: { status: "ACTIVE" },
    include: { pet: { include: { attributes: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Marketplace</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Buy and sell PI ANIMALS NFTs. Listings settle on Polygon; payment via Pi.
      </p>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm dark:border-neutral-700">
          No active listings yet. Marketplace UI ships in MVP-β.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <PetCard
              key={l.id}
              species={l.pet.species}
              generation={l.pet.generation}
              tokenId={l.pet.tokenId.toString()}
              rarityScore={l.pet.rarityScore}
              attributes={l.pet.attributes.map((a) => ({
                trait: a.trait,
                value: a.value,
                rarity: a.rarity,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
