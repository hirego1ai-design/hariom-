import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";
import { normalizeCountryCode } from "./commerce";

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
  taxMode: "TAX_EXCLUSIVE" | "TAX_INCLUSIVE" | "MERCHANT_OF_RECORD";
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
        taxInclusive: price.taxMode === "TAX_INCLUSIVE" || price.taxMode === "MERCHANT_OF_RECORD",
        taxesMayApplyAtCheckout: price.taxMode === "TAX_EXCLUSIVE",
        checkoutAvailable: price.paymentRoute !== "MERCHANT_OF_RECORD",
      },
    }];
  });
}
