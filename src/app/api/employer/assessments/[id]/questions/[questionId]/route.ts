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

const updateQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text cannot be empty").optional(),
  explanation: z.string().optional(),
  points: z.number().int().min(1).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  category: z.string().optional(),
  options: z.array(optionSchema).min(2).max(6).optional(),
}).refine(
  (data) => !data.options || data.options.filter((o) => o.isCorrect).length === 1,
  {
    message: "Exactly one option must be marked as correct",
    path: ["options"],
  }
);

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    await enforceRateLimit(request, "employer_update_question", 30, 60000);
    const session = await requireEmployerOrAdminSession(request);
    const data = await readValidatedJson(request, updateQuestionSchema);
    const { id: assessmentId, questionId } = await params;

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

    const questionExists = await prisma.mcqQuestion.findUnique({
      where: { id: questionId },
    });

    if (!questionExists || questionExists.assessmentId !== assessmentId) {
      throw new ApiError("Question not found in this assessment", 404);
    }

    // Historical Integrity: Cannot mutate questions if candidate attempts exist
    const attemptCount = await prisma.mcqAttempt.count({ where: { assessmentId } });
    if (attemptCount > 0) {
      throw new ApiError("Cannot modify questions for an assessment that already has candidate attempts.", 400);
    }

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      if (data.options) {
        await tx.mcqOption.deleteMany({
          where: { questionId },
        });
      }

      return await tx.mcqQuestion.update({
        where: { id: questionId },
        data: {
          questionText: data.questionText,
          explanation: data.explanation,
          points: data.points,
          difficulty: data.difficulty,
          category: data.category,
          ...(data.options && {
            options: {
              create: data.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            },
          }),
        },
        include: {
          options: true,
        },
      });
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "UPDATE_ASSESSMENT_QUESTION",
      resource: `Question:${questionId}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    await enforceRateLimit(request, "employer_delete_question", 30, 60000);
    const session = await requireEmployerOrAdminSession(request);
    const { id: assessmentId, questionId } = await params;

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

    const questionExists = await prisma.mcqQuestion.findUnique({
      where: { id: questionId },
    });

    if (!questionExists || questionExists.assessmentId !== assessmentId) {
      throw new ApiError("Question not found in this assessment", 404);
    }

    // Historical Integrity: Cannot delete questions if candidate attempts exist
    const attemptCount = await prisma.mcqAttempt.count({ where: { assessmentId } });
    if (attemptCount > 0) {
      throw new ApiError("Cannot delete questions for an assessment that already has candidate attempts.", 400);
    }

    await prisma.mcqQuestion.delete({
      where: { id: questionId },
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "DELETE_ASSESSMENT_QUESTION",
      resource: `Question:${questionId}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
