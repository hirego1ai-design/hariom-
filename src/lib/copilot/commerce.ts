import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";
import { countryCodeSchema } from "./contracts";
import { assertCurrentCopilotTaxPolicy } from "./taxPolicy";

export type ResolvedCopilotPrice = {
  planId: string;
  planCode: string;
  planName: string;
  description: string;
  validityMonths: number;
  featuresAllowed: string[];
  priceId: string;
  regionCode: string;
  countryCode: string;
  currency: string;
  amountMinor: number;
  amount: number;
  taxRateBps: number;
  taxMinor: number;
  taxAmount: number;
  totalAmountMinor: number;
  totalAmount: number;
  taxMode: "NO_TAX_COLLECTION" | "TAX_EXCLUSIVE" | "TAX_INCLUSIVE" | "MERCHANT_OF_RECORD";
  paymentRoute: "PAYU" | "STRIPE" | "MERCHANT_OF_RECORD";
};

export function normalizeCountryCode(value: string): string {
  return countryCodeSchema.parse(value);
}

export function calculateCopilotTax(
  amountMinor: number,
  taxMode: "NO_TAX_COLLECTION" | "TAX_EXCLUSIVE" | "TAX_INCLUSIVE" | "MERCHANT_OF_RECORD",
  taxRateBps: number,
) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Invalid regional price.");
  if (!Number.isSafeInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10_000) throw new Error("Invalid regional tax rate.");

  if (taxMode === "NO_TAX_COLLECTION" || taxMode === "MERCHANT_OF_RECORD" || taxRateBps === 0) {
    return { taxMinor: 0, totalAmountMinor: amountMinor };
  }
  if (taxMode === "TAX_INCLUSIVE") {
    const taxMinor = Math.round((amountMinor * taxRateBps) / (10_000 + taxRateBps));
    return { taxMinor, totalAmountMinor: amountMinor };
  }
  const taxMinor = Math.round((amountMinor * taxRateBps) / 10_000);
  return { taxMinor, totalAmountMinor: amountMinor + taxMinor };
}

export function selectCopilotRegionalPrice<T extends { regionCode: string; countries: string[]; isActive: boolean }>(
  prices: T[],
  countryCode: string,
): T | null {
  const exact = prices.find((price) => price.isActive && price.countries.includes(countryCode));
  if (exact) return exact;
  return prices.find((price) => price.isActive && price.regionCode === "ROW") || null;
}

export async function resolveCopilotPrice(planId: string, countryInput: string): Promise<ResolvedCopilotPrice> {
  const countryCode = normalizeCountryCode(countryInput);
  const plan = await prisma.copilotPlan.findUnique({
    where: { id: planId },
    include: { regionalPrices: true },
  });
  if (!plan || plan.isArchived) throw new ApiError("Copilot plan not found.", 404);

  const price = selectCopilotRegionalPrice(plan.regionalPrices, countryCode);
  if (!price) throw new ApiError("Copilot is not currently available for this billing country.", 409);

  assertCurrentCopilotTaxPolicy({
    regionCode: price.regionCode,
    countries: price.countries,
    taxMode: price.taxMode,
    taxRateBps: price.taxRateBps,
  });
  const tax = calculateCopilotTax(price.amountMinor, price.taxMode, price.taxRateBps);

  return {
    planId: plan.id,
    planCode: plan.code,
    planName: plan.name,
    description: plan.description,
    validityMonths: plan.validityMonths,
    featuresAllowed: plan.featuresAllowed,
    priceId: price.id,
    regionCode: price.regionCode,
    countryCode,
    currency: price.currency,
    amountMinor: price.amountMinor,
    amount: price.amountMinor / 100,
    taxRateBps: price.taxRateBps,
    taxMinor: tax.taxMinor,
    taxAmount: tax.taxMinor / 100,
    totalAmountMinor: tax.totalAmountMinor,
    totalAmount: tax.totalAmountMinor / 100,
    taxMode: price.taxMode,
    paymentRoute: price.paymentRoute,
  };
}

export async function listPublicCopilotPlans(countryInput: string) {
  const countryCode = normalizeCountryCode(countryInput);
  const plans = await prisma.copilotPlan.findMany({
    where: { isArchived: false },
    include: { regionalPrices: true },
    orderBy: { monthlyCapacityUnits: "asc" },
  });

  return plans.flatMap((plan) => {
    const price = selectCopilotRegionalPrice(plan.regionalPrices, countryCode);
    if (!price) return [];
    assertCurrentCopilotTaxPolicy({
      regionCode: price.regionCode,
      countries: price.countries,
      taxMode: price.taxMode,
      taxRateBps: price.taxRateBps,
    });
    const tax = calculateCopilotTax(price.amountMinor, price.taxMode, price.taxRateBps);
    return [{
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      validityMonths: plan.validityMonths,
      featuresAllowed: plan.featuresAllowed,
      price: {
        regionCode: price.regionCode,
        countryCode,
        currency: price.currency,
        amount: price.amountMinor / 100,
        taxAmount: tax.taxMinor / 100,
        totalAmount: tax.totalAmountMinor / 100,
        taxRatePercent: price.taxRateBps / 100,
        taxLabel: countryCode === "IN" && price.taxRateBps > 0 ? "GST" : null,
        taxInclusive: price.taxMode === "TAX_INCLUSIVE",
        taxesMayApplyAtCheckout: price.taxMode === "TAX_EXCLUSIVE" && price.taxRateBps > 0,
        noTaxCollected: price.taxMode === "NO_TAX_COLLECTION",
        checkoutAvailable: price.paymentRoute !== "MERCHANT_OF_RECORD",
      },
    }];
  });
}
