import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const SERVICE_KEY = "mock-interview";

const configSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  creditCost: z.number().int().min(0).max(1_000_000),
  isActive: z.boolean(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_mock_interview_service_get:${admin.id}`, 30, 60_000);

    const service = await prisma.candidateServiceCatalog.findUnique({
      where: { serviceKey: SERVICE_KEY },
      select: {
        id: true,
        serviceKey: true,
        name: true,
        description: true,
        creditCost: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, service }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_mock_interview_service_post:${admin.id}`, 20, 60_000);
    const input = await readValidatedJson(request, configSchema, 8 * 1024);

    const service = await prisma.$transaction(async (tx) => {
      const saved = await tx.candidateServiceCatalog.upsert({
        where: { serviceKey: SERVICE_KEY },
        create: {
          serviceKey: SERVICE_KEY,
          name: input.name,
          description: input.description ?? null,
          creditCost: input.creditCost,
          isActive: input.isActive,
        },
        update: {
          name: input.name,
          description: input.description ?? null,
          creditCost: input.creditCost,
          isActive: input.isActive,
        },
      });

      if (saved.creditCost < 0) {
        throw new ApiError("Candidate service credit cost cannot be negative.", 409);
      }

      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "MOCK_INTERVIEW_CREDIT_CONFIG_UPDATED",
          resource: `CandidateServiceCatalog:${saved.id}`,
          details: `serviceKey:${saved.serviceKey}; creditCost:${saved.creditCost}; active:${saved.isActive}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);
      return saved;
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    return handleApiError(error);
  }
}
