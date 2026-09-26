import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { createTenantContext } from "@/lib/security/TenantContext";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REVOKE"]),
  notes: z.string().trim().max(2000).optional(),
  reason: z.string().trim().max(1000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.action === "REVOKE" && !value.reason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "Revocation reason is required." });
  }
});

async function contextFor(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    throw new ApiError("Employer or administrator access required.", 403);
  }
  const companyId = session.role === "ADMIN" ? null : (await getSessionCompany(session)).id;
  return {
    session,
    context: createTenantContext(companyId, session.id, session.role as Role),
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "workflow_approval_read", 60, 60_000);
    const { context } = await contextFor(request);
    const { id } = await params;
    const approval = await WorkflowEngine.getApprovalDetails({ approvalId: id, context });
    return NextResponse.json({
      success: true,
      approval,
      expired: !approval.expiresAt || approval.expiresAt.getTime() <= Date.now(),
      revoked: Boolean(approval.revokedAt),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "workflow_approval_change", 20, 60_000);
    const { context } = await contextFor(request);
    const { id } = await params;
    const body = await readValidatedJson(request, actionSchema, 8 * 1024);

    if (body.action === "REVOKE") {
      await WorkflowEngine.revokeApproval({
        approvalId: id,
        reason: body.reason!,
        context,
      });
      return NextResponse.json({ success: true, action: "REVOKE" });
    }

    await WorkflowEngine.decideApproval({
      approvalId: id,
      decision: body.action === "APPROVE" ? "APPROVED" : "REJECTED",
      notes: body.notes,
      context,
    });
    return NextResponse.json({ success: true, action: body.action });
  } catch (error) {
    return handleApiError(error);
  }
}
