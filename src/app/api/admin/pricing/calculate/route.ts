import { NextRequest, NextResponse } from "next/server";
import { calculateCommercialFee } from "@/utils";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { z } from "zod";

const commonPricingFields = {
  ctcAnnual: z.number().finite().positive().max(1_000_000_000).optional(),
  ctc: z.number().finite().positive().max(1_000_000_000).optional(),
  discountPct: z.number().finite().min(0).max(100).optional(),
  taxRatePct: z.number().finite().min(0).max(100),
  replacementDays: z.number().int().min(0).max(3650),
};

const slabSchema = z.object({
  upToCtcAnnual: z.number().finite().positive().max(1_000_000_000).nullable(),
  feePct: z.number().finite().min(0).max(100),
}).strict();

const pricingRequestSchema = z.discriminatedUnion("pricingModel", [
  z.object({
    ...commonPricingFields,
    pricingModel: z.literal("PERCENTAGE"),
    feeValue: z.number().finite().min(0).max(100),
  }).strict(),
  z.object({
    ...commonPricingFields,
    pricingModel: z.literal("FIXED"),
    feeValue: z.number().finite().nonnegative().max(1_000_000_000),
  }).strict(),
  z.object({
    ...commonPricingFields,
    pricingModel: z.literal("HYBRID"),
    feeValue: z.number().finite().min(0).max(100),
    retainerAmount: z.number().finite().nonnegative().max(1_000_000_000),
  }).strict(),
  z.object({
    ...commonPricingFields,
    pricingModel: z.literal("SLAB"),
    slabs: z.array(slabSchema).min(1).max(20),
  }).strict(),
]).superRefine((value, ctx) => {
  if (value.ctcAnnual === undefined && value.ctc === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ctcAnnual is required", path: ["ctcAnnual"] });
  }
});

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_pricing_calculate", 60, 60_000);
    const body = await readValidatedJson(req, pricingRequestSchema);

    const ctcAnnual = body.ctcAnnual ?? body.ctc;
    if (ctcAnnual === undefined) {
      return NextResponse.json({ success: false, error: "ctcAnnual is required" }, { status: 400 });
    }

    const calculation = calculateCommercialFee({
      ctcAnnual,
      pricingModel: body.pricingModel,
      feeValue: "feeValue" in body ? body.feeValue : undefined,
      retainerAmount: "retainerAmount" in body ? body.retainerAmount : undefined,
      discountPct: body.discountPct,
      taxRatePct: body.taxRatePct,
      replacementDays: body.replacementDays,
      slabs: "slabs" in body ? body.slabs : undefined,
    });

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
