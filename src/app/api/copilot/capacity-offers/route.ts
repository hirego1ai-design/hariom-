import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { listPublicCapacityOffers } from "@/lib/copilot/capacityOffers";
import { normalizeCountryCode } from "@/lib/copilot/commerce";

export const dynamic = "force-dynamic";

function requestedCountry(req: NextRequest) {
  const explicit = req.nextUrl.searchParams.get("country");
  if (explicit) return normalizeCountryCode(explicit);
  const edgeCountry = req.headers.get("x-vercel-ip-country");
  return edgeCountry ? normalizeCountryCode(edgeCountry) : "US";
}

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "copilot_capacity_offers", 120, 60_000);
    const countryCode = requestedCountry(req);
    const offers = await listPublicCapacityOffers(countryCode);
    return NextResponse.json({ success: true, product: "COPILOT_ADDON", countryCode, offers });
  } catch (error) {
    if (error instanceof Error && /country/i.test(error.message)) {
      return handleApiError(new ApiError("A valid two-letter billing country is required.", 400));
    }
    return handleApiError(error);
  }
}
