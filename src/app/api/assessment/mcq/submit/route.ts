import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, ApiError, readValidatedJson, enforceRateLimit } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { z } from "zod";

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

    if (!candidateProfile) {
      throw new ApiError("Candidate profile not found", 404);
    }

    const attempt = await prisma.mcqAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new ApiError("Attempt not found", 404);
    }

    if (attempt.candidateProfileId !== candidateProfile.id) {
      throw new ApiError("Attempt does not belong to you", 403);
    }

    if (attempt.submittedAt !== null) {
      throw new ApiError("Attempt has already been submitted", 400);
    }

    const { assessment } = attempt;

    // Server-Side Timer Expiry Enforcement
    const durationLimitMs = (assessment.durationMinutes * 60 + 60) * 1000; // 60s network grace period
    const elapsedMs = Date.now() - attempt.startedAt.getTime();
    if (elapsedMs > durationLimitMs) {
      throw new ApiError("Assessment duration has expired. Submission rejected.", 400);
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const answerData: { questionId: string; selectedOptionId: string }[] = [];

    for (const q of assessment.questions) {
      totalPoints += q.points;
      
      const submittedAnswer = answers.find(a => a.questionId === q.id);
      let selectedOptionId: string | null = null;
      let isCorrect = false;

      if (submittedAnswer) {
        selectedOptionId = submittedAnswer.selectedOptionId;
        const selectedOption = q.options.find(opt => opt.id === selectedOptionId);
        
        if (!selectedOption) {
          throw new ApiError(`Option ${selectedOptionId} is not valid for question ${q.id}`, 400);
        }
        
        isCorrect = selectedOption.isCorrect;
        if (isCorrect) {
          earnedPoints += q.points;
          correctCount++;
        }
      }

      if (selectedOptionId) {
        answerData.push({
          questionId: q.id,
          selectedOptionId: selectedOptionId,
        });
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= assessment.passingPercentage;
    const score = Math.round(percentage);

    // Atomic Submission with double-submit race condition defense
    const updatedAttempt = await prisma.$transaction(async (tx) => {
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
          data: answerData.map(a => ({
            attemptId,
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
          })),
        });
      }

      return await tx.mcqAttempt.findUniqueOrThrow({
        where: { id: attemptId },
      });
    }, { maxWait: 15000, timeout: 20000 });

    if (assessment.scope === "PLATFORM_READINESS" && assessment.roleTitle && assessment.seniority) {
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

    await logAuditEvent({
      userId: session.id,
      action: "MCQ_ASSESSMENT_SUBMITTED",
      resource: `McqAssessment:${assessment.id}`,
      details: `McqAttempt:${attemptId}|Score:${score}|Passed:${passed}`,
    });

    return NextResponse.json({
      success: true,
      attempt: {
        score: updatedAttempt.score,
        earnedPoints: updatedAttempt.earnedPoints,
        totalPoints: updatedAttempt.totalPoints,
        percentage: updatedAttempt.percentage,
        passed: updatedAttempt.passed,
        submittedAt: updatedAttempt.submittedAt,
      },
      results: {
        score: updatedAttempt.score,
        correctCount,
        incorrectCount: assessment.questions.length - correctCount,
        passed: updatedAttempt.passed,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
