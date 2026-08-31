import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { z } from "zod";
import { logAuditEvent } from "@/lib/auditLogger";

const optionSchema = z.object({
  optionText: z.string().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text cannot be empty"),
  explanation: z.string().optional(),
  points: z.number().int().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  category: z.string().optional(),
  options: z.array(optionSchema).min(2).max(6),
}).refine(
  (data) => data.options.filter((o) => o.isCorrect).length === 1,
  {
    message: "Exactly one option must be marked as correct",
    path: ["options"],
  }
);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_add_question", 30, 60000);
    const session = await requireEmployerOrAdminSession(request);
    const data = await readValidatedJson(request, createQuestionSchema);
    const { id: assessmentId } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id: assessmentId },
      include: { jobListing: true },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    if (assessment.isActive) {
      throw new ApiError("Unpublish this assessment before changing its questions.", 400);
    }

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;

      if (!assessment.jobListing || assessment.jobListing.companyId !== companyId) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      }
    }

    // Historical Integrity: Cannot add questions if candidate attempts exist
    const attemptCount = await prisma.mcqAttempt.count({ where: { assessmentId } });
    if (attemptCount > 0) {
      throw new ApiError("Cannot add questions to an assessment that already has candidate attempts.", 400);
    }

    // Get the current max orderIndex
    const lastQuestion = await prisma.mcqQuestion.findFirst({
      where: { assessmentId },
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;

    const question = await prisma.$transaction(async (tx) => {
      const newQuestion = await tx.mcqQuestion.create({
        data: {
          assessmentId,
          questionText: data.questionText,
          explanation: data.explanation,
          points: data.points,
          difficulty: data.difficulty,
          category: data.category,
          orderIndex,
          options: {
            create: data.options.map((opt) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            })),
          },
        },
        include: {
          options: true,
        },
      });
      return newQuestion;
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "ADD_ASSESSMENT_QUESTION",
      resource: `Question:${question.id}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_get_questions", 50, 60000);
    const session = await requireEmployerOrAdminSession(request);
    const { id: assessmentId } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id: assessmentId },
      include: { jobListing: true },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (!assessment.jobListing || assessment.jobListing.companyId !== company.id) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      }
    }

    const questions = await prisma.mcqQuestion.findMany({
      where: { assessmentId },
      include: { options: true },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    return handleApiError(error);
  }
}
