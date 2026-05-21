import { describe, expect, it } from "vitest";
import { memoFor, PI_TO_PET_RATIO, PRICE_LIST } from "@pianimals/shared";

describe("pricing constants", () => {
  it("Pi → Pet ratio matches PI ANIMALS whitepaper (1 Pi = 100 Pet)", () => {
    expect(PI_TO_PET_RATIO).toBe(100n);
  });

  it("MINT price is fixed at 1 Pi", () => {
    expect(PRICE_LIST.MINT).toBe("1.00");
  });

  it("memo includes species for MINT", () => {
    expect(memoFor("MINT", { species: "DOG" })).toContain("DOG");
  });

  it("memo includes listing id for PET_PURCHASE", () => {
    expect(memoFor("PET_PURCHASE", { listingId: "L42" })).toContain("L42");
  });
});
