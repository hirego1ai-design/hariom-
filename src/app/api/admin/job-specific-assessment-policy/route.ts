import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import {
  getJobSpecificAssessmentPolicy,
  jobSpecificAssessmentPolicySchema,
  saveJobSpecificAssessmentPolicy,
} from "@/lib/jobSpecificAssessmentPolicy";

const updateSchema = z.object({
  policy: jobSpecificAssessmentPolicySchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_job_specific_assessment_policy_read", 60, 60_000);
    let policy = null;
    try {
      policy = await getJobSpecificAssessmentPolicy();
    } catch {
      policy = null;
    }
    return NextResponse.json({ success: true, configured: Boolean(policy), policy });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_job_specific_assessment_policy_write:${session.id}`, 10, 60_000);
    const { policy, reason } = await readValidatedJson(request, updateSchema, 16 * 1024);

    let previous = null;
    try {
      previous = await getJobSpecificAssessmentPolicy();
    } catch {
      previous = null;
    }

    await saveJobSpecificAssessmentPolicy(policy);
    await logAuditEvent({
      userId: session.id,
      action: "JOB_SPECIFIC_ASSESSMENT_POLICY_UPDATED",
      resource: "AdminConfiguration:jobSpecificAssessment",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      details: JSON.stringify({ previous, next: policy, reason: reason || null }),
    });

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    return handleApiError(error);
  }
}
