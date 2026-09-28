import { z } from "zod";

export const agreementTemplateMutationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  category: z.string().trim().min(1).max(100),
  feeType: z.enum(["PERCENTAGE", "FIXED"]),
  feeValue: z.number().finite().positive().max(1_000_000_000),
  invoiceRule: z.enum(["ON_OFFER", "ON_JOINING", "DAY_25", "DAY_30", "SPLIT_50_50"]),
  replacementDays: z.number().int().min(0).max(3650),
  validityMonths: z.number().int().min(1).max(120),
  advancePayment: z.number().finite().min(0).max(1_000_000_000),
  creditTermsDays: z.number().int().min(0).max(365),
  standardDiscountPct: z.number().finite().min(0).max(100),
  taxRatePct: z.number().finite().min(0).max(100),
  specialClauses: z.array(z.string().trim().min(1).max(10_000)).max(100),
  commercialNotes: z.string().trim().max(10_000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.feeType === "PERCENTAGE" && value.feeValue > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["feeValue"], message: "Percentage fee cannot exceed 100%." });
  }
});

export const agreementTemplateUpdateSchema = agreementTemplateMutationSchema.and(
  z.object({ expectedUpdatedAt: z.string().datetime() }).strict(),
);

export const agreementTemplateActionSchema = z.object({
  action: z.literal("duplicate"),
}).strict();
