import { z } from "zod";

const agreementTemplateFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  category: z.string().trim().min(1).max(100),
  feeType: z.enum(["PERCENTAGE", "FIXED"]),
  feeValue: z.number().finite().positive().max(1_000_000_000),
  invoiceRule: z.enum([
    "ON_OFFER",
    "ON_JOINING",
    "DAY_25",
    "DAY_30",
    "SPLIT_50_50",
  ]),
  replacementDays: z.number().int().min(0).max(3650),
  validityMonths: z.number().int().min(1).max(120),
  advancePayment: z.number().finite().min(0).max(1_000_000_000),
  creditTermsDays: z.number().int().min(0).max(365),
  standardDiscountPct: z.number().finite().min(0).max(100),
  taxRatePct: z.number().finite().min(0).max(100),
  specialClauses: z.array(z.string().trim().min(1).max(10_000)).max(100),
  commercialNotes: z.string().trim().max(10_000).optional(),
}).strict();

function validateCommercialTerms(
  value: z.infer<typeof agreementTemplateFieldsSchema>,
  context: z.RefinementCtx,
) {
  if (value.feeType === "PERCENTAGE" && value.feeValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["feeValue"],
      message: "Percentage fee cannot exceed 100%.",
    });
  }
}

export const agreementTemplateMutationSchema =
  agreementTemplateFieldsSchema.superRefine(validateCommercialTerms);

export const agreementTemplateCreateSchema = agreementTemplateFieldsSchema
  .extend({
    reason: z.string().trim().min(3).max(1000),
  })
  .strict()
  .superRefine(validateCommercialTerms);

export const agreementTemplateUpdateSchema = agreementTemplateFieldsSchema
  .extend({
    expectedUpdatedAt: z.string().datetime(),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict()
  .superRefine(validateCommercialTerms);

export const agreementTemplateActionSchema = z.object({
  action: z.literal("duplicate"),
  expectedUpdatedAt: z.string().datetime(),
  reason: z.string().trim().min(3).max(1000),
}).strict();

export const agreementTemplateArchiveSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  reason: z.string().trim().min(3).max(1000),
}).strict();
