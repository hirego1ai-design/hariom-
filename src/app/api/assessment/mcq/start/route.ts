import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, ApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { z } from "zod";

const StartAssessmentSchema = z.object({
  assessmentId: z.string().uuid("Invalid assessment ID"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Forbidden. Candidate access only.", 403);
    }

    const { assessmentId } = await readValidatedJson(req, StartAssessmentSchema);

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
    });

    if (!candidateProfile) {
      throw new ApiError("Candidate profile not found", 404);
    }

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    if (!assessment.isActive) {
      throw new ApiError("Assessment is currently in draft mode or inactive", 400);
    }

    if (!assessment.questions || assessment.questions.length === 0) {
      throw new ApiError("Assessment has no questions configured and cannot be started", 400);
    }

    if (assessment.scope === "EMPLOYER_JOB") {
      if (!assessment.jobListingId) {
        throw new ApiError("Assessment is not linked to an active job listing and cannot be started.", 403);
      }
      const application = await prisma.application.findUnique({
        where: {
          candidateProfileId_jobId: {
            candidateProfileId: candidateProfile.id,
            jobId: assessment.jobListingId,
          },
        },
      });
      if (!application) throw new ApiError("You are not assigned to this job assessment.", 403);
      const eligibleStatuses = new Set(["APPLIED", "SCREENING", "AI_INTERVIEW", "ASSESSMENT", "SHORTLISTED"]);
      if (!eligibleStatuses.has(application.status)) {
        throw new ApiError(`Application is in '${application.status}' status and is not eligible to take assessments.`, 403);
      }
    } else {
      if (!assessment.roleTitle || !assessment.seniority) {
        throw new ApiError("Job-Ready assessment configuration is incomplete.", 409);
      }
      const readiness = await prisma.candidateReadiness.findUnique({
        where: {
          candidateProfileId_roleTitle_seniority: {
            candidateProfileId: candidateProfile.id,
            roleTitle: assessment.roleTitle,
            seniority: assessment.seniority,
          },
        },
      });
      if (!readiness || readiness.assessmentId !== assessment.id) {
        throw new ApiError("Select this Job-Ready assessment from your readiness dashboard before starting.", 403);
      }
    }

    // Atomic concurrency protection for starting/resuming attempts
    let activeAttempt = await prisma.mcqAttempt.findFirst({
      where: {
        candidateProfileId: candidateProfile.id,
        assessmentId: assessmentId,
      },
      orderBy: { startedAt: "desc" },
    });

    if (activeAttempt) {
      if (activeAttempt.submittedAt !== null) {
        if (assessment.scope !== "PLATFORM_READINESS" || !assessment.retakeCooldownHours) {
          throw new ApiError("Assessment already completed", 400);
        }
        const retryAt = new Date(activeAttempt.submittedAt.getTime() + assessment.retakeCooldownHours * 60 * 60 * 1000);
        if (retryAt > new Date()) {
          throw new ApiError(`Assessment retake is available after ${retryAt.toISOString()}.`, 409);
        }
        activeAttempt = null;
      }
    }
    if (!activeAttempt) {
      try {
        activeAttempt = await prisma.mcqAttempt.create({
          data: {
            candidateProfileId: candidateProfile.id,
            assessmentId: assessmentId,
          },
        });
      } catch (createErr: any) {
        // The partial unique index in the migration is the concurrency guard.
        // Only a unique-constraint conflict may be recovered by loading the
        // in-progress attempt created by the winning request.
        if (createErr?.code !== "P2002") {
          throw createErr;
        }

        activeAttempt = await prisma.mcqAttempt.findFirst({
          where: {
            candidateProfileId: candidateProfile.id,
            assessmentId: assessmentId,
            submittedAt: null,
          },
          orderBy: { startedAt: "desc" },
        });

        if (!activeAttempt) {
          throw createErr;
        }
      }
    }

    await logAuditEvent({
      userId: session.id,
      action: "MCQ_ASSESSMENT_STARTED",
      resource: `McqAssessment:${assessmentId}`,
      details: `McqAttempt:${activeAttempt.id}`,
    });

    // Strip sensitive fields from questions before returning (no isCorrect, no explanation)
    const sanitizedQuestions = assessment.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      points: q.points,
      difficulty: q.difficulty,
      category: q.category,
      orderIndex: q.orderIndex,
      options: q.options.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
      })),
    }));

    return NextResponse.json({
      success: true,
      attemptId: activeAttempt.id,
      assessment: {
        title: assessment.title,
        description: assessment.description,
        instructions: assessment.instructions,
        durationMinutes: assessment.durationMinutes,
        passingPercentage: assessment.passingPercentage,
      },
      questions: sanitizedQuestions,
      startedAt: activeAttempt.startedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
