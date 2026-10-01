import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { requireAdminSession } from "@/lib/routeAuthorization";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  credits: z.number().int().min(1).max(1_000_000).optional(),
  price: z.number().positive().max(10_000_000).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  sortOrder: z.number().int().min(-10_000).max(10_000).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_credit_packages_write:${admin.id}`, 20, 60_000);
    const { id } = await params;
    const data = await readValidatedJson(request, updateSchema, 8 * 1024);
    const updated = await prisma.$transaction(async (tx) => {
      const pkg = await tx.candidateCreditPackage.update({ where: { id }, data });
      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "UPDATE_CANDIDATE_CREDIT_PACKAGE",
          resource: `CandidateCreditPackage:${pkg.id}`,
          details: JSON.stringify({ changedKeys: Object.keys(data).sort() }),
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);
      return pkg;
    });
    return NextResponse.json({ success: true, package: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
