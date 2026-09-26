import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { getCopilotCapacityStatus } from "@/lib/copilot/capacity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_copilot_capacity", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") {
      throw Object.assign(new Error("Administrator capacity reads require an explicitly scoped admin endpoint."), { status: 400 });
    }
    const company = await getSessionCompany(session);
    const capacity = await getCopilotCapacityStatus(company.id);

    return NextResponse.json({
      success: true,
      product: "COPILOT",
      capacity,
      policy: {
        customerFacingCredits: false,
        finalHiresMetered: false,
        jobPostingSeparate: true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
