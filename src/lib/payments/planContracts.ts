import { z } from "zod";
import { SUBSCRIPTION_FEATURE_KEYS } from "@/lib/subscriptionFeatures";

// Existing persisted plans use legacy IDs; accept those without rewriting FKs.
// Checkout always resolves commercial terms from the database.
export const planIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

export const planTypeSchema = z.enum(["FREE_TRIAL", "STANDARD", "COPILOT"]);
const quota = z.number().int().min(0).max(2_147_483_647);
const benefit = z.string().trim().min(1).max(180).regex(/^[^<>\u0000-\u001F\u007F]+$/);
const featureKey = z.enum(SUBSCRIPTION_FEATURE_KEYS);
const badge = z.string().trim().min(1).max(80).regex(/^[^<>\u0000-\u001F\u007F]+$/);

const planFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  price: z.number().finite().min(0).max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  jobPostsQuota: quota,
  // Legacy quota columns remain for backward compatibility but are not part of
  // the new customer-facing per-AI-action billing model.
  resumeUnlocksQuota: quota.default(0),
  aiInterviewsQuota: quota.default(0),
  applicationsQuota: quota.default(0),
  resumeDownloadsQuota: quota.default(0),
  backgroundVerificationsQuota: quota.default(0),
  featuresAllowed: z.array(featureKey).max(100),
  displayBenefits: z.array(benefit).max(30),
  validityMonths: z.number().int().min(1).max(120),
  jobValidityDays: z.number().int().min(1).max(365),
  planType: planTypeSchema,
  firstTimeOnly: z.boolean(),
  copilotJobsQuota: quota,
  copilotAutoActivate: z.boolean(),
  badge: badge.nullable().optional(),
  isFeatured: z.boolean(),
  displayOrder: z.number().int().min(-10_000).max(10_000),
};

function validatePlanRules(value: {
  planType: "FREE_TRIAL" | "STANDARD" | "COPILOT";
  price: number;
  firstTimeOnly: boolean;
  copilotJobsQuota: number;
  copilotAutoActivate: boolean;
}, ctx: z.RefinementCtx) {
  if (value.planType === "FREE_TRIAL" && (value.price !== 0 || !value.firstTimeOnly)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Free-trial plans must be zero-price and first-time-only." });
  }
  if (value.planType === "COPILOT" && value.copilotJobsQuota < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["copilotJobsQuota"], message: "Co-Pilot plans must include at least one Co-Pilot job." });
  }
  if (value.copilotAutoActivate && value.copilotJobsQuota < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["copilotAutoActivate"], message: "Auto-activation requires a Co-Pilot job quota." });
  }
}

export const createPlanSchema = z.object(planFields).strict().superRefine(validatePlanRules);
export const updatePlanSchema = z.object(planFields).partial()
  .extend({ id: planIdSchema }).strict()
  .refine(value => Object.keys(value).some(key => key !== "id"), "No plan changes supplied.");

export const checkoutSchema = z.object({
  planId: planIdSchema,
  paymentMethod: z.enum(["STRIPE", "PAYU", "AUTO"]).optional(),
  promoCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict();

export const complimentaryActivationSchema = z.object({
  planId: planIdSchema,
}).strict();
