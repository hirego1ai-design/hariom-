import { z } from "zod";

export const countryCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/);

export const copilotCheckoutSchema = z.object({
  planId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
  countryCode: countryCodeSchema,
  paymentMethod: z.enum(["STRIPE", "PAYU"]).optional(),
}).strict();

export const copilotAdminPatchSchema = z.union([
  z.object({
    type: z.literal("PLAN"),
    planId: z.string().min(1).max(128),
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    monthlyCapacityUnits: z.number().int().min(1).max(10_000_000).optional(),
    softWarningPct: z.number().int().min(1).max(98).optional(),
    hardWarningPct: z.number().int().min(2).max(100).optional(),
    featuresAllowed: z.array(z.string().regex(/^[A-Z0-9_]+$/)).max(100).optional(),
    isArchived: z.boolean().optional(),
  }).strict().refine((v) => Object.keys(v).length > 2, "No plan changes supplied.")
    .refine((v) => v.softWarningPct === undefined || v.hardWarningPct === undefined || v.softWarningPct < v.hardWarningPct,
      "softWarningPct must be below hardWarningPct"),
  z.object({
    type: z.literal("PRICE"),
    priceId: z.string().min(1).max(128),
    currency: z.string().regex(/^[A-Z]{3}$/).optional(),
    amountMinor: z.number().int().min(1).max(1_000_000_000).optional(),
    taxMode: z.enum(["TAX_EXCLUSIVE", "TAX_INCLUSIVE", "MERCHANT_OF_RECORD"]).optional(),
    paymentRoute: z.enum(["PAYU", "STRIPE", "MERCHANT_OF_RECORD"]).optional(),
    countries: z.array(countryCodeSchema).max(250).optional(),
    isActive: z.boolean().optional(),
  }).strict().refine((v) => Object.keys(v).length > 2, "No price changes supplied."),
  z.object({
    type: z.literal("USAGE_RULE"),
    actionKey: z.string().regex(/^[A-Z0-9_]+$/),
    unitsPerQuantity: z.number().int().min(1).max(1_000_000).optional(),
    estimatedCostMinor: z.number().int().min(0).max(1_000_000_000).optional(),
    estimatedCostCurrency: z.string().regex(/^[A-Z]{3}$/).optional(),
    expensive: z.boolean().optional(),
    active: z.boolean().optional(),
  }).strict().refine((v) => Object.keys(v).length > 2, "No usage rule changes supplied."),
]);

export type CopilotCheckoutInput = z.infer<typeof copilotCheckoutSchema>;
