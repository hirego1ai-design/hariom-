import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, jsonError } from "@/lib/apiSecurity";
import { getLiveInterviewProctoringPolicy } from "@/lib/proctoringPolicy";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    await enforceRateLimit(request, "proctoring_policy_read", 60, 60_000);
    const policy = await getLiveInterviewProctoringPolicy();
    return NextResponse.json({ success: true, policy }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
