import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, ApiError, readValidatedJson, enforceRateLimit } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import {
  McqQuestionResult,
  aggregateMcqSkillEvidence,
  persistMcqSkillEvidence,
  qualifiesMcqSkillEvidence,
} from "@/lib/skillValidation";
import { z } from "zod";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";
import { dispatchApplicationReceivedConfirmation } from "@/lib/communications/applicationNotifications";
import { ApplicationGateStatus, ApplicationGateType } from "@prisma/client";

const SubmitAssessmentSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID"),
  answers: z.array(
    z.object({
      questionId: z.string().uuid("Invalid question ID"),
      selectedOptionId: z.string().uuid("Invalid option ID"),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Forbidden. Candidate access only.", 403);
    }

    await enforceRateLimit(req, "candidate_mcq_submit", 5, 60000);
    const { attemptId, answers } = await readValidatedJson(req, SubmitAssessmentSchema);

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
    });
    if (!candidateProfile) throw new ApiError("Candidate profile not found", 404);

    const attempt = await prisma.mcqAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) throw new ApiError("Attempt not found", 404);
    if (attempt.candidateProfileId !== candidateProfile.id) {
      throw new ApiError("Attempt does not belong to you", 403);
    }
    if (attempt.submittedAt !== null) {
      throw new ApiError("Attempt has already been submitted", 400);
    }

    const { assessment } = attempt;
    const validation = validateKnowledgeScreeningAssessment({
      roleTitle: assessment.roleTitle,
      questions: assessment.questions.map((question) => ({
        category: question.category,
        skillTags: question.skillTags,
      })),
    });
    const qualifiesForSkillValidation = validation.valid;

    const durationLimitMs = (assessment.durationMinutes * 60 + 60) * 1000;
    if (Date.now() - attempt.startedAt.getTime() > durationLimitMs) {
      throw new ApiError("Assessment duration has expired. Submission rejected.", 400);
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const answerData: { questionId: string; selectedOptionId: string }[] = [];
    const questionResults: McqQuestionResult[] = [];

    for (const question of assessment.questions) {
      totalPoints += question.points;
      const submittedAnswer = answers.find((answer) => answer.questionId === question.id);
      let selectedOptionId: string | null = null;
      let isCorrect = false;

      if (submittedAnswer) {
        selectedOptionId = submittedAnswer.selectedOptionId;
        const selectedOption = question.options.find((option) => option.id === selectedOptionId);
        if (!selectedOption) {
          throw new ApiError(`Option ${selectedOptionId} is not valid for question ${question.id}`, 400);
        }
        isCorrect = selectedOption.isCorrect;
        if (isCorrect) {
          earnedPoints += question.points;
          correctCount++;
        }
      }

      questionResults.push({
        skillTags: question.skillTags,
        category: question.category,
        points: question.points,
        correct: isCorrect,
      });

      if (selectedOptionId) {
        answerData.push({ questionId: question.id, selectedOptionId });
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= assessment.passingPercentage;
    const score = Math.round(percentage);

    const submission = await prisma.$transaction(async (tx) => {
      const claim = await tx.mcqAttempt.updateMany({
        where: { id: attemptId, submittedAt: null },
        data: {
          score,
          earnedPoints,
          totalPoints,
          percentage,
          passed,
          submittedAt: new Date(),
        },
      });
      if (claim.count === 0) {
        throw new ApiError("Attempt has already been submitted or completed", 400);
      }

      if (answerData.length > 0) {
        await tx.mcqCandidateAnswer.createMany({
          data: answerData.map((answer) => ({
            attemptId,
            questionId: answer.questionId,
            selectedOptionId: answer.selectedOptionId,
          })),
        });
      }

      // Only the universal PLATFORM_READINESS assessment can change reusable
      // CandidateSkill verification evidence. Employer/job-specific assessment
      // results remain scoped to that application and must never overwrite the
      // candidate's universal historical validation.
      const skillEvidence = qualifiesForSkillValidation
        ? assessment.scope === "PLATFORM_READINESS"
          ? await persistMcqSkillEvidence(tx, {
              candidateProfileId: candidateProfile.id,
              assessmentId: assessment.id,
              attemptId,
              roleTitle: assessment.roleTitle,
              seniority: assessment.seniority,
              passingPercentage: assessment.passingPercentage,
              validityDays: assessment.validityDays,
              questionResults,
            })
          : aggregateMcqSkillEvidence(questionResults)
        : [];

      const updatedAttempt = await tx.mcqAttempt.findUniqueOrThrow({
        where: { id: attemptId },
      });
      return { updatedAttempt, skillEvidence };
    }, { maxWait: 15000, timeout: 20000 });

    if (qualifiesForSkillValidation && assessment.scope === "PLATFORM_READINESS" && assessment.roleTitle && assessment.seniority) {
      const validUntil = assessment.validityDays
        ? new Date(Date.now() + assessment.validityDays * 24 * 60 * 60 * 1000)
        : null;
      await prisma.candidateReadiness.updateMany({
        where: {
          candidateProfileId: candidateProfile.id,
          roleTitle: assessment.roleTitle,
          seniority: assessment.seniority,
          assessmentId: assessment.id,
        },
        data: {
          status: passed ? "JOB_READY" : "DEVELOPING",
          score,
          assessedAt: new Date(),
          validUntil: passed ? validUntil : null,
        },
      });
    }

    const isUniversalSkillValidation =
      assessment.scope === "PLATFORM_READINESS" &&
      assessment.seniority === UNIVERSAL_VALIDATION_SENIORITY;

    let releasedApplicationIds: string[] = [];
    const pendingJobSpecificAssessments: Array<{
      applicationId: string;
      assessmentId: string;
      assessmentUrl: string;
    }> = [];
    if (
      qualifiesForSkillValidation &&
      isUniversalSkillValidation
    ) {
      const { RosGateway } = await import("@/lib/ros/RosGateway");
      releasedApplicationIds = await RosGateway.releaseUniversalValidationApplications({
        userId: session.id,
        candidateProfileId: candidateProfile.id,
        assessmentId: assessment.id,
      });

      if (releasedApplicationIds.length > 0) {
        const releasedApplications = await prisma.application.findMany({
          where: {
            id: { in: releasedApplicationIds },
            candidateProfileId: candidateProfile.id,
          },
          select: {
            id: true,
            jobId: true,
            gates: {
              where: {
                type: ApplicationGateType.JOB_SPECIFIC_ASSESSMENT,
                status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
              },
              select: { assessmentId: true },
              take: 1,
            },
          },
        });
        for (const application of releasedApplications) {
          const jobSpecificAssessmentId = application.gates[0]?.assessmentId ?? null;
          if (jobSpecificAssessmentId) {
            pendingJobSpecificAssessments.push({
              applicationId: application.id,
              assessmentId: jobSpecificAssessmentId,
              assessmentUrl: `/assessment/mcq/active?id=${encodeURIComponent(jobSpecificAssessmentId)}`,
            });
          }
          await dispatchApplicationReceivedConfirmation({
            applicationId: application.id,
            userId: session.id,
            jobId: application.jobId,
          });
        }
      }
    }

    const completedJobSpecificApplicationIds: string[] = [];
    if (qualifiesForSkillValidation && assessment.scope === "EMPLOYER_JOB") {
      const gates = await prisma.applicationGate.findMany({
        where: {
          type: ApplicationGateType.JOB_SPECIFIC_ASSESSMENT,
          status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
          assessmentId: assessment.id,
          application: { candidateProfileId: candidateProfile.id },
        },
        select: { id: true, applicationId: true },
      });

      for (const gate of gates) {
        const completed = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "ApplicationGate" WHERE id = ${gate.id} FOR UPDATE`;
          const claim = await tx.applicationGate.updateMany({
            where: {
              id: gate.id,
              status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
            },
            data: {
              status: ApplicationGateStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
          if (claim.count !== 1) return false;

          await tx.application.updateMany({
            where: {
              id: gate.applicationId,
              candidateProfileId: candidateProfile.id,
              status: "ASSESSMENT",
            },
            data: { status: "APPLIED" },
          });
          return true;
        });

        if (completed) completedJobSpecificApplicationIds.push(gate.applicationId);
      }
    }

    await logAuditEvent({
      userId: session.id,
      action: "MCQ_ASSESSMENT_SUBMITTED",
      resource: `McqAssessment:${assessment.id}`,
      details: `McqAttempt:${attemptId}|Score:${score}|Passed:${passed}|SkillsEvaluated:${submission.skillEvidence.length}`,
    });

    return NextResponse.json({
      success: true,
      attempt: {
        score: submission.updatedAttempt.score,
        earnedPoints: submission.updatedAttempt.earnedPoints,
        totalPoints: submission.updatedAttempt.totalPoints,
        percentage: submission.updatedAttempt.percentage,
        passed: submission.updatedAttempt.passed,
        submittedAt: submission.updatedAttempt.submittedAt,
      },
      results: {
        score: submission.updatedAttempt.score,
        validationEligible: qualifiesForSkillValidation,
        validationNote: qualifiesForSkillValidation
          ? null
          : "This legacy assessment result is retained for history but is not eligible for HireGo Skill Validation evidence.",
        correctCount,
        incorrectCount: assessment.questions.length - correctCount,
        passed: submission.updatedAttempt.passed,
        assessmentScope: assessment.scope,
        isUniversalSkillValidation,
        releasedApplicationIds,
        pendingJobSpecificAssessments,
        applicationContinuation: pendingJobSpecificAssessments.length > 0
          ? "JOB_SPECIFIC_ASSESSMENT_REQUIRED"
          : releasedApplicationIds.length > 0
            ? "SUBMITTED"
            : completedJobSpecificApplicationIds.length > 0
              ? "JOB_SPECIFIC_ASSESSMENT_COMPLETED"
              : "NO_PENDING_APPLICATION",
        completedJobSpecificApplicationIds,
        skillEvidence: submission.skillEvidence.map((item) => ({
          name: item.name,
          score: item.score,
          questionCount: item.questionCount,
          earnedPoints: item.earnedPoints,
          totalPoints: item.totalPoints,
          knowledgeValidated: qualifiesMcqSkillEvidence(item, assessment.passingPercentage),
          assessmentValidated: qualifiesMcqSkillEvidence(item, assessment.passingPercentage),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
