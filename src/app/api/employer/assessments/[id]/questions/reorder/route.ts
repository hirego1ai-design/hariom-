import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1).max(500),
}).refine((data) => new Set(data.questionIds).size === data.questionIds.length, {
  message: "Question IDs must not contain duplicates.",
  path: ["questionIds"],
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_reorder_assessment_questions", 30, 60_000);
    const session = await requireEmployerOrAdminSession(request);
    const { questionIds } = await readValidatedJson(request, reorderQuestionsSchema);
    const { id: assessmentId } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id: assessmentId },
      include: { jobListing: true },
    });
    if (!assessment) throw new ApiError("Assessment not found", 404);
    if (assessment.isActive) throw new ApiError("Unpublish this assessment before reordering questions.", 400);

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;
      if (!assessment.jobListing || assessment.jobListing.companyId !== company.id) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      }
    }

    const [storedQuestions, attemptCount] = await Promise.all([
      prisma.mcqQuestion.findMany({ where: { assessmentId }, select: { id: true } }),
      prisma.mcqAttempt.count({ where: { assessmentId } }),
    ]);
    if (attemptCount > 0) {
      throw new ApiError("Cannot reorder questions after candidates have started this assessment.", 400);
    }

    const storedIds = new Set(storedQuestions.map((question) => question.id));
    if (storedIds.size !== questionIds.length || questionIds.some((id) => !storedIds.has(id))) {
      throw new ApiError("Question order must contain every question in this assessment exactly once.", 400);
    }

    await prisma.$transaction(
      questionIds.map((questionId, orderIndex) =>
        prisma.mcqQuestion.update({ where: { id: questionId }, data: { orderIndex } }),
      ),
    );

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "REORDER_ASSESSMENT_QUESTIONS",
      resource: `Assessment:${assessmentId}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
