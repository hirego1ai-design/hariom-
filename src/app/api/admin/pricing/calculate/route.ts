import { NextRequest, NextResponse } from "next/server";
import { calculateCommercialFee, CommercialPricingModel } from "@/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ctcAnnual = Number(body.ctcAnnual || body.ctc) || 1500000;
    const pricingModel: CommercialPricingModel = body.pricingModel || "PERCENTAGE";
    const feeValue = Number(body.feeValue) || (pricingModel === "PERCENTAGE" ? 8.33 : 50000);
    const retainerAmount = Number(body.retainerAmount) || 25000;
    const discountPct = Number(body.discountPct) || 0;
    const taxRatePct = body.taxRatePct !== undefined ? Number(body.taxRatePct) : 18.0;
    const replacementDays = Number(body.replacementDays) || 60;

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
