import { NextRequest, NextResponse } from "next/server";
import { calculateCommercialFee, CommercialPricingModel } from "@/utils";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";
import { z } from "zod";

const pricingRequestSchema = z.object({
  ctcAnnual: z.number().finite().positive().max(1_000_000_000).optional(),
  ctc: z.number().finite().positive().max(1_000_000_000).optional(),
  pricingModel: z.enum(["PERCENTAGE", "FIXED", "HYBRID", "SLAB"]),
  feeValue: z.number().finite().nonnegative().max(100_000_000).optional(),
  retainerAmount: z.number().finite().nonnegative().max(100_000_000).optional(),
  discountPct: z.number().finite().min(0).max(100).optional(),
  taxRatePct: z.number().finite().min(0).max(100).optional(),
  replacementDays: z.number().int().min(0).max(3650).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const parsed = pricingRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid pricing parameters", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    const ctcAnnual = body.ctcAnnual ?? body.ctc ?? 1_500_000;
    const pricingModel: CommercialPricingModel = body.pricingModel;
    const feeValue = body.feeValue ?? (pricingModel === "PERCENTAGE" ? 8.33 : 50_000);
    const retainerAmount = body.retainerAmount ?? 25_000;
    const discountPct = body.discountPct ?? 0;
    const taxRatePct = body.taxRatePct ?? 18.0;
    const replacementDays = body.replacementDays ?? 60;

    const calculation = calculateCommercialFee({
      ctcAnnual,
      pricingModel,
      feeValue,
      retainerAmount,
      discountPct,
      taxRatePct,
      replacementDays,
    });

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
