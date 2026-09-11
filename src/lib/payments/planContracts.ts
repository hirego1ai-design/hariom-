import { z } from "zod";

// Existing persisted plans use legacy IDs; accept those without rewriting FKs.
// The checkout route still resolves the plan and price from the database.
export const planIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

const quota = z.number().int().min(0).max(2_147_483_647);
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
  featuresAllowed: z.array(z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/)).max(100),
  validityMonths: z.number().int().min(1).max(120),
};

export const createPlanSchema = z.object(planFields).strict();
export const updatePlanSchema = z.object(planFields).partial()
  .extend({ id: planIdSchema }).strict()
  .refine(value => Object.keys(value).some(key => key !== "id"), "No plan changes supplied.");

export const checkoutSchema = z.object({
  planId: planIdSchema,
  paymentMethod: z.enum(["RAZORPAY", "STRIPE", "PAYU", "PHONEPE", "AUTO"]).optional(),
  promoCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict();
