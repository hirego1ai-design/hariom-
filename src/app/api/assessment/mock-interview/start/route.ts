import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  handleApiError,
  readValidatedJson,
  ApiError,
  enforceRateLimit,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma, Role } from "@prisma/client";
import {
  MockInterviewEngineV2,
  resolveMockInterviewPersona,
} from "@/lib/mockInterview/MockInterviewEngineV2";
import {
  normalizeMockSeniority,
  seniorityLabel,
  MockSeniority,
} from "@/lib/mockInterview/RoleFamily";
import { LanguagePreferenceService, resolveConversationLanguage } from "@/lib/intelligence/LanguagePreference";
import { LearningEventStore } from "@/lib/intelligence/LearningEventStore";

const senioritySchema = z.enum(["Junior", "Mid-Level", "Senior", "Staff/Lead"]);

const mockInterviewStartSchema = z.object({
  idempotencyKey: z.string().uuid(),
  roleTarget: z.string().trim().min(1).max(120),
  declaredSeniority: senioritySchema.optional(),
  totalQuestions: z.number().int().min(3).max(10).optional().default(5),
  focusSkills: z.array(z.string().trim().min(1).max(120)).max(6).optional().default([]),
  practiceContext: z.string().trim().max(2_000).optional().nullable(),
  language: z.string().trim().min(2).max(35).regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8}){0,3}$/).optional(),
  mode: z.literal("TEXT").optional().default("TEXT"),
}).strict();

function normalizeLegacyRoleInput(roleTarget: string, declared?: z.infer<typeof senioritySchema>) {
  if (declared) {
    return {
      roleTarget,
      seniority: normalizeMockSeniority(declared),
    };
  }

  const legacy = roleTarget.match(/^(Junior|Mid-Level|Senior|Staff\/Lead)\s+(.+)$/i);
  if (legacy?.[1] && legacy?.[2]) {
    return {
      roleTarget: legacy[2].trim(),
      seniority: normalizeMockSeniority(legacy[1]),
    };
  }

  return {
    roleTarget,
    seniority: "MID" as MockSeniority,
  };
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "mock_interview_start", 8, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await readValidatedJson(request, mockInterviewStartSchema);
    const normalized = normalizeLegacyRoleInput(body.roleTarget, body.declaredSeniority);
    const roleTarget = normalized.roleTarget;
    const declaredSeniority = normalized.seniority;
    const focusSkills = body.focusSkills ?? [];
    const totalQuestions = body.totalQuestions ?? 5;

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
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

    if (!candidateProfile) {
      throw new ApiError(
        "Candidate profile not found. Please complete your profile first.",
        404,
      );
    }

    const existingSession = await prisma.mockInterviewSession.findUnique({
      where: { idempotencyKey: body.idempotencyKey },
      include: {
        persona: true,
        turns: { orderBy: { questionIndex: "asc" }, take: 1 },
      },
    });
    if (existingSession) {
      if (existingSession.candidateProfileId !== candidateProfile.id) {
        throw new ApiError("Mock interview request key is already in use.", 409);
      }
      const firstTurn = existingSession.turns[0];
      if (!firstTurn) {
        throw new ApiError("Existing mock interview session is incomplete.", 409);
      }
      return NextResponse.json({
        success: true,
        reused: true,
        session: {
          id: existingSession.id,
          roleTarget: existingSession.roleTarget,
          declaredSeniority: existingSession.declaredSeniority,
          roleFamily: existingSession.roleFamily,
          totalQuestions: existingSession.totalQuestions,
          currentQuestionIndex: existingSession.currentQuestionIndex,
          focusSkills: existingSession.focusSkills,
          language: existingSession.language,
          mode: existingSession.mode,
          openingMessage: existingSession.openingMessage,
          persona: existingSession.persona
            ? {
                name: existingSession.persona.displayName,
                roleFamily: existingSession.persona.roleFamily,
                rubricVersion: existingSession.persona.rubricVersion,
              }
            : null,
        },
        question: {
          text: firstTurn.questionText,
          questionIndex: firstTurn.questionIndex,
          difficulty: firstTurn.difficulty,
          competency: firstTurn.competency,
          skillTags: firstTurn.skillTags,
        },
      });
    }

    const mockService = await prisma.candidateServiceCatalog.findFirst({
      where: {
        serviceKey: { in: ["mock-interview", "mock_interview"] },
        isActive: true,
      },
    });

    if (!mockService) {
      throw new ApiError(
        "AI Mock Interview is temporarily unavailable because its candidate credit configuration is not published.",
        503,
      );
    }

    if (mockService.creditCost > 0) {
      const wallet = await prisma.candidateCreditWallet.upsert({
        where: { candidateProfileId: candidateProfile.id },
        create: { candidateProfileId: candidateProfile.id, balance: 0 },
        update: {},
      });
      if (wallet.balance < mockService.creditCost) {
        throw new ApiError(
          `Insufficient credits. AI Mock Interview requires ${mockService.creditCost} credits, but your wallet balance is ${wallet.balance}.`,
          402,
        );
      }
    }

    let personaResolution: Awaited<ReturnType<typeof resolveMockInterviewPersona>>;
    try {
      personaResolution = await resolveMockInterviewPersona(roleTarget);
    } catch {
      throw new ApiError(
        "AI Mock Interview is temporarily unavailable because interviewer configuration is not published.",
        503,
      );
    }

    const preference = await LanguagePreferenceService.get(session.id).catch(() => null);
    const language = resolveConversationLanguage({
      explicitLanguage: body.language,
      storedLanguage: preference?.preferredLanguage,
      fallbackLanguage: "en",
    });

    let firstQuestion: Awaited<ReturnType<typeof MockInterviewEngineV2.generateFirstQuestion>>;
    try {
      firstQuestion = await MockInterviewEngineV2.generateFirstQuestion({
        roleTarget,
        declaredSeniority,
        focusSkills: focusSkills,
        candidateSkills: candidateProfile.candidateSkills.map((skill) => ({
          ...skill,
          claimedLevel: skill.claimedLevel,
          verificationStatus: skill.verificationStatus,
          verifiedLevel: skill.verifiedLevel,
        })),
        practiceContext: body.practiceContext,
        language,
        totalQuestions: totalQuestions,
        persona: personaResolution.persona,
      });
    } catch {
      throw new ApiError(
        "Mock interview question service is unavailable. Please try again later.",
        503,
      );
    }

    let interviewSession;
    try {
      interviewSession = await prisma.$transaction(async (tx) => {
        if (mockService.creditCost > 0) {
          const debit = await tx.candidateCreditWallet.updateMany({
            where: {
              candidateProfileId: candidateProfile.id,
              balance: { gte: mockService.creditCost },
            },
            data: { balance: { decrement: mockService.creditCost } },
          });

          if (debit.count !== 1) {
            throw new ApiError(
              "Insufficient candidate credits to start mock interview.",
              402,
            );
          }

          const wallet = await tx.candidateCreditWallet.findUniqueOrThrow({
            where: { candidateProfileId: candidateProfile.id },
          });

          await tx.candidateCreditLedger.create({
            data: {
              candidateProfileId: candidateProfile.id,
              type: "SPEND",
              amount: -mockService.creditCost,
              balanceAfter: wallet.balance,
              serviceKey: mockService.serviceKey,
              idempotencyKey: `mock-interview:${candidateProfile.id}:${body.idempotencyKey}`,
              reference: `AI Mock Interview: ${roleTarget}`,
            },
          });
        }

        return tx.mockInterviewSession.create({
          data: {
            candidateProfileId: candidateProfile.id,
            idempotencyKey: body.idempotencyKey,
            roleTarget,
            declaredSeniority: seniorityLabel(declaredSeniority),
            roleFamily: personaResolution.roleFamily,
            personaId: personaResolution.persona.id,
            personaVersion: personaResolution.persona.rubricVersion,
            language,
            mode: "TEXT",
            openingMessage: firstQuestion.openingMessage,
            practiceContext: body.practiceContext ?? null,
            focusSkills: focusSkills,
            totalQuestions: totalQuestions,
            currentQuestionIndex: 0,
            status: "IN_PROGRESS",
            calibrationState: {
              version: "mock-interview-calibration-v2",
              declaredLevelIsHypothesis: true,
              initialDifficulty: firstQuestion.difficulty,
            } as Prisma.InputJsonValue,
            turns: {
              create: {
                questionIndex: 0,
                questionText: firstQuestion.nextQuestion,
                difficulty: firstQuestion.difficulty,
                competency: firstQuestion.competency,
                skillTags: firstQuestion.skillTags,
              },
            },
          },
          include: { persona: true },
        });
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        const racedSession = await prisma.mockInterviewSession.findUnique({
          where: { idempotencyKey: body.idempotencyKey },
          include: {
            persona: true,
            turns: { orderBy: { questionIndex: "asc" }, take: 1 },
          },
        });
        if (
          racedSession &&
          racedSession.candidateProfileId === candidateProfile.id &&
          racedSession.turns[0]
        ) {
          return NextResponse.json({
            success: true,
            reused: true,
            session: {
              id: racedSession.id,
              roleTarget: racedSession.roleTarget,
              declaredSeniority: racedSession.declaredSeniority,
              roleFamily: racedSession.roleFamily,
              totalQuestions: racedSession.totalQuestions,
              currentQuestionIndex: racedSession.currentQuestionIndex,
              focusSkills: racedSession.focusSkills,
              language: racedSession.language,
              mode: racedSession.mode,
              openingMessage: racedSession.openingMessage,
              persona: racedSession.persona
                ? {
                    name: racedSession.persona.displayName,
                    roleFamily: racedSession.persona.roleFamily,
                    rubricVersion: racedSession.persona.rubricVersion,
                  }
                : null,
            },
            question: {
              text: racedSession.turns[0].questionText,
              questionIndex: racedSession.turns[0].questionIndex,
              difficulty: racedSession.turns[0].difficulty,
              competency: racedSession.turns[0].competency,
              skillTags: racedSession.turns[0].skillTags,
            },
          });
        }
      }
      throw error;
    }

    void LearningEventStore.record({
      idempotencyKey: `mock-interview-start:${interviewSession.id}`,
      correlationId: interviewSession.id,
      actorUserId: session.id,
      actorRole: Role.CANDIDATE,
      channel: "WEB",
      feature: "MOCK_INTERVIEW",
      task: "SESSION_STARTED",
      evidenceRefs: {
        candidateProfileId: candidateProfile.id,
        roleTarget,
        declaredSeniority: seniorityLabel(declaredSeniority),
        roleFamily: personaResolution.roleFamily,
        personaKey: personaResolution.persona.key,
        rubricVersion: personaResolution.persona.rubricVersion,
      },
      acceptedResult: {
        difficulty: firstQuestion.difficulty,
        competency: firstQuestion.competency,
        skillTags: firstQuestion.skillTags,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      session: {
        id: interviewSession.id,
        roleTarget: interviewSession.roleTarget,
        declaredSeniority: interviewSession.declaredSeniority,
        roleFamily: interviewSession.roleFamily,
        totalQuestions: interviewSession.totalQuestions,
        currentQuestionIndex: interviewSession.currentQuestionIndex,
        focusSkills: interviewSession.focusSkills,
        language: interviewSession.language,
        mode: interviewSession.mode,
        openingMessage: interviewSession.openingMessage,
        persona: interviewSession.persona
          ? {
              name: interviewSession.persona.displayName,
              roleFamily: interviewSession.persona.roleFamily,
              rubricVersion: interviewSession.persona.rubricVersion,
            }
          : null,
      },
      question: {
        text: firstQuestion.nextQuestion,
        questionIndex: 0,
        difficulty: firstQuestion.difficulty,
        competency: firstQuestion.competency,
        skillTags: firstQuestion.skillTags,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
