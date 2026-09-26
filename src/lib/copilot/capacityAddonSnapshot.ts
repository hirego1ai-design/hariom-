import { z } from "zod";
import type { ResolvedCapacityOffer } from "./capacityOffers";

export const copilotCapacityAddonSnapshotSchema = z.object({
  version: z.literal(1),
  productType: z.literal("COPILOT_ADDON"),
  offerId: z.string().min(1).max(128),
  offerCode: z.string().min(1).max(64),
  offerName: z.string().min(1).max(100),
  subscriptionId: z.string().uuid(),
  billingCycleId: z.string().uuid(),
  billingCountry: z.string().regex(/^[A-Z]{2}$/),
  regionCode: z.string().min(1).max(32),
  currency: z.string().regex(/^[A-Z]{3}$/),
  baseAmountMinor: z.number().int().positive(),
  taxMinor: z.number().int().min(0),
  amountMinor: z.number().int().positive(),
  capacityUnits: z.number().int().positive(),
  taxMode: z.enum(["NO_TAX_COLLECTION", "TAX_EXCLUSIVE", "TAX_INCLUSIVE", "MERCHANT_OF_RECORD"]),
  taxRateBps: z.number().int().min(0).max(10_000),
  paymentRoute: z.enum(["PAYU", "STRIPE", "MERCHANT_OF_RECORD"]),
  expiresAt: z.string().datetime(),
}).strict();

export type CopilotCapacityAddonSnapshot = z.infer<typeof copilotCapacityAddonSnapshotSchema>;

export function createCopilotCapacityAddonSnapshot(
  offer: ResolvedCapacityOffer,
  subscriptionId: string,
  billingCycleId: string,
  expiresAt: Date,
): CopilotCapacityAddonSnapshot {
  return copilotCapacityAddonSnapshotSchema.parse({
    version: 1,
    productType: "COPILOT_ADDON",
    offerId: offer.offerId,
    offerCode: offer.offerCode,
    offerName: offer.offerName,
    subscriptionId,
    billingCycleId,
    billingCountry: offer.countryCode,
    regionCode: offer.regionCode,
    currency: offer.currency,
    baseAmountMinor: offer.amountMinor,
    taxMinor: offer.taxMinor,
    amountMinor: offer.totalAmountMinor,
    capacityUnits: offer.capacityUnits,
    taxMode: offer.taxMode,
    taxRateBps: offer.taxRateBps,
    paymentRoute: offer.paymentRoute,
    expiresAt: expiresAt.toISOString(),
  });
}

export function parseCopilotCapacityAddonSnapshot(value: unknown): CopilotCapacityAddonSnapshot {
  return copilotCapacityAddonSnapshotSchema.parse(value);
}
