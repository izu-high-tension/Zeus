import type { AttributeTrait, Rarity, Species } from "@pianimals/shared";
import { cn } from "@/lib/utils";

interface Trait {
  trait: AttributeTrait;
  value: string;
  rarity: Rarity;
}

const rarityClass: Record<Rarity, string> = {
  COMMON: "bg-neutral-200 text-neutral-800",
  UNCOMMON: "bg-emerald-200 text-emerald-900",
  RARE: "bg-sky-200 text-sky-900",
  EPIC: "bg-violet-200 text-violet-900",
  LEGENDARY: "bg-amber-200 text-amber-900",
};

export function PetCard({
  species,
  generation,
  tokenId,
  imageUrl,
  attributes,
  rarityScore,
}: {
  species: Species;
  generation: number;
  tokenId: string;
  imageUrl?: string;
  attributes: Trait[];
  rarityScore: number;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-950 dark:to-pink-950">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`PI ANIMALS ${species} #${tokenId}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            {species === "DOG" ? "🐕" : "🐈"}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {species === "DOG" ? "PI ANIMALS Dog" : "PI ANIMALS Cat"} #{tokenId}
          </h3>
          <span className="text-xs text-neutral-500">Gen {generation}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">Rarity score {rarityScore}</p>
        <ul className="mt-2 flex flex-wrap gap-1">
          {attributes.slice(0, 4).map((a) => (
            <li
              key={a.trait}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                rarityClass[a.rarity],
              )}
              title={`${a.trait}: ${a.value}`}
            >
              {a.trait.toLowerCase()}: {a.value}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
