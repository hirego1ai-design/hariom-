import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";
import { countryCodeSchema } from "./contracts";

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
  taxMode: "TAX_EXCLUSIVE" | "TAX_INCLUSIVE" | "MERCHANT_OF_RECORD";
  paymentRoute: "PAYU" | "STRIPE" | "MERCHANT_OF_RECORD";
};

export function normalizeCountryCode(value: string): string {
  return countryCodeSchema.parse(value);
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
        taxInclusive: price.taxMode === "TAX_INCLUSIVE" || price.taxMode === "MERCHANT_OF_RECORD",
        taxesMayApplyAtCheckout: price.taxMode === "TAX_EXCLUSIVE",
        checkoutAvailable: price.paymentRoute !== "MERCHANT_OF_RECORD",
      },
    }];
  });
}
