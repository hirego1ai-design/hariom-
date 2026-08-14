export type CommercialPricingModel = "PERCENTAGE" | "FIXED" | "HYBRID" | "SLAB";

export interface PricingCalculationParams {
  ctoAmount?: number;
  ctcAnnual?: number;
  pricingModel: CommercialPricingModel;
  feeValue: number; // Percentage or fixed amount
  retainerAmount?: number; // For HYBRID model
  discountPct?: number;
  taxRatePct?: number; // Default 18% GST
  replacementDays?: number;
}

export interface PricingCalculationResult {
  baseFee: number;
  retainerFee: number;
  successFee: number;
  grossFee: number;
  discountPct: number;
  discountAmount: number;
  subtotal: number;
  taxRatePct: number;
  taxAmount: number;
  totalAmount: number;
  effectivePct: number;
  replacementWarrantyDays: number;
}

export function calculateCommercialFee(params: PricingCalculationParams): PricingCalculationResult {
  const ctc = params.ctcAnnual || params.ctoAmount || 1500000;
  const discountPct = Math.max(0, Math.min(100, params.discountPct || 0));
  const taxRatePct = params.taxRatePct !== undefined ? params.taxRatePct : 18.0;
  const replacementDays = params.replacementDays || 60;

  let baseFee = 0;
  let retainerFee = 0;
  let successFee = 0;

  if (params.pricingModel === "FIXED") {
    baseFee = params.feeValue || 50000;
    successFee = baseFee;
  } else if (params.pricingModel === "PERCENTAGE") {
    const rate = (params.feeValue || 8.33) / 100;
    baseFee = Math.round(ctc * rate);
    successFee = baseFee;
  } else if (params.pricingModel === "HYBRID") {
    retainerFee = params.retainerAmount || 25000;
    const successRate = (params.feeValue || 5.0) / 100;
    successFee = Math.round(ctc * successRate);
    baseFee = retainerFee + successFee;
  } else if (params.pricingModel === "SLAB") {
    // Slab logic: CTC <= 10L: 8.33%, 10L-25L: 10%, >25L: 12.5%
    let slabRate = 0.0833;
    if (ctc > 2500000) slabRate = 0.125;
    else if (ctc > 1000000) slabRate = 0.10;
    
    baseFee = Math.round(ctc * slabRate);
    successFee = baseFee;
  }

  const grossFee = baseFee;
  const discountAmount = Math.round((grossFee * discountPct) / 100);
  const subtotal = Math.max(0, grossFee - discountAmount);
  const taxAmount = Math.round((subtotal * taxRatePct) / 100);
  const totalAmount = subtotal + taxAmount;
  const effectivePct = ctc > 0 ? Number(((subtotal / ctc) * 100).toFixed(2)) : 0;

  return {
    baseFee,
    retainerFee,
    successFee,
    grossFee,
    discountPct,
    discountAmount,
    subtotal,
    taxRatePct,
    taxAmount,
    totalAmount,
    effectivePct,
    replacementWarrantyDays: replacementDays,
  };
}
