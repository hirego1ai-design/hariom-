import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const templateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(120),
  seniority: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2_000).optional(),
  instructions: z.string().trim().max(5_000).optional(),
  durationMinutes: z.number().int().min(1).max(240),
  passingPercentage: z.number().int().min(0).max(100),
  validityDays: z.number().int().min(1).max(3_650).nullable().optional(),
  retakeCooldownHours: z.number().int().min(1).max(8_760).nullable().optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_readiness_templates_read:${admin.id}`, 60, 60_000);

    const templates = await prisma.mcqAssessment.findMany({
      where: { scope: "PLATFORM_READINESS" },
      select: {
        id: true,
        title: true,
        roleTitle: true,
        seniority: true,
        durationMinutes: true,
        passingPercentage: true,
        validityDays: true,
        retakeCooldownHours: true,
        isActive: true,
        updatedAt: true,
        _count: { select: { questions: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 250,
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_readiness_templates_write:${admin.id}`, 20, 60_000);
    const data = await readValidatedJson(request, templateSchema);

    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.mcqAssessment.create({
        data: {
          ...data,
          scope: "PLATFORM_READINESS",
          isActive: false,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "CREATE_READINESS_TEMPLATE",
          resource: `McqAssessment:${created.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            roleTitle: created.roleTitle,
            seniority: created.seniority,
            durationMinutes: created.durationMinutes,
            passingPercentage: created.passingPercentage,
            initialState: "INACTIVE",
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return created;
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
