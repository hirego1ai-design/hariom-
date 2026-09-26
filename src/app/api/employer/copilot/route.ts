import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getCurrentSession } from "@/lib/auth";

/**
 * Legacy per-job Co-Pilot entitlement endpoint.
 *
 * HireGo Copilot is now a standalone subscription with hidden capacity
 * metering. Keeping this route fail-closed prevents old clients from creating
 * a second, conflicting commercial entitlement model.
 */
async function retired(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "legacy_employer_copilot", 30, 60_000);
    return NextResponse.json({
      success: false,
      error: "Legacy per-job Co-Pilot activation is retired. Use the standalone HireGo Copilot subscription.",
      replacement: {
        page: "/employer/ai-hiring-copilot-hub",
        plansApi: "/api/copilot/plans",
        capacityApi: "/api/employer/copilot/capacity",
        checkoutApi: "/api/payments/copilot/checkout",
      },
    }, { status: 410, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  return retired(request);
}

export async function POST(request: NextRequest) {
  return retired(request);
}
