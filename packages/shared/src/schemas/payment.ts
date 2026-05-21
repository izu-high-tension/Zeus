import { z } from "zod";

export const PaymentPurposeSchema = z.enum([
  "MINT",
  "PET_PURCHASE",
  "LISTING_FEE",
  "TOPUP",
]);
export type PaymentPurpose = z.infer<typeof PaymentPurposeSchema>;

export const PaymentIntentRequestSchema = z.object({
  purpose: PaymentPurposeSchema,
  // Purpose-dependent metadata. Server validates the shape & amount.
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type PaymentIntentRequest = z.infer<typeof PaymentIntentRequestSchema>;

export const PaymentIntentResponseSchema = z.object({
  idempotencyKey: z.string().uuid(),
  amountPi: z.string(), // decimal string
  memo: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>;

export const PaymentApproveRequestSchema = z.object({
  paymentId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
});
export type PaymentApproveRequest = z.infer<typeof PaymentApproveRequestSchema>;

export const PaymentCompleteRequestSchema = z.object({
  paymentId: z.string().min(1),
  txid: z.string().min(1),
});
export type PaymentCompleteRequest = z.infer<typeof PaymentCompleteRequestSchema>;
