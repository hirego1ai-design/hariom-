import { z } from "zod";
import type { ResolvedCopilotPrice } from "./commerce";

export const copilotPurchaseSnapshotSchema = z.object({
  version: z.literal(1),
  productType: z.literal("COPILOT"),
  planId: z.string().min(1).max(128),
  planCode: z.string().min(1).max(100),
  planName: z.string().min(1).max(200),
  billingCountry: z.string().regex(/^[A-Z]{2}$/),
  regionCode: z.string().min(1).max(32),
  currency: z.string().regex(/^[A-Z]{3}$/),
  amountMinor: z.number().int().positive(),
  taxMode: z.enum(["TAX_EXCLUSIVE", "TAX_INCLUSIVE", "MERCHANT_OF_RECORD"]),
  paymentRoute: z.enum(["PAYU", "STRIPE", "MERCHANT_OF_RECORD"]),
  validityMonths: z.number().int().min(1).max(120),
  monthlyCapacityUnits: z.number().int().positive(),
  softWarningPct: z.number().int().min(1).max(99),
  hardWarningPct: z.number().int().min(2).max(100),
  featuresAllowed: z.array(z.string().min(1).max(100)).max(100),
}).strict().refine((v) => v.softWarningPct < v.hardWarningPct, "Invalid Copilot warning thresholds.");

export type CopilotPurchaseSnapshot = z.infer<typeof copilotPurchaseSnapshotSchema>;

export function createCopilotPurchaseSnapshot(
  price: ResolvedCopilotPrice,
  plan: { monthlyCapacityUnits: number; softWarningPct: number; hardWarningPct: number },
): CopilotPurchaseSnapshot {
  return copilotPurchaseSnapshotSchema.parse({
    version: 1,
    productType: "COPILOT",
    planId: price.planId,
    planCode: price.planCode,
    planName: price.planName,
    billingCountry: price.countryCode,
    regionCode: price.regionCode,
    currency: price.currency,
    amountMinor: price.amountMinor,
    taxMode: price.taxMode,
    paymentRoute: price.paymentRoute,
    validityMonths: price.validityMonths,
    monthlyCapacityUnits: plan.monthlyCapacityUnits,
    softWarningPct: plan.softWarningPct,
    hardWarningPct: plan.hardWarningPct,
    featuresAllowed: price.featuresAllowed,
  });
}

export function parseCopilotPurchaseSnapshot(value: unknown): CopilotPurchaseSnapshot {
  return copilotPurchaseSnapshotSchema.parse(value);
}
