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
  amountMinor: z.number().int().positive(),
  capacityUnits: z.number().int().positive(),
  taxMode: z.enum(["TAX_EXCLUSIVE", "TAX_INCLUSIVE", "MERCHANT_OF_RECORD"]),
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
    amountMinor: offer.amountMinor,
    capacityUnits: offer.capacityUnits,
    taxMode: offer.taxMode,
    paymentRoute: offer.paymentRoute,
    expiresAt: expiresAt.toISOString(),
  });
}

export function parseCopilotCapacityAddonSnapshot(value: unknown): CopilotCapacityAddonSnapshot {
  return copilotCapacityAddonSnapshotSchema.parse(value);
}
