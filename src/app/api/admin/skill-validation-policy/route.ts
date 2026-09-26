import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import {
  getUniversalSkillValidationPolicy,
  saveUniversalSkillValidationPolicy,
  universalSkillValidationPolicySchema,
} from "@/lib/universalSkillValidationPolicy";
import { prisma } from "@/lib/prisma";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";

const updateSchema = z.object({
  policy: universalSkillValidationPolicySchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_skill_validation_policy_read", 60, 60_000);

    let policy = null;
    try {
      policy = await getUniversalSkillValidationPolicy();
    } catch {
      policy = null;
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
      orderBy: { updatedAt: "desc" },
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

    let previous = null;
    try {
      previous = await getUniversalSkillValidationPolicy();
    } catch {
      previous = null;
    }

    await saveUniversalSkillValidationPolicy(policy);
    await logAuditEvent({
      userId: session.id,
      action: "UNIVERSAL_SKILL_VALIDATION_POLICY_UPDATED",
      resource: "AdminConfiguration:universalSkillValidation",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      details: JSON.stringify({
        previous,
        next: policy,
        reason: reason || null,
      }),
    });

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    return handleApiError(error);
  }
}
