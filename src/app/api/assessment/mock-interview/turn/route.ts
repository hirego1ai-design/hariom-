import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  handleApiError,
  readValidatedJson,
  ApiError,
  enforceRateLimit,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import {
  MockInterviewEngineV2,
  mockTurnEvaluationSchema,
  resolveMockInterviewPersona,
} from "@/lib/mockInterview/MockInterviewEngineV2";
import {
  normalizeMockSeniority,
  startingDifficulty,
} from "@/lib/mockInterview/RoleFamily";
import { LearningEventStore } from "@/lib/intelligence/LearningEventStore";
import { takeVoiceTranscriptReceipt } from "@/lib/mockInterview/VoiceTranscriptReceipt";

const mockInterviewTurnSchema = z
  .object({
    sessionId: z.string().uuid(),
    questionIndex: z.number().int().min(0).max(50),
    answer: z.string().trim().min(5).max(10_000).optional(),
    transcriptionReceiptId: z.string().uuid().optional(),
    durationMs: z.number().int().min(0).max(3_600_000).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.answer && !value.transcriptionReceiptId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answer"],
        message: "Text answer or voice transcription receipt is required.",
      });
    }
  });

function storedEvaluation(value: unknown) {
  const parsed = mockTurnEvaluationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function nextQuestionFromTurn(turn: {
  questionText: string;
  questionIndex: number;
  difficulty: number | null;
  competency: string | null;
  skillTags: string[];
} | undefined) {
  if (!turn) return undefined;
  return {
    text: turn.questionText,
    questionIndex: turn.questionIndex,
    difficulty: turn.difficulty,
    competency: turn.competency,
    skillTags: turn.skillTags,
  };
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "mock_interview_turn", 30, 60_000);
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await readValidatedJson(request, mockInterviewTurnSchema);
    const { sessionId, questionIndex } = body;

    let interviewSession = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
      include: {
        persona: true,
        turns: { orderBy: { questionIndex: "asc" } },
      },
    });

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      include: {
        candidateSkills: {
          where: { isVisible: true },
          orderBy: { updatedAt: "desc" },
          take: 40,
          select: {
            name: true,
            claimedLevel: true,
            verificationStatus: true,
            verifiedLevel: true,
            latestScore: true,
            validUntil: true,
          },
        },
      },
    });

    if (
      !interviewSession ||
      !candidateProfile ||
      interviewSession.candidateProfileId !== candidateProfile.id
    ) {
      throw new ApiError("Session not found", 404);
    }

    if (interviewSession.status !== "IN_PROGRESS") {
      throw new ApiError("Interview is not in progress", 400);
    }

    if (!interviewSession.persona) {
      let resolved: Awaited<ReturnType<typeof resolveMockInterviewPersona>>;
      try {
        resolved = await resolveMockInterviewPersona(
          interviewSession.roleTarget,
        );
      } catch {
        throw new ApiError(
          "Mock Interview interviewer configuration is unavailable.",
          503,
        );
      }
      interviewSession = await prisma.mockInterviewSession.update({
        where: { id: interviewSession.id },
        data: {
          personaId: resolved.persona.id,
          roleFamily: resolved.roleFamily,
          personaVersion: resolved.persona.rubricVersion,
        },
        include: {
          persona: true,
          turns: { orderBy: { questionIndex: "asc" } },
        },
      });
    }

    const currentTurn = interviewSession.turns.find(
      (turn) => turn.questionIndex === questionIndex,
    );
    if (!currentTurn) {
      throw new ApiError("Turn not found", 404);
    }

    const isVoice = interviewSession.mode === "VOICE";

    if (currentTurn.candidateAnswerTranscript !== null) {
      if (
        !isVoice &&
        body.answer &&
        currentTurn.candidateAnswerTranscript !== body.answer
      ) {
        throw new ApiError("This interview turn was already submitted.", 409);
      }

      const isComplete =
        questionIndex >= interviewSession.totalQuestions - 1;
      const nextTurn = interviewSession.turns.find(
        (turn) => turn.questionIndex === questionIndex + 1,
      );

      if (isVoice) {
        return NextResponse.json({
          success: true,
          reused: true,
          voiceMode: true,
          nextQuestion: nextQuestionFromTurn(nextTurn),
          isComplete,
        });
      }

      return NextResponse.json({
        success: true,
        reused: true,
        turnScore: currentTurn.score,
        feedback: currentTurn.feedback,
        evidenceConfidence: currentTurn.evidenceConfidence,
        evaluation: storedEvaluation(currentTurn.evaluation),
        nextQuestion: nextQuestionFromTurn(nextTurn),
        isComplete,
      });
    }

    if (questionIndex !== interviewSession.currentQuestionIndex) {
      throw new ApiError("The interview state changed. Please reload.", 409);
    }

    let answer: string;
    let durationMs: number | undefined;
    let transcriptProvider: string | null = null;
    let transcriptModel: string | null = null;
    let transcriptVersion: string | null = null;
    let transcriptConfidence: number | null = null;
    let conversationLanguage = interviewSession.language || "en";

    if (isVoice) {
      if (!body.transcriptionReceiptId) {
        throw new ApiError(
          "A verified voice transcription receipt is required.",
          400,
        );
      }

      const receipt = await takeVoiceTranscriptReceipt({
        receiptId: body.transcriptionReceiptId,
        userId: auth.id,
        candidateProfileId: candidateProfile.id,
        sessionId: interviewSession.id,
        questionIndex,
      });

      if (!receipt) {
        throw new ApiError(
          "Voice transcription receipt is missing, expired, already used, or does not match this turn. Please record the answer again.",
          409,
        );
      }

      answer = receipt.transcript;
      durationMs =
        receipt.durationSeconds === null
          ? undefined
          : Math.max(
              0,
              Math.min(
                3_600_000,
                Math.round(receipt.durationSeconds * 1_000),
              ),
            );
      transcriptProvider = receipt.provider;
      transcriptModel = receipt.model;
      transcriptVersion = receipt.workerVersion
        ? `${receipt.versionLabel};worker=${receipt.workerVersion}`
        : receipt.versionLabel;
      transcriptConfidence = receipt.confidence;
      conversationLanguage = receipt.detectedLanguage || conversationLanguage;
    } else {
      if (!body.answer) {
        throw new ApiError("Text answer is required for Text Mode.", 400);
      }
      if (body.transcriptionReceiptId) {
        throw new ApiError(
          "Voice transcription receipts cannot be used in Text Mode.",
          400,
        );
      }
      answer = body.answer;
      durationMs = body.durationMs;
    }

    const declaredSeniority = normalizeMockSeniority(
      interviewSession.declaredSeniority || "Mid-Level",
    );
    const currentDifficulty =
      currentTurn.difficulty ?? startingDifficulty(declaredSeniority);
    const isComplete =
      questionIndex >= interviewSession.totalQuestions - 1;

    let evaluation: z.infer<typeof mockTurnEvaluationSchema>;
    try {
      evaluation = await MockInterviewEngineV2.evaluateAndGenerateNext({
        roleTarget: interviewSession.roleTarget,
        declaredSeniority,
        focusSkills: interviewSession.focusSkills,
        candidateSkills: candidateProfile.candidateSkills.map((skill) => ({
          ...skill,
          claimedLevel: skill.claimedLevel,
          verificationStatus: skill.verificationStatus,
          verifiedLevel: skill.verifiedLevel,
        })),
        language: conversationLanguage,
        totalQuestions: interviewSession.totalQuestions,
        questionIndex,
        currentQuestion: currentTurn.questionText,
        answer,
        durationMs,
        currentDifficulty,
        currentCompetency: currentTurn.competency,
        currentSkillTags: currentTurn.skillTags,
        previousTurns: interviewSession.turns,
        persona: interviewSession.persona!,
      });
    } catch {
      throw new ApiError(
        "Mock interview evaluation service is unavailable. Please try again later.",
        503,
      );
    }

    if (isComplete) {
      evaluation = { ...evaluation, nextQuestion: null };
    } else if (!evaluation.nextQuestion) {
      throw new ApiError(
        "Mock interview question service returned an incomplete adaptive turn. Please try again.",
        503,
      );
    }

    const nextIndex = questionIndex + 1;
    const nextQuestionData =
      !isComplete && evaluation.nextQuestion
        ? {
            text: evaluation.nextQuestion,
            questionIndex: nextIndex,
            difficulty: evaluation.nextDifficulty,
            competency:
              evaluation.nextCompetency ?? evaluation.competency,
            skillTags: evaluation.nextSkillTags.length
              ? evaluation.nextSkillTags
              : evaluation.skillTags,
          }
        : undefined;

    await prisma.$transaction(async (tx) => {
      const claimedTurn = await tx.mockInterviewTurn.updateMany({
        where: { id: currentTurn.id, candidateAnswerTranscript: null },
        data: {
          candidateAnswerTranscript: answer,
          turnLatencyMs: durationMs ?? 0,
          transcriptProvider,
          transcriptModel,
          transcriptVersion,
          transcriptConfidence,
          score: Math.max(
            0,
            Math.min(100, Math.round(evaluation.score)),
          ),
          feedback: evaluation.feedback,
          evidenceConfidence: evaluation.evidenceConfidence,
          competency: evaluation.competency,
          skillTags: evaluation.skillTags,
          evaluation: evaluation as unknown as Prisma.InputJsonValue,
        },
      });

      if (claimedTurn.count !== 1) {
        throw new ApiError(
          "This interview turn was already submitted.",
          409,
        );
      }

      if (nextQuestionData) {
        await tx.mockInterviewTurn.create({
          data: {
            sessionId: interviewSession.id,
            questionIndex: nextQuestionData.questionIndex,
            questionText: nextQuestionData.text,
            difficulty: nextQuestionData.difficulty,
            competency: nextQuestionData.competency,
            skillTags: nextQuestionData.skillTags,
          },
        });
      }

      const advancedSession = await tx.mockInterviewSession.updateMany({
        where: {
          id: interviewSession.id,
          currentQuestionIndex: questionIndex,
        },
        data: {
          ...(nextQuestionData
            ? { currentQuestionIndex: nextQuestionData.questionIndex }
            : {}),
          ...(isVoice ? { language: conversationLanguage } : {}),
          calibrationState: {
            version: "mock-interview-calibration-v2",
            declaredLevelIsHypothesis: true,
            lastDifficulty: currentDifficulty,
            nextDifficulty: evaluation.nextDifficulty,
            lastAdjustment: evaluation.difficultyAdjustment,
            lastSupportMode: evaluation.supportMode,
            updatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      if (advancedSession.count !== 1) {
        throw new ApiError(
          "The interview state changed. Please reload.",
          409,
        );
      }
    });

    void LearningEventStore.record({
      idempotencyKey: `mock-interview-turn:${currentTurn.id}`,
      correlationId: interviewSession.id,
      actorUserId: auth.id,
      actorRole: Role.CANDIDATE,
      channel: isVoice ? "WEB_VOICE" : "WEB",
      feature: "MOCK_INTERVIEW",
      task: "TURN_EVALUATED",
      evidenceRefs: {
        sessionId: interviewSession.id,
        turnId: currentTurn.id,
        questionIndex,
        roleTarget: interviewSession.roleTarget,
        personaVersion: interviewSession.personaVersion,
        mode: interviewSession.mode,
        transcriptProvenance: isVoice
          ? {
              provider: transcriptProvider,
              model: transcriptModel,
              version: transcriptVersion,
              confidence: transcriptConfidence,
              language: conversationLanguage,
            }
          : null,
      },
      aiOutput: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        evidenceConfidence: evaluation.evidenceConfidence,
        demonstratedLevel: evaluation.demonstratedLevel,
        competency: evaluation.competency,
        skillTags: evaluation.skillTags,
        evidence: evaluation.evidence,
        difficultyAdjustment: evaluation.difficultyAdjustment,
        nextDifficulty: evaluation.nextDifficulty,
        supportMode: evaluation.supportMode,
        nextCompetency: evaluation.nextCompetency,
        nextSkillTags: evaluation.nextSkillTags,
      },
      acceptedResult: {
        nextQuestionCreated: Boolean(nextQuestionData),
        nextDifficulty: nextQuestionData?.difficulty ?? null,
      },
    }).catch(() => null);

    if (isVoice) {
      return NextResponse.json({
        success: true,
        voiceMode: true,
        nextQuestion: nextQuestionData,
        isComplete,
      });
    }

    return NextResponse.json({
      success: true,
      turnScore: evaluation.score,
      feedback: evaluation.feedback,
      evidenceConfidence: evaluation.evidenceConfidence,
      evaluation,
      nextQuestion: nextQuestionData,
      isComplete,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
