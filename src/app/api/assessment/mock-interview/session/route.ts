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
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });

    if (!candidateProfile) {
      throw new ApiError("Candidate profile not found", 404);
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id") || undefined;
    const parsed = querySchema.safeParse({ id: idParam });
    if (!parsed.success) {
      throw new ApiError("Invalid session id parameter", 400);
    }

    const targetId = parsed.data.id;

    // Single session detail request
    if (targetId) {
      const interviewSession = await prisma.mockInterviewSession.findUnique({
        where: { id: targetId },
        include: {
          turns: {
            orderBy: { questionIndex: "asc" },
          },
        },
      });

      if (!interviewSession || interviewSession.candidateProfileId !== candidateProfile.id) {
        throw new ApiError("Session not found or access denied", 404);
      }

      return NextResponse.json({
        success: true,
        session: {
          id: interviewSession.id,
          roleTarget: interviewSession.roleTarget,
          status: interviewSession.status,
          totalQuestions: interviewSession.totalQuestions,
          currentQuestionIndex: interviewSession.currentQuestionIndex,
          overallScore: interviewSession.overallScore,
          aiFeedback: interviewSession.aiFeedback,
          createdAt: interviewSession.createdAt.toISOString(),
          turns: interviewSession.turns.map((t) => ({
            id: t.id,
            questionIndex: t.questionIndex,
            questionText: t.questionText,
            candidateAnswerTranscript: t.candidateAnswerTranscript,
            score: t.score,
            feedback: t.feedback,
            turnLatencyMs: t.turnLatencyMs,
          })),
        },
      });
    }

    // List past sessions for candidate (History)
    const sessions = await prisma.mockInterviewSession.findMany({
      where: { candidateProfileId: candidateProfile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { turns: true } },
      },
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        roleTarget: s.roleTarget,
        status: s.status,
        totalQuestions: s.totalQuestions,
        currentQuestionIndex: s.currentQuestionIndex,
        overallScore: s.overallScore,
        aiFeedback: s.aiFeedback,
        turnsCount: s._count.turns,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
