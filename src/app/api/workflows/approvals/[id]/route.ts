import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";
import { createTenantContext } from "@/lib/security/TenantContext";

const schema = z.object({
  action: z.literal("REVOKE"),
  reason: z.string().trim().min(3).max(1000),
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireEmployerOrAdminSession(request);
    await enforceRateLimit(request, `workflow_approval_revoke:${session.id}`, 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(request, schema, 4 * 1024);
    const companyId = session.role === "ADMIN" ? null : (await getSessionCompany(session)).id;
    const context = createTenantContext(companyId, session.id, session.role as Role);

    const approval = await WorkflowEngine.getApprovalDetails({ approvalId: id, context });
    if (approval.consumedAt) throw new ApiError("Consumed approval cannot be revoked.", 409);
    if (approval.revokedAt) {
      return NextResponse.json({ success: true, approvalId: id, revoked: true, idempotent: true });
    }

    await WorkflowEngine.revokeApproval({ approvalId: id, reason: body.reason, context });
    return NextResponse.json({ success: true, approvalId: id, revoked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
