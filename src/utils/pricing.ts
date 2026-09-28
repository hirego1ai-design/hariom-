export type CommercialPricingModel = "PERCENTAGE" | "FIXED" | "HYBRID" | "SLAB";

export interface CommercialPricingSlab {
  upToCtcAnnual: number | null;
  feePct: number;
}

export interface PricingCalculationParams {
  ctoAmount?: number;
  ctcAnnual?: number;
  pricingModel: CommercialPricingModel;
  feeValue?: number; // Percentage or fixed amount; required except for SLAB.
  retainerAmount?: number; // Required for HYBRID model.
  discountPct?: number;
  taxRatePct: number;
  replacementDays: number;
  slabs?: CommercialPricingSlab[]; // Required for SLAB model.
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

function requireFiniteNonNegative(value: number | undefined, field: string): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} is required and must be a finite non-negative number.`);
  }
  return value;
}

function validateSlabs(slabs: CommercialPricingSlab[] | undefined): CommercialPricingSlab[] {
  if (!slabs || slabs.length === 0) {
    throw new Error("slabs are required for SLAB pricing.");
  }

  let previousUpperBound = 0;
  let openEndedSeen = false;
  for (let index = 0; index < slabs.length; index += 1) {
    const slab = slabs[index];
    if (!Number.isFinite(slab.feePct) || slab.feePct < 0 || slab.feePct > 100) {
      throw new Error("Each slab feePct must be between 0 and 100.");
    }
    if (slab.upToCtcAnnual === null) {
      if (openEndedSeen || index !== slabs.length - 1) {
        throw new Error("An open-ended slab must appear exactly once and only as the final slab.");
      }
      openEndedSeen = true;
      continue;
    }
    if (!Number.isFinite(slab.upToCtcAnnual) || slab.upToCtcAnnual <= previousUpperBound) {
      throw new Error("Slab upper bounds must be finite, positive, and strictly increasing.");
    }
    previousUpperBound = slab.upToCtcAnnual;
  }

  if (!openEndedSeen) {
    throw new Error("SLAB pricing requires a final open-ended slab.");
  }
  return slabs;
}

export function calculateCommercialFee(params: PricingCalculationParams): PricingCalculationResult {
  const ctc = params.ctcAnnual ?? params.ctoAmount;
  if (ctc === undefined || !Number.isFinite(ctc) || ctc <= 0) {
    throw new Error("ctcAnnual is required and must be a finite positive number.");
  }

  const discountPct = params.discountPct ?? 0;
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
    throw new Error("discountPct must be between 0 and 100.");
  }

  const taxRatePct = requireFiniteNonNegative(params.taxRatePct, "taxRatePct");
  if (taxRatePct > 100) throw new Error("taxRatePct must be between 0 and 100.");

  const replacementDays = requireFiniteNonNegative(params.replacementDays, "replacementDays");
  if (!Number.isInteger(replacementDays) || replacementDays > 3650) {
    throw new Error("replacementDays must be an integer between 0 and 3650.");
  }

  let baseFee = 0;
  let retainerFee = 0;
  let successFee = 0;

  if (params.pricingModel === "FIXED") {
    baseFee = requireFiniteNonNegative(params.feeValue, "feeValue");
    successFee = baseFee;
  } else if (params.pricingModel === "PERCENTAGE") {
    const feePct = requireFiniteNonNegative(params.feeValue, "feeValue");
    if (feePct > 100) throw new Error("Percentage feeValue must be between 0 and 100.");
    baseFee = Math.round(ctc * (feePct / 100));
    successFee = baseFee;
  } else if (params.pricingModel === "HYBRID") {
    retainerFee = requireFiniteNonNegative(params.retainerAmount, "retainerAmount");
    const successPct = requireFiniteNonNegative(params.feeValue, "feeValue");
    if (successPct > 100) throw new Error("Hybrid feeValue must be between 0 and 100.");
    successFee = Math.round(ctc * (successPct / 100));
    baseFee = retainerFee + successFee;
  } else if (params.pricingModel === "SLAB") {
    const slabs = validateSlabs(params.slabs);
    const matchedSlab = slabs.find((slab) => slab.upToCtcAnnual === null || ctc <= slab.upToCtcAnnual);
    if (!matchedSlab) throw new Error("No pricing slab matches the supplied CTC.");
    baseFee = Math.round(ctc * (matchedSlab.feePct / 100));
    successFee = baseFee;
  } else {
    throw new Error("Unsupported pricing model.");
  }

  const grossFee = baseFee;
  const discountAmount = Math.round((grossFee * discountPct) / 100);
  const subtotal = Math.max(0, grossFee - discountAmount);
  const taxAmount = Math.round((subtotal * taxRatePct) / 100);
  const totalAmount = subtotal + taxAmount;
  const effectivePct = Number(((subtotal / ctc) * 100).toFixed(2));

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
