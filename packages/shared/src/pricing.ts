import type { PaymentPurpose } from "./schemas/payment";

/**
 * Server-side price list. Clients NEVER provide the price — they request a
 * purpose, and we look it up here. This prevents replay/amount tampering.
 *
 * Prices are denominated in Pi (decimal strings to avoid float drift).
 */
export const PRICE_LIST: Record<PaymentPurpose, string> = {
  MINT: "1.00", // 1 Pi → mints a Gen-0 pet (subject to vitality gate)
  PET_PURCHASE: "0", // resolved per-listing at intent time
  LISTING_FEE: "0.10",
  TOPUP: "0", // user-specified, resolved at intent time
};

export const PI_TO_PET_RATIO = 100n; // 1 Pi = 100 Pet (from PI ANIMALS whitepaper)

export function memoFor(purpose: PaymentPurpose, metadata: Record<string, unknown>): string {
  switch (purpose) {
    case "MINT":
      return `PI ANIMALS mint: ${metadata.species ?? "unknown"}`;
    case "PET_PURCHASE":
      return `PI ANIMALS purchase: listing ${metadata.listingId ?? ""}`;
    case "LISTING_FEE":
      return `PI ANIMALS listing fee: pet ${metadata.petId ?? ""}`;
    case "TOPUP":
      return `PI ANIMALS Pet top-up`;
  }
}
