import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { requireAdminSession } from "@/lib/routeAuthorization";

const serviceSchema = z.object({
  serviceKey: z.string().trim().min(3).max(80).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).optional(),
  creditCost: z.number().int().min(1).max(1_000_000),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_services_read:${admin.id}`, 60, 60_000);
    const [total, services] = await prisma.$transaction([
      prisma.candidateServiceCatalog.count(),
      prisma.candidateServiceCatalog.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 250,
      }),
    ]);
    return NextResponse.json({ success: true, total, truncated: total > services.length, services });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_services_write:${session.id}`, 20, 60_000);
    const data = await readValidatedJson(request, serviceSchema, 8 * 1024);
    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.candidateServiceCatalog.create({ data });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "CREATE_CANDIDATE_SERVICE",
          resource: `CandidateServiceCatalog:${created.id}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return created;
    });
    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
