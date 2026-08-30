import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { handleApiError, readValidatedJson, ApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { z } from 'zod';

const mockInterviewFinishSchema = z.object({
  sessionId: z.string().uuid(),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== 'CANDIDATE') {
      throw new ApiError('Unauthorized', 401);
    }

    const body = await readValidatedJson(request, mockInterviewFinishSchema);
    const { sessionId } = body;

    const interviewSession = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
      include: { turns: true }
    });

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id }
    });

    if (!interviewSession || !candidateProfile || interviewSession.candidateProfileId !== candidateProfile.id) {
      throw new ApiError('Session not found', 404);
    }

    const turns = interviewSession.turns.filter(t => t.score !== null);
    const turnCount = turns.length;
    
    let overallScore = 0;
    if (turnCount > 0) {
      overallScore = turns.reduce((acc, t) => acc + (t.score || 0), 0) / turnCount;
    }

    const practiceFeedback = `Practice session completed with ${turnCount} answered turns. The score is a fluency practice metric only; it is not a technical, communication, or hiring evaluation.`;

    await prisma.mockInterviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        overallScore,
        communicationScore: null,
        technicalScore: null,
        aiFeedback: practiceFeedback,
      }
    });

    await logAuditEvent({
      action: 'MOCK_INTERVIEW_COMPLETED',
      userId: session.id,
      resource: `interview_session_${sessionId}`,
      details: `Completed session with score ${overallScore}`
    });

    return NextResponse.json({
      success: true,
      report: {
        mode: 'PRACTICE',
        fluencyPracticeScore: overallScore,
        turnCount,
        practiceFeedback,
        turns: turns.map(t => ({
          questionIndex: t.questionIndex,
          question: t.questionText,
          score: t.score,
          feedback: t.feedback
        }))
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
