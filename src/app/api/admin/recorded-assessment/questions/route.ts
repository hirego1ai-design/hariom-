import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { RECORDED_ASSESSMENT_READING_SECONDS } from "@/lib/recordedAssessment";

const schema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  industry: z.string().trim().min(2).max(120).nullable().optional(),
  department: z.string().trim().min(2).max(120).nullable().optional(),
  skillTags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  questionText: z.string().trim().min(8).max(500),
  answerDurationSeconds: z.union([z.literal(30), z.literal(60)]),
  version: z.number().int().min(1).default(1),
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
    const question = await prisma.recordedAssessmentQuestionBank.create({
      data: { ...body, readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS },
    });
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
