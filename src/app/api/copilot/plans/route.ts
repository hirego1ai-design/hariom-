import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { listPublicCopilotPlans, normalizeCountryCode } from "@/lib/copilot/commerce";

export const dynamic = "force-dynamic";

function requestedCountry(req: NextRequest) {
  const explicit = req.nextUrl.searchParams.get("country");
  if (explicit) return normalizeCountryCode(explicit);

  // Vercel supplies this header at the trusted edge. It is only a display-price
  // hint; checkout requires the billing country to be supplied and snapshotted.
  const edgeCountry = req.headers.get("x-vercel-ip-country");
  if (edgeCountry) return normalizeCountryCode(edgeCountry);

  return "US";
}

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "copilot_public_plans", 120, 60_000);
    const countryCode = requestedCountry(req);
    const plans = await listPublicCopilotPlans(countryCode);

    return NextResponse.json({
      success: true,
      product: "COPILOT",
      countryCode,
      plans,
      policy: {
        jobPostingSeparate: true,
        sourcingIncludedInCopilot: false,
        jdGenerationConsumesCapacity: false,
        hiringDecisionRemainsHuman: true,
      },
    });
  } catch (error) {
    if (error instanceof Error && /country/i.test(error.message)) {
      return handleApiError(new ApiError("A valid two-letter billing country is required.", 400));
    }
    return handleApiError(error);
  }
}
