import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { createTenantContext } from "@/lib/security/TenantContext";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";

const schema = z.object({
  reason: z.string().trim().min(3).max(1000),
}).strict();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "workflow_approval_revoke", 20, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
      throw new ApiError("Employer access required.", 403);
    }

    const { id } = await params;
    const { reason } = await readValidatedJson(req, schema, 4 * 1024);
    const companyId = session.role === "ADMIN" ? null : (await getSessionCompany(session)).id;
    const context = createTenantContext(companyId, session.id, session.role as Role);

    await WorkflowEngine.revokeApproval({ approvalId: id, reason, context });
    return NextResponse.json({ success: true, approvalId: id, status: "REVOKED" });
  } catch (error) {
    return handleApiError(error);
  }
}
