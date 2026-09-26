import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import {
  getLiveInterviewProctoringPolicy,
  liveInterviewProctoringPolicySchema,
  saveLiveInterviewProctoringPolicy,
} from "@/lib/liveInterviewProctoringPolicy";

const updateSchema = z.object({
  policy: liveInterviewProctoringPolicySchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_live_proctoring_policy_read", 60, 60_000);
    const policy = await getLiveInterviewProctoringPolicy();
    return NextResponse.json({
      success: true,
      policy,
      supportedEvents: Object.keys(policy.events),
      unsupportedClaims: ["FACE_NOT_DETECTED", "MULTIPLE_FACES", "AUDIO_ANOMALY"],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_live_proctoring_policy_write:${session.id}`, 10, 60_000);
    const payload = await readValidatedJson(request, updateSchema, 16 * 1024);
    const previous = await getLiveInterviewProctoringPolicy();
    await saveLiveInterviewProctoringPolicy(payload.policy);
    await logAuditEvent({
      userId: session.id,
      action: "LIVE_INTERVIEW_PROCTORING_POLICY_UPDATED",
      resource: "AdminConfiguration:liveInterviewProctoring",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      details: JSON.stringify({ previous, next: payload.policy, reason: payload.reason || null }),
    });
    return NextResponse.json({ success: true, policy: payload.policy });
  } catch (error) {
    return handleApiError(error);
  }
}
