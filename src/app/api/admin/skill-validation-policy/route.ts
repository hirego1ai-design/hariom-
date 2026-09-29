import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { universalSkillValidationPolicySchema } from "@/lib/universalSkillValidationPolicy";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";

const CONFIG_ID = "global-admin-config";

const updateSchema = z.object({
  policy: universalSkillValidationPolicySchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_skill_validation_policy_read:${session.id}`, 60, 60_000);

    const row = await prisma.adminConfiguration.findUnique({
      where: { id: CONFIG_ID },
      select: { platformConfig: true },
    });

    let policy = null;
    const rawPolicy = isRecord(row?.platformConfig)
      ? row.platformConfig.universalSkillValidation
      : undefined;

    if (rawPolicy !== undefined) {
      const parsed = universalSkillValidationPolicySchema.safeParse(rawPolicy);
      if (!parsed.success) {
        throw new ApiError("Stored Universal Skill Validation policy is invalid and requires administrator repair.", 500);
      }
      policy = parsed.data;
    }

    const templates = await prisma.mcqAssessment.findMany({
      where: {
        scope: "PLATFORM_READINESS",
        seniority: UNIVERSAL_VALIDATION_SENIORITY,
      },
      select: {
        id: true,
        title: true,
        roleTitle: true,
        isActive: true,
        updatedAt: true,
        questions: { select: { category: true, skillTags: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 200,
    });

    return NextResponse.json({
      success: true,
      configured: Boolean(policy),
      policy,
      templates: templates.map(({ questions, ...template }) => {
        const validation = validateKnowledgeScreeningAssessment({
          roleTitle: template.roleTitle,
          questions,
        });
        return {
          ...template,
          productionValid: template.isActive && validation.valid,
          validationReasons: validation.reasons,
          questionCount: questions.length,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_skill_validation_policy_write:${session.id}`, 10, 60_000);
    const { policy, reason } = await readValidatedJson(request, updateSchema, 16 * 1024);

    await prisma.$transaction(async (tx) => {
      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platformConfig: {} },
        update: {},
      });

      await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
      const row = await tx.adminConfiguration.findUniqueOrThrow({
        where: { id: CONFIG_ID },
        select: { platformConfig: true },
      });

      const platformConfig = isRecord(row.platformConfig)
        ? { ...row.platformConfig }
        : {};
      const previousRaw = platformConfig.universalSkillValidation;
      const previousParsed = universalSkillValidationPolicySchema.safeParse(previousRaw);
      const previous = previousParsed.success ? previousParsed.data : null;

      platformConfig.universalSkillValidation = policy;

      await tx.adminConfiguration.update({
        where: { id: CONFIG_ID },
        data: { platformConfig: platformConfig as Prisma.InputJsonValue },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "UNIVERSAL_SKILL_VALIDATION_POLICY_UPDATED",
          resource: "AdminConfiguration:universalSkillValidation",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            previous,
            previousStoredValueValid: previousRaw === undefined || previousParsed.success,
            next: policy,
            reason: reason || null,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
    });

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    return handleApiError(error);
  }
}
