import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { z } from "zod";
import { logAuditEvent } from "@/lib/auditLogger";
import { getKnowledgeScreeningPolicy, MIN_QUESTIONS_PER_SKILL } from "@/lib/knowledgeScreeningPolicy";

const updateAssessmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  passingPercentage: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_update_assessment", 20, 60000);
    const session = await requireEmployerOrAdminSession(request);
    const data = await readValidatedJson(request, updateAssessmentSchema);
    const { id } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id },
      include: { jobListing: true },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;

      if (assessment.jobListing && assessment.jobListing.companyId !== companyId) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      } else if (!assessment.jobListing) {
        throw new ApiError("Forbidden: Cannot edit unlinked assessments", 403);
      }
    }

    // Publication Safety: every scored question must identify the skill(s)
    // it measures so candidate skill evidence is auditable across every role.
    if (data.isActive === true) {
      const questions = await prisma.mcqQuestion.findMany({
        where: { assessmentId: id },
        select: { id: true, category: true, skillTags: true },
      });
      if (questions.length === 0) {
        throw new ApiError("Cannot publish an assessment with zero questions. Add questions before publishing.", 400);
      }

      const screeningPolicy = getKnowledgeScreeningPolicy(
        assessment.roleTitle ?? assessment.jobListing?.title,
        assessment.jobListing?.department,
      );
      if (questions.length < screeningPolicy.minQuestions || questions.length > screeningPolicy.maxQuestions) {
        throw new ApiError(
          `This is a short knowledge screening, not an interview. ${screeningPolicy.label} requires ${screeningPolicy.minQuestions}-${screeningPolicy.maxQuestions} questions; this assessment has ${questions.length}.`,
          400,
        );
      }
      const untagged = questions.filter((question) =>
        question.skillTags.length === 0 && !question.category?.trim()
      );
      if (untagged.length > 0) {
        throw new ApiError(
          `Cannot publish: ${untagged.length} question(s) have no skill tag. Tag every question with the skill it measures.`,
          400,
        );
      }

      const questionsPerSkill = new Map<string, number>();
      for (const question of questions) {
        const tags = question.skillTags.length
          ? question.skillTags
          : question.category?.trim()
            ? [question.category.trim()]
            : [];
        for (const tag of new Set(tags.map((value) => value.trim()).filter(Boolean))) {
          questionsPerSkill.set(tag, (questionsPerSkill.get(tag) ?? 0) + 1);
        }
      }
      const underTestedSkills = Array.from(questionsPerSkill.entries())
        .filter(([, count]) => count < MIN_QUESTIONS_PER_SKILL)
        .map(([skill, count]) => `${skill} (${count}/${MIN_QUESTIONS_PER_SKILL})`);
      if (underTestedSkills.length > 0) {
        throw new ApiError(
          `Each assessed skill needs at least ${MIN_QUESTIONS_PER_SKILL} questions for Knowledge Validated status. Add evidence for: ${underTestedSkills.join(", ")}.`,
          400,
        );
      }
    }

    // Historical Integrity: Cannot mutate scoring rules if candidate attempts exist
    const attemptCount = await prisma.mcqAttempt.count({ where: { assessmentId: id } });
    if (attemptCount > 0 && (data.durationMinutes !== undefined || data.passingPercentage !== undefined)) {
      throw new ApiError("Cannot modify duration or passing percentage for an assessment that already has candidate attempts.", 400);
    }

    const updatedAssessment = await prisma.mcqAssessment.update({
      where: { id },
      data,
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "UPDATE_ASSESSMENT",
      resource: `Assessment:${id}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, assessment: updatedAssessment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_delete_assessment", 20, 60000);
    const session = await requireEmployerOrAdminSession(request);
    const { id } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id },
      include: { jobListing: true },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;

      if (assessment.jobListing && assessment.jobListing.companyId !== companyId) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      } else if (!assessment.jobListing) {
        throw new ApiError("Forbidden: Cannot delete unlinked assessments", 403);
      }
    }

    // Historical Integrity: Cannot destroy assessments that have candidate attempts
    const attemptCount = await prisma.mcqAttempt.count({ where: { assessmentId: id } });
    if (attemptCount > 0) {
      throw new ApiError("Cannot delete an assessment that has candidate attempts. Archive it instead by setting isActive to false.", 400);
    }

    await prisma.mcqAssessment.delete({
      where: { id },
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "DELETE_ASSESSMENT",
      resource: `Assessment:${id}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
