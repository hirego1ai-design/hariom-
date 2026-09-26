import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { getLiveInterviewProctoringPolicy, liveInterviewProctoringPolicySchema, saveLiveInterviewProctoringPolicy } from "@/lib/proctoringPolicy";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_proctoring_policy_read", 60, 60_000);
    return NextResponse.json({ success: true, policy: await getLiveInterviewProctoringPolicy() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_proctoring_policy_write:${session.id}`, 10, 60_000);
    const body = await readValidatedJson(request, liveInterviewProctoringPolicySchema, 8 * 1024);
    const policy = await saveLiveInterviewProctoringPolicy(body);
    await logAuditEvent({
      userId: session.id,
      action: "LIVE_INTERVIEW_PROCTORING_POLICY_UPDATED",
      resource: "AdminConfiguration:securityPolicy",
      details: JSON.stringify(policy),
    });
    return NextResponse.json({ success: true, policy });
  } catch (error) {
    return handleApiError(error);
  }
}
