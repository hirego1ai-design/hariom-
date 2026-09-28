import { z } from "zod";

export const planIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

const quota = z.number().int().min(0).max(2_147_483_647);
const safeFeature = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9 _-]*$/);
const safeMarketing = z.string().trim().min(1).max(160);
const optionalBadge = z.string().trim().max(80).nullable().optional();

const planFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  price: z.number().finite().min(0).max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  jobPostsQuota: quota,
  resumeUnlocksQuota: quota,
  aiInterviewsQuota: quota,
  applicationsQuota: quota,
  resumeDownloadsQuota: quota,
  backgroundVerificationsQuota: quota,
  featuresAllowed: z.array(safeFeature).max(100),
  marketingBenefits: z.array(safeMarketing).max(24),
  validityMonths: z.number().int().min(1).max(120),
  jobValidityDays: z.number().int().min(1).max(365),
  firstTimeOnly: z.boolean(),
  copilotIncluded: z.boolean(),
  copilotJobLimit: quota,
  isFeatured: z.boolean(),
  badgeText: optionalBadge,
  displayOrder: z.number().int().min(0).max(10000),
};

function validatePlanCommercialRules(value: {
  price?: number;
  firstTimeOnly?: boolean;
  copilotIncluded?: boolean;
  copilotJobLimit?: number;
}, ctx: z.RefinementCtx) {
  if (value.firstTimeOnly && value.price !== undefined && value.price !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["price"], message: "First-time-only plans must be zero-priced." });
  }
  if (value.copilotIncluded === true) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["copilotIncluded"], message: "Job-posting plans cannot bundle HireGo Copilot. Configure Copilot in the standalone Copilot commerce console." });
  }
  if (value.copilotJobLimit !== undefined && value.copilotJobLimit !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["copilotJobLimit"], message: "Legacy per-job Copilot entitlements are disabled; this value must remain zero." });
  }
}

export const createPlanSchema = z.object(planFields).strict().superRefine(validatePlanCommercialRules);
export const updatePlanSchema = z.object(planFields).partial()
  .extend({
    id: planIdSchema,
    expectedUpdatedAt: z.string().datetime(),
  }).strict()
  .refine(
    value => Object.keys(value).some(key => key !== "id" && key !== "expectedUpdatedAt"),
    "No plan changes supplied.",
  )
  .superRefine(validatePlanCommercialRules);

export const checkoutSchema = z.object({
  planId: planIdSchema,
  paymentMethod: z.enum(["STRIPE", "PAYU", "AUTO"]).optional(),
  promoCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict();

export const copilotConfigSchema = z.object({
  enabled: z.boolean(),
  addonPrice: z.number().finite().min(0).max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  addonJobLimit: z.number().int().min(1).max(10000),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  badgeText: z.string().trim().max(80).nullable().optional(),
  benefits: z.array(safeMarketing).min(1).max(24),
}).strict();
