import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { requireAdminSession } from "@/lib/routeAuthorization";

const upsertSchema = z.object({
  action: z.literal("UPSERT"),
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  credits: z.number().int().min(1).max(1_000_000),
  price: z.number().positive().max(10_000_000),
  currency: z.string().trim().length(3).transform(v => v.toUpperCase()),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
}).strict();

const deactivateSchema = z.object({
  action: z.literal("DEACTIVATE"),
  id: z.string().uuid(),
}).strict();

const packageMutationSchema = z.discriminatedUnion("action", [upsertSchema, deactivateSchema]);

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_credit_packages_get:${admin.id}`, 30, 60_000);
    const packages = await prisma.candidateCreditPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ success: true, packages }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_credit_packages_post:${admin.id}`, 20, 60_000);
    const input = await readValidatedJson(request, packageMutationSchema, 12 * 1024);

    const result = await prisma.$transaction(async (tx) => {
      if (input.action === "DEACTIVATE") {
        const existing = await tx.candidateCreditPackage.findUnique({ where: { id: input.id } });
        if (!existing) throw new ApiError("Candidate credit package not found.", 404);
        const pkg = await tx.candidateCreditPackage.update({
          where: { id: input.id },
          data: { isActive: false },
        });
        const audit = await tx.auditLog.create({
          data: {
            userId: admin.id,
            action: "CANDIDATE_CREDIT_PACKAGE_DEACTIVATED",
            resource: `CandidateCreditPackage:${pkg.id}`,
            details: `code:${pkg.code}`,
          },
        });
        await enqueueSecurityAuditEvent(tx, audit, admin.id);
        return pkg;
      }

      const code = input.code.toUpperCase();
      const duplicate = await tx.candidateCreditPackage.findFirst({
        where: { code, ...(input.id ? { id: { not: input.id } } : {}) },
        select: { id: true },
      });
      if (duplicate) throw new ApiError("Candidate credit package code already exists.", 409);

      const pkg = input.id
        ? await tx.candidateCreditPackage.update({
            where: { id: input.id },
            data: {
              code,
              name: input.name,
              description: input.description ?? null,
              credits: input.credits,
              price: input.price,
              currency: input.currency,
              isActive: input.isActive,
              sortOrder: input.sortOrder,
            },
          })
        : await tx.candidateCreditPackage.create({
            data: {
              code,
              name: input.name,
              description: input.description ?? null,
              credits: input.credits,
              price: input.price,
              currency: input.currency,
              isActive: input.isActive,
              sortOrder: input.sortOrder,
            },
          });

      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: input.id ? "CANDIDATE_CREDIT_PACKAGE_UPDATED" : "CANDIDATE_CREDIT_PACKAGE_CREATED",
          resource: `CandidateCreditPackage:${pkg.id}`,
          details: `code:${pkg.code}; credits:${pkg.credits}; price:${pkg.price}; currency:${pkg.currency}; active:${pkg.isActive}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);
      return pkg;
    });

    return NextResponse.json({ success: true, package: result }, { status: input.action === "UPSERT" && !input.id ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
