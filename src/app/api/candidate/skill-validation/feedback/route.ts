import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AssessmentFeedbackStatus, SkillEvidenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";
import { getUniversalSkillValidationPolicy } from "@/lib/universalSkillValidationPolicy";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { dispatchAiTask } from "@/utils/aiRouter";

const requestSchema = z.object({
  attemptId: z.string().uuid(),
}).strict();

const feedbackSchema = z.object({
  summary: z.string().trim().min(1).max(2_000),
  strengths: z.array(z.string().trim().min(1).max(500)).max(6),
  improvementAreas: z.array(z.object({
    skill: z.string().trim().min(1).max(120),
    observation: z.string().trim().min(1).max(700),
    nextStep: z.string().trim().min(1).max(700),
  }).strict()).max(8),
  practiceSuggestions: z.array(z.string().trim().min(1).max(700)).max(8),
  mockInterviewFocusSkills: z.array(z.string().trim().min(1).max(120)).max(6),
}).strict();

function parseJson(raw: string) {
  const trimmed = raw.trim();
  const unfenced = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  return JSON.parse(unfenced);
}

async function candidateFor(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") {
    throw new ApiError("Candidate access required", 403);
  }
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return { session, profile };
}

async function loadOwnedUniversalAttempt(candidateProfileId: string, attemptId: string) {
  const attempt = await prisma.mcqAttempt.findFirst({
    where: {
      id: attemptId,
      candidateProfileId,
      submittedAt: { not: null },
      assessment: {
        scope: "PLATFORM_READINESS",
        seniority: UNIVERSAL_VALIDATION_SENIORITY,
      },
    },
    select: {
      id: true,
      score: true,
      percentage: true,
      passed: true,
      submittedAt: true,
      assessment: {
        select: {
          id: true,
          roleTitle: true,
          passingPercentage: true,
        },
      },
    },
  });
  if (!attempt) {
    throw new ApiError("Completed Universal Skill Validation attempt not found.", 404);
  }
  return attempt;
}

function feedbackResponse(record: {
  status: AssessmentFeedbackStatus;
  feedback: unknown;
  provider: string | null;
  model: string | null;
  generatedAt: Date | null;
  errorMessage: string | null;
}, policy: { mockInterviewRecommendationEnabled: boolean }, roleTitle: string | null) {
  const parsed = record.feedback ? feedbackSchema.safeParse(record.feedback) : null;
  const feedback = parsed?.success ? parsed.data : null;
  const focus = feedback?.mockInterviewFocusSkills ?? [];
  const params = new URLSearchParams();
  if (roleTitle) params.set("role", roleTitle);
  if (focus.length) params.set("focus", focus.join(","));

  return {
    status: record.status,
    feedback,
    provenance: record.provider && record.model
      ? { provider: record.provider, model: record.model, generatedAt: record.generatedAt }
      : null,
    error: record.status === "FAILED" ? record.errorMessage : null,
    mockInterviewRecommended: policy.mockInterviewRecommendationEnabled && focus.length > 0,
    mockInterviewSetupUrl: policy.mockInterviewRecommendationEnabled
      ? `/ai/mock-interview/setup?${params.toString()}`
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_assessment_feedback_read", 60, 60_000);
    const { profile } = await candidateFor(request);
    const attemptId = request.nextUrl.searchParams.get("attemptId");
    if (!attemptId || !z.string().uuid().safeParse(attemptId).success) {
      throw new ApiError("Valid attemptId is required.", 400);
    }

    const [attempt, policy] = await Promise.all([
      loadOwnedUniversalAttempt(profile.id, attemptId),
      getUniversalSkillValidationPolicy(),
    ]);
    const record = await prisma.assessmentFeedback.findUnique({
      where: { attemptId },
    });

    if (!record) {
      return NextResponse.json({
        success: true,
        status: "NOT_REQUESTED",
        feedback: null,
        mockInterviewRecommended: false,
        mockInterviewSetupUrl: null,
      });
    }

    return NextResponse.json({
      success: true,
      ...feedbackResponse(record, policy, attempt.assessment.roleTitle),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  let claimedFeedbackId: string | null = null;
  try {
    await enforceRateLimit(request, "candidate_assessment_feedback_generate", 8, 60_000);
    const { profile } = await candidateFor(request);
    const { attemptId } = await readValidatedJson(request, requestSchema, 4 * 1024);
    const [attempt, policy] = await Promise.all([
      loadOwnedUniversalAttempt(profile.id, attemptId),
      getUniversalSkillValidationPolicy(),
    ]);

    if (!policy.feedbackEnabled) {
      throw new ApiError("Private assessment feedback is disabled by HireGo policy.", 409);
    }

    let record = await prisma.assessmentFeedback.upsert({
      where: { attemptId },
      create: {
        attemptId,
        candidateProfileId: profile.id,
        status: AssessmentFeedbackStatus.PENDING,
      },
      update: {},
    });

    if (record.candidateProfileId !== profile.id) {
      throw new ApiError("Assessment feedback does not belong to you.", 403);
    }

    if (record.status === AssessmentFeedbackStatus.COMPLETED) {
      return NextResponse.json({
        success: true,
        ...feedbackResponse(record, policy, attempt.assessment.roleTitle),
      });
    }

    const claim = await prisma.assessmentFeedback.updateMany({
      where: {
        id: record.id,
        candidateProfileId: profile.id,
        status: { in: [AssessmentFeedbackStatus.PENDING, AssessmentFeedbackStatus.FAILED] },
      },
      data: {
        status: AssessmentFeedbackStatus.PROCESSING,
        errorMessage: null,
      },
    });

    if (claim.count !== 1) {
      return NextResponse.json({
        success: true,
        status: "PROCESSING",
        feedback: null,
        mockInterviewRecommended: false,
        mockInterviewSetupUrl: null,
      }, { status: 202 });
    }
    claimedFeedbackId = record.id;

    const evidence = await prisma.skillEvidence.findMany({
      where: {
        evidenceType: SkillEvidenceType.MCQ_ASSESSMENT,
        sourceId: attemptId,
        candidateSkill: { candidateProfileId: profile.id },
      },
      select: {
        score: true,
        questionCount: true,
        qualifiesVerification: true,
        candidateSkill: { select: { name: true } },
      },
      orderBy: { candidateSkill: { name: "asc" } },
    });

    if (!evidence.length) {
      throw new Error("Deterministic per-skill evidence is unavailable for this attempt.");
    }

    const deterministicFacts = {
      roleTitle: attempt.assessment.roleTitle,
      overallScore: attempt.score,
      passedOverallThreshold: attempt.passed,
      passingPercentage: attempt.assessment.passingPercentage,
      skills: evidence.map((item) => ({
        name: item.candidateSkill.name,
        score: item.score,
        questionCount: item.questionCount,
        knowledgeValidated: item.qualifiesVerification,
      })),
    };

    const allowedSkills = new Set(
      deterministicFacts.skills.map((skill) => skill.name.toLowerCase()),
    );

    const { result: raw, usedEndpoint } = await ModelRouter.executeWithFallback({
      taskType: "assessment-feedback",
      fn: async (endpoint, route, isFallback) => {
        const prompt = [
          "Generate private candidate coaching from deterministic HireGo assessment facts.",
          "Never change, recalculate, contradict, or invent scores, pass status, skills, experience, certifications, employer decisions, or verification status.",
          "Do not claim this short knowledge assessment proves practical mastery.",
          "Focus suggestions on the supplied skills and scores only.",
          'Return strict JSON: {"summary":string,"strengths":string[],"improvementAreas":[{"skill":string,"observation":string,"nextStep":string}],"practiceSuggestions":string[],"mockInterviewFocusSkills":string[]}.',
          `<DETERMINISTIC_FACTS>${JSON.stringify(deterministicFacts)}</DETERMINISTIC_FACTS>`,
        ].join("\n");

        const execution = await dispatchAiTask({
          task: "ASSESSMENT_FEEDBACK",
          prompt,
          provider: endpoint.provider,
          model: endpoint.model,
          modelConfig: endpoint.config,
          timeoutMs: route.timeoutMs,
          temperature: route.temperature,
          maxTokens: route.maxTokens,
          isFallback,
        });
        return execution.resultText;
      },
      validateResult: (rawResult) => {
        let candidateFeedback: z.infer<typeof feedbackSchema>;
        try {
          candidateFeedback = feedbackSchema.parse(parseJson(rawResult));
        } catch {
          throw new Error("Assessment feedback returned invalid structured output.");
        }
        for (const item of candidateFeedback.improvementAreas) {
          if (!allowedSkills.has(item.skill.toLowerCase())) {
            throw new Error("Assessment feedback referenced a skill outside the deterministic evidence.");
          }
        }
        for (const skill of candidateFeedback.mockInterviewFocusSkills) {
          if (!allowedSkills.has(skill.toLowerCase())) {
            throw new Error("Assessment feedback proposed a mock-interview focus outside the deterministic evidence.");
          }
        }
      },
    });

    const parsed = feedbackSchema.parse(parseJson(raw));
    for (const item of parsed.improvementAreas) {
      if (!allowedSkills.has(item.skill.toLowerCase())) {
        throw new Error("Assessment feedback referenced a skill outside the deterministic evidence.");
      }
    }
    for (const skill of parsed.mockInterviewFocusSkills) {
      if (!allowedSkills.has(skill.toLowerCase())) {
        throw new Error("Assessment feedback proposed a mock-interview focus outside the deterministic evidence.");
      }
    }

    record = await prisma.assessmentFeedback.update({
      where: { id: record.id },
      data: {
        status: AssessmentFeedbackStatus.COMPLETED,
        feedback: parsed,
        provider: usedEndpoint.provider,
        model: usedEndpoint.model,
        schemaVersion: "assessment-feedback-v1",
        generatedAt: new Date(),
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      ...feedbackResponse(record, policy, attempt.assessment.roleTitle),
    });
  } catch (error) {
    if (claimedFeedbackId) {
      await prisma.assessmentFeedback.updateMany({
        where: {
          id: claimedFeedbackId,
          status: AssessmentFeedbackStatus.PROCESSING,
        },
        data: {
          status: AssessmentFeedbackStatus.FAILED,
          errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : "Feedback generation failed.",
        },
      }).catch(() => null);
    }
    return handleApiError(error);
  }
}
