import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";
import { calculateCopilotTax, normalizeCountryCode } from "./commerce";
import { assertCurrentCopilotTaxPolicy } from "./taxPolicy";

export type ResolvedCapacityOffer = {
  offerId: string;
  offerCode: string;
  offerName: string;
  description: string;
  capacityUnits: number;
  countryCode: string;
  regionCode: string;
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

function selectPrice<T extends { regionCode: string; countries: string[]; isActive: boolean }>(prices: T[], countryCode: string) {
  return prices.find((price) => price.isActive && price.countries.includes(countryCode))
    || prices.find((price) => price.isActive && price.regionCode === "ROW")
    || null;
}

export async function resolveCapacityOffer(offerId: string, countryInput: string): Promise<ResolvedCapacityOffer> {
  const countryCode = normalizeCountryCode(countryInput);
  const offer = await prisma.copilotCapacityOffer.findUnique({
    where: { id: offerId },
    include: { regionalPrices: true },
  });
  if (!offer || offer.isArchived) throw new ApiError("Copilot capacity offer not found.", 404);
  const price = selectPrice(offer.regionalPrices, countryCode);
  if (!price) throw new ApiError("This capacity offer is not available for the billing country.", 409);

  assertCurrentCopilotTaxPolicy({
    regionCode: price.regionCode,
    countries: price.countries,
    taxMode: price.taxMode,
    taxRateBps: price.taxRateBps,
  });
  const tax = calculateCopilotTax(price.amountMinor, price.taxMode, price.taxRateBps);
  return {
    offerId: offer.id,
    offerCode: offer.code,
    offerName: offer.name,
    description: offer.description,
    capacityUnits: offer.capacityUnits,
    countryCode,
    regionCode: price.regionCode,
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

export async function listPublicCapacityOffers(countryInput: string) {
  const countryCode = normalizeCountryCode(countryInput);
  const offers = await prisma.copilotCapacityOffer.findMany({
    where: { isArchived: false },
    include: { regionalPrices: true },
    orderBy: { capacityUnits: "asc" },
  });

  return offers.flatMap((offer) => {
    const price = selectPrice(offer.regionalPrices, countryCode);
    if (!price) return [];
    assertCurrentCopilotTaxPolicy({
      regionCode: price.regionCode,
      countries: price.countries,
      taxMode: price.taxMode,
      taxRateBps: price.taxRateBps,
    });
    const tax = calculateCopilotTax(price.amountMinor, price.taxMode, price.taxRateBps);
    return [{
      id: offer.id,
      code: offer.code,
      name: offer.name,
      description: offer.description,
      price: {
        countryCode,
        regionCode: price.regionCode,
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
