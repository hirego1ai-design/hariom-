import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, ApiError, enforceRateLimit } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  id: z.string().uuid().optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "mock_interview_session", 60, 60_000);
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    if (!candidateProfile) {
      throw new ApiError("Candidate profile not found", 404);
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      id: searchParams.get("id") || undefined,
    });
    if (!parsed.success) {
      throw new ApiError("Invalid session id parameter", 400);
    }

    if (parsed.data.id) {
      const interviewSession = await prisma.mockInterviewSession.findUnique({
        where: { id: parsed.data.id },
        include: {
          persona: true,
          turns: {
            orderBy: { questionIndex: "asc" },
          },
        },
      });

      if (
        !interviewSession ||
        interviewSession.candidateProfileId !== candidateProfile.id
      ) {
        throw new ApiError("Session not found or access denied", 404);
      }

      return NextResponse.json({
        success: true,
        session: {
          id: interviewSession.id,
          roleTarget: interviewSession.roleTarget,
          declaredSeniority: interviewSession.declaredSeniority,
          roleFamily: interviewSession.roleFamily,
          status: interviewSession.status,
          mode: interviewSession.mode,
          language: interviewSession.language,
          openingMessage: interviewSession.openingMessage,
          practiceContext: interviewSession.practiceContext,
          totalQuestions: interviewSession.totalQuestions,
          currentQuestionIndex: interviewSession.currentQuestionIndex,
          overallScore: interviewSession.overallScore,
          estimatedLevel: interviewSession.estimatedLevel,
          levelConfidence: interviewSession.levelConfidence,
          missingEvidence: interviewSession.missingEvidence,
          nextPracticePlan: interviewSession.nextPracticePlan,
          finalReport: interviewSession.finalReport,
          aiFeedback: interviewSession.aiFeedback,
          calibrationState: interviewSession.calibrationState,
          persona: interviewSession.persona
            ? {
                key: interviewSession.persona.key,
                name: interviewSession.persona.displayName,
                roleFamily: interviewSession.persona.roleFamily,
                tone: interviewSession.persona.tone,
                rubricVersion: interviewSession.persona.rubricVersion,
              }
            : null,
          createdAt: interviewSession.createdAt.toISOString(),
          updatedAt: interviewSession.updatedAt.toISOString(),
          turns: interviewSession.turns.map((turn) => ({
            id: turn.id,
            questionIndex: turn.questionIndex,
            questionText: turn.questionText,
            difficulty: turn.difficulty,
            competency: turn.competency,
            skillTags: turn.skillTags,
            candidateAnswerTranscript: turn.candidateAnswerTranscript,
            transcriptProvider: turn.transcriptProvider,
            transcriptModel: turn.transcriptModel,
            transcriptVersion: turn.transcriptVersion,
            transcriptConfidence: turn.transcriptConfidence,
            score: turn.score,
            feedback: turn.feedback,
            evidenceConfidence: turn.evidenceConfidence,
            evaluation: turn.evaluation,
            turnLatencyMs: turn.turnLatencyMs,
          })),
        },
      });
    }

    const sessions = await prisma.mockInterviewSession.findMany({
      where: { candidateProfileId: candidateProfile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        persona: true,
        _count: { select: { turns: true } },
      },
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map((session) => ({
        id: session.id,
        roleTarget: session.roleTarget,
        declaredSeniority: session.declaredSeniority,
        roleFamily: session.roleFamily,
        status: session.status,
        mode: session.mode,
        language: session.language,
        overallScore: session.overallScore,
        estimatedLevel: session.estimatedLevel,
        levelConfidence: session.levelConfidence,
        aiFeedback: session.aiFeedback,
        persona: session.persona
          ? {
              name: session.persona.displayName,
              roleFamily: session.persona.roleFamily,
              rubricVersion: session.persona.rubricVersion,
            }
          : null,
        turnsCount: session._count.turns,
        createdAt: session.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
