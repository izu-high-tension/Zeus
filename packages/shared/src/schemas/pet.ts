import { z } from "zod";

export const SpeciesSchema = z.enum(["DOG", "CAT"]);
export type Species = z.infer<typeof SpeciesSchema>;

export const RaritySchema = z.enum([
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
]);
export type Rarity = z.infer<typeof RaritySchema>;

export const AttributeTraitSchema = z.enum([
  "BEARD",
  "BODY",
  "EARS",
  "EYES",
  "EYEBROWS",
  "FACE",
  "NOSE",
  "TAIL",
]);
export type AttributeTrait = z.infer<typeof AttributeTraitSchema>;

export const PetAttributeSchema = z.object({
  trait: AttributeTraitSchema,
  value: z.string(),
  rarity: RaritySchema,
});
export type PetAttribute = z.infer<typeof PetAttributeSchema>;

export const MintRequestSchema = z.object({
  species: SpeciesSchema,
});
export type MintRequest = z.infer<typeof MintRequestSchema>;
