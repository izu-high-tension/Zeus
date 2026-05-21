import type { Rarity } from "@pianimals/shared";

/**
 * Mining rate per pet, in Pet/second. Higher rarity → higher rate.
 * Tuned so that a Common pet yields ~10 Pet/day, a Legendary ~250 Pet/day.
 */
export const MINING_RATE_PER_SECOND: Record<Rarity, number> = {
  COMMON: 10 / 86_400,
  UNCOMMON: 25 / 86_400,
  RARE: 60 / 86_400,
  EPIC: 120 / 86_400,
  LEGENDARY: 250 / 86_400,
};

export function rarityScore(rarities: Rarity[]): number {
  const weights: Record<Rarity, number> = {
    COMMON: 1,
    UNCOMMON: 2,
    RARE: 5,
    EPIC: 12,
    LEGENDARY: 30,
  };
  return rarities.reduce((acc, r) => acc + weights[r], 0);
}
