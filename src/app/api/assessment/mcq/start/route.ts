import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, ApiError, readValidatedJson, enforceRateLimit } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { z } from "zod";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";
import { ApplicationGateStatus, ApplicationGateType } from "@prisma/client";

const StartAssessmentSchema = z.object({
  assessmentId: z.string().uuid("Invalid assessment ID"),
});

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "assessment_mcq_start", 12, 60000);
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
        jobListing: { select: { title: true, department: true } },
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

    const screeningValidation = validateKnowledgeScreeningAssessment({
      roleTitle: assessment.roleTitle ?? assessment.jobListing?.title,
      department: assessment.jobListing?.department,
      questions: assessment.questions.map((question) => ({
        category: question.category,
        skillTags: question.skillTags,
      })),
    });
    if (!screeningValidation.valid) {
      throw new ApiError(
        "This assessment does not meet HireGo Skill Validation policy and cannot be started.",
        409,
      );
    }

    if (
      assessment.scope === "PLATFORM_READINESS" &&
      assessment.seniority === UNIVERSAL_VALIDATION_SENIORITY
    ) {
      const acknowledgement = await prisma.assessmentNoticeAcknowledgement.findUnique({
        where: {
          candidateProfileId_assessmentId: {
            candidateProfileId: candidateProfile.id,
            assessmentId: assessment.id,
          },
        },
        select: { noticeVersion: true },
      });
      if (!acknowledgement || acknowledgement.noticeVersion !== "universal-skill-validation-v1") {
        throw new ApiError(
          "Review and acknowledge the Universal Skill Validation notice before starting.",
          428,
        );
      }
    }

    let jobAssessmentContext: { applicationId: string; gateId: string } | null = null;

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

      const gate = await prisma.applicationGate.findUnique({
        where: {
          applicationId_type: {
            applicationId: application.id,
            type: ApplicationGateType.JOB_SPECIFIC_ASSESSMENT,
          },
        },
        select: { id: true, assessmentId: true, status: true },
      });
      if (
        !gate ||
        gate.assessmentId !== assessment.id ||
        (gate.status !== ApplicationGateStatus.REQUIRED &&
          gate.status !== ApplicationGateStatus.IN_PROGRESS)
      ) {
        throw new ApiError("This assessment is not currently assigned to your application.", 403);
      }

      if (application.status !== "ASSESSMENT") {
        throw new ApiError(
          `Job-specific assessment can be started only while the application is in ASSESSMENT; current status is '${application.status}'.`,
          409,
        );
      }
      jobAssessmentContext = { applicationId: application.id, gateId: gate.id };
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

    let activeAttempt;

    if (jobAssessmentContext) {
      activeAttempt = await prisma.$transaction(async (tx) => {
        // Canonical lifecycle order: Application -> Gate -> Attempt.
        await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${jobAssessmentContext.applicationId} FOR UPDATE`;
        const lockedApplication = await tx.application.findUnique({
          where: { id: jobAssessmentContext.applicationId },
          select: { status: true, candidateProfileId: true, jobId: true },
        });
        if (
          !lockedApplication ||
          lockedApplication.candidateProfileId !== candidateProfile.id ||
          lockedApplication.jobId !== assessment.jobListingId ||
          lockedApplication.status !== "ASSESSMENT"
        ) {
          throw new ApiError(
            "Application left the assessment stage before this job-specific assessment could start.",
            409,
          );
        }

        await tx.$queryRaw`SELECT id FROM "ApplicationGate" WHERE id = ${jobAssessmentContext.gateId} FOR UPDATE`;
        const lockedGate = await tx.applicationGate.findUnique({
          where: { id: jobAssessmentContext.gateId },
          select: { assessmentId: true, status: true, applicationId: true, type: true },
        });
        if (
          !lockedGate ||
          lockedGate.applicationId !== jobAssessmentContext.applicationId ||
          lockedGate.type !== ApplicationGateType.JOB_SPECIFIC_ASSESSMENT ||
          lockedGate.assessmentId !== assessment.id ||
          (lockedGate.status !== ApplicationGateStatus.REQUIRED &&
            lockedGate.status !== ApplicationGateStatus.IN_PROGRESS)
        ) {
          throw new ApiError(
            "Job-specific assessment assignment changed before the attempt could start.",
            409,
          );
        }

        await tx.$queryRaw`SELECT id FROM "McqAttempt"
          WHERE "candidateProfileId" = ${candidateProfile.id}
            AND "assessmentId" = ${assessment.id}
          ORDER BY "startedAt" DESC
          LIMIT 1
          FOR UPDATE`;
        const existingAttempt = await tx.mcqAttempt.findFirst({
          where: {
            candidateProfileId: candidateProfile.id,
            assessmentId: assessment.id,
          },
          orderBy: { startedAt: "desc" },
        });
        if (existingAttempt?.submittedAt) {
          throw new ApiError("Assessment already completed", 400);
        }

        const attempt = existingAttempt ?? await tx.mcqAttempt.create({
          data: {
            candidateProfileId: candidateProfile.id,
            assessmentId: assessment.id,
          },
        });

        if (lockedGate.status === ApplicationGateStatus.REQUIRED) {
          const claimed = await tx.applicationGate.updateMany({
            where: {
              id: jobAssessmentContext.gateId,
              status: ApplicationGateStatus.REQUIRED,
              assessmentId: assessment.id,
            },
            data: { status: ApplicationGateStatus.IN_PROGRESS },
          });
          if (claimed.count !== 1) {
            throw new ApiError(
              "Job-specific assessment assignment changed before the attempt could start.",
              409,
            );
          }
        }

        return attempt;
      }, { maxWait: 5_000, timeout: 10_000 });
    } else {
      // PLATFORM_READINESS assessments can be resumed and may support cooldown retakes.
      activeAttempt = await prisma.mcqAttempt.findFirst({
        where: {
          candidateProfileId: candidateProfile.id,
          assessmentId,
        },
        orderBy: { startedAt: "desc" },
      });

      if (activeAttempt && activeAttempt.submittedAt !== null) {
        if (!assessment.retakeCooldownHours) {
          throw new ApiError("Assessment already completed", 400);
        }
        const retryAt = new Date(
          activeAttempt.submittedAt.getTime() +
            assessment.retakeCooldownHours * 60 * 60 * 1000,
        );
        if (retryAt > new Date()) {
          throw new ApiError(
            `Assessment retake is available after ${retryAt.toISOString()}.`,
            409,
          );
        }
        activeAttempt = null;
      }

      if (!activeAttempt) {
        try {
          activeAttempt = await prisma.mcqAttempt.create({
            data: {
              candidateProfileId: candidateProfile.id,
              assessmentId,
            },
          });
        } catch (createErr: any) {
          if (createErr?.code !== "P2002") throw createErr;
          activeAttempt = await prisma.mcqAttempt.findFirst({
            where: {
              candidateProfileId: candidateProfile.id,
              assessmentId,
              submittedAt: null,
            },
            orderBy: { startedAt: "desc" },
          });
          if (!activeAttempt) throw createErr;
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
