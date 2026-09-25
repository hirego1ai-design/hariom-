import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { RECORDED_ASSESSMENT_READING_SECONDS } from "@/lib/recordedAssessment";
import { resolveCanonicalSkillTags } from "@/lib/skillTaxonomy";

const schema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  questionKey: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  industry: z.string().trim().min(2).max(120).nullable().optional(),
  department: z.string().trim().min(2).max(120).nullable().optional(),
  skillTags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  questionText: z.string().trim().min(8).max(500),
  answerDurationSeconds: z.union([z.literal(30), z.literal(60)]),
  difficulty: z.enum(["BASIC"]).default("BASIC"),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const roleTitle = request.nextUrl.searchParams.get("roleTitle")?.trim();
    if (!roleTitle) throw new ApiError("roleTitle is required.", 400);
    const questions = await prisma.recordedAssessmentQuestionBank.findMany({
      where: { roleTitle: { equals: roleTitle, mode: "insensitive" }, isActive: true },
      orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, questions });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "recorded_assessment_question_bank");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required to curate the question bank.", 403);
    const body = await readValidatedJson(request, schema);
    const normalizedText = body.questionText.replace(/\s+/g, " ").trim();
    const normalizedRole = body.roleTitle.replace(/\s+/g, " ").trim();
    const { canonicalTags: skillTags, unknownTags } = await resolveCanonicalSkillTags(body.skillTags);
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
        return tx.recordedAssessmentQuestionBank.create({
        data: {
          ...body,
          skillTags,
          roleTitle: normalizedRole,
          questionText: normalizedText,
          version: (family[0]?.version ?? 0) + 1,
          readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS,
        },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      // Concurrent admins can calculate the same next version. The unique
      // questionKey/version index remains authoritative and turns that race
      // into an explicit retry instead of an opaque database failure.
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
        throw new ApiError("This question family changed while you were publishing. Reload the bank and publish again.", 409);
      }
      throw error;
    }
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
