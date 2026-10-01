import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { requireAdminSession } from "@/lib/routeAuthorization";

const packageSchema = z.object({
  packageKey: z.string().trim().min(3).max(80).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).optional(),
  credits: z.number().int().min(1).max(1_000_000),
  price: z.number().positive().max(10_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("INR"),
  sortOrder: z.number().int().min(-10_000).max(10_000).optional().default(0),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_credit_packages_read:${admin.id}`, 60, 60_000);
    const packages = await prisma.candidateCreditPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 250,
    });
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_credit_packages_write:${admin.id}`, 20, 60_000);
    const data = await readValidatedJson(request, packageSchema, 8 * 1024);
    const created = await prisma.$transaction(async (tx) => {
      const pkg = await tx.candidateCreditPackage.create({ data });
      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "CREATE_CANDIDATE_CREDIT_PACKAGE",
          resource: `CandidateCreditPackage:${pkg.id}`,
          details: JSON.stringify({
            packageKey: pkg.packageKey,
            credits: pkg.credits,
            price: pkg.price,
            currency: pkg.currency,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);
      return pkg;
    });
    return NextResponse.json({ success: true, package: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
