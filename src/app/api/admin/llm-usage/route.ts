import { NextRequest, NextResponse } from "next/server";
import { getAiUsageStats } from "@/utils";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_llm_usage:${admin.id}`, 30, 60_000);
    const stats = await getAiUsageStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
