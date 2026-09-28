import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { requireAdminSession } from "@/lib/routeAuthorization";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  creditCost: z.number().int().min(1).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_services_write:${session.id}`, 20, 60_000);
    const { id } = await params;
    const data = await readValidatedJson(request, updateSchema, 8 * 1024);
    const service = await prisma.$transaction(async (tx) => {
      const updated = await tx.candidateServiceCatalog.update({ where: { id }, data });
      const auditLog = await tx.auditLog.create({ data: { userId: session.id, action: "UPDATE_CANDIDATE_SERVICE", resource: `CandidateServiceCatalog:${updated.id}` } });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return updated;
    });
    return NextResponse.json({ success: true, service });
  } catch (error) {
    return handleApiError(error);
  }
}
