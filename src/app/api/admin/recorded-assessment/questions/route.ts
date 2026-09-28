import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { RECORDED_ASSESSMENT_READING_SECONDS } from "@/lib/recordedAssessment";
import { resolveCanonicalSkillTags } from "@/lib/skillTaxonomy";

const querySchema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
});

const schema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  questionKey: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  industry: z.string().trim().min(2).max(120).nullable().optional(),
  department: z.string().trim().min(2).max(120).nullable().optional(),
  skillTags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  questionText: z.string().trim().min(8).max(500),
  answerDurationSeconds: z.union([z.literal(30), z.literal(60)]),
  difficulty: z.literal("BASIC").default("BASIC"),
  reason: z.string().trim().min(3).max(500),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_recorded_question_bank_read:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));

    const questions = await prisma.recordedAssessmentQuestionBank.findMany({
      where: {
        roleTitle: { equals: query.roleTitle, mode: "insensitive" },
        isActive: true,
      },
      orderBy: [{ version: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
      take: 100,
    });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_recorded_question_bank_write:${admin.id}`, 20, 60_000);
    const body = await readValidatedJson(request, schema, 16 * 1024);

    const normalizedText = body.questionText.replace(/\s+/g, " ").trim();
    const normalizedRole = body.roleTitle.replace(/\s+/g, " ").trim();
    const { canonicalTags: skillTags, unknownTags } = await resolveCanonicalSkillTags(body.skillTags ?? []);

    if (unknownTags.length) {
      throw new ApiError(
        `Unknown skill tag(s): ${unknownTags.join(", ")}. Use the canonical skill master or approve the missing skill before publishing assessment evidence.`,
        422,
      );
    }

    let question;
    try {
      question = await prisma.$transaction(async (tx) => {
        const family = await tx.recordedAssessmentQuestionBank.findMany({
          where: { questionKey: body.questionKey },
          select: { id: true, version: true, isActive: true },
          orderBy: { version: "desc" },
        });

        if (family.some((item) => item.isActive)) {
          throw new ApiError("Retire the active version before publishing a replacement.", 409);
        }

        const created = await tx.recordedAssessmentQuestionBank.create({
          data: {
            roleTitle: normalizedRole,
            questionKey: body.questionKey,
            industry: body.industry,
            department: body.department,
            skillTags,
            questionText: normalizedText,
            answerDurationSeconds: body.answerDurationSeconds,
            difficulty: body.difficulty,
            version: (family[0]?.version ?? 0) + 1,
            readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS,
            isActive: true,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            userId: admin.id,
            action: "RECORDED_ASSESSMENT_QUESTION_PUBLISHED",
            resource: `RecordedAssessmentQuestionBank:${created.id}`,
            ipAddress: getClientIp(request) || "unknown",
            details: JSON.stringify({
              questionKey: created.questionKey,
              version: created.version,
              roleTitle: created.roleTitle,
              reason: body.reason,
            }),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        throw new ApiError(
          "This question family changed while you were publishing. Reload the bank and publish again.",
          409,
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
