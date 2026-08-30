import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { handleApiError, readValidatedJson, ApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getFallbackQuestion } from '@/lib/assessment/interviewQuestionBank';
import { dispatchAiTask } from '@/utils/aiRouter';

const mockInterviewTurnSchema = z.object({
  sessionId: z.string().uuid(),
  answer: z.string().min(1).max(10_000),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
}).strict();

function calculateTurnMetrics(answer: string, durationMs?: number) {
  const words = answer.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
  let fillerCount = 0;
  
  const lowerAnswer = answer.toLowerCase();
  fillerWords.forEach(fw => {
    const regex = new RegExp(`\\b${fw}\\b`, 'g');
    const matches = lowerAnswer.match(regex);
    if (matches) fillerCount += matches.length;
  });

  const durationSeconds = durationMs ? durationMs / 1000 : wordCount * 0.5; // roughly 120wpm fallback
  const wpm = durationSeconds > 0 ? (wordCount / (durationSeconds / 60)) : 0;
  
  let clarityScore = 100 - (fillerCount * 5);
  if (wpm < 100) clarityScore -= 10;
  if (wpm > 200) clarityScore -= 10;
  clarityScore = Math.max(0, Math.min(100, clarityScore));

  const turnScore = Math.max(0, 100 - (fillerCount * 2)); // Simplified score

  return { turnScore, fillerCount, wpm, clarityScore, feedback: `Clarity: ${clarityScore}%, WPM: ${Math.round(wpm)}, Filler words used: ${fillerCount}` };
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== 'CANDIDATE') {
      throw new ApiError('Unauthorized', 401);
    }

    const body = await readValidatedJson(request, mockInterviewTurnSchema);
    const { sessionId, answer, durationMs } = body;

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

    if (interviewSession.status !== 'IN_PROGRESS') {
      throw new ApiError('Interview is not in progress', 400);
    }

    const currentTurn = interviewSession.turns.find(t => t.questionIndex === interviewSession.currentQuestionIndex);
    if (!currentTurn) {
      throw new ApiError('Turn not found', 500);
    }

    const { turnScore, feedback } = calculateTurnMetrics(answer, durationMs);

    const isComplete = interviewSession.currentQuestionIndex >= interviewSession.totalQuestions - 1;

    let nextQuestionData = undefined;

    if (!isComplete) {
      const nextIndex = interviewSession.currentQuestionIndex + 1;
      let nextQuestionText = '';

      const promptStr = `Generate a technical interview question for a ${interviewSession.roleTarget} candidate. Previous answer: "${answer}". Question ${nextIndex + 1} of ${interviewSession.totalQuestions}. Return JSON: {nextQuestion: string}`;

      try {
        const aiResponse = await dispatchAiTask({
          task: 'INTERVIEW_EVALUATION',
          prompt: promptStr,
        });
        const parsed = JSON.parse(aiResponse.resultText) as { nextQuestion?: unknown };
        if (typeof parsed.nextQuestion === 'string' && parsed.nextQuestion.trim()) {
          nextQuestionText = parsed.nextQuestion.trim();
        } else {
          throw new Error('Invalid AI format');
        }
      } catch (err) {
        nextQuestionText = getFallbackQuestion(interviewSession.roleTarget, nextIndex);
      }

      nextQuestionData = { text: nextQuestionText, questionIndex: nextIndex };
    }

    await prisma.$transaction(async (tx) => {
      const claimedTurn = await tx.mockInterviewTurn.updateMany({
        where: { id: currentTurn.id, candidateAnswerTranscript: null },
        data: {
          candidateAnswerTranscript: answer,
          turnLatencyMs: durationMs || 0,
          score: turnScore,
          feedback,
        },
      });
      if (claimedTurn.count !== 1) {
        throw new ApiError('This interview turn was already submitted.', 409);
      }

      if (!isComplete && nextQuestionData) {
        await tx.mockInterviewTurn.create({
          data: {
            sessionId: interviewSession.id,
            questionIndex: nextQuestionData.questionIndex,
            questionText: nextQuestionData.text,
          },
        });
        const advancedSession = await tx.mockInterviewSession.updateMany({
          where: { id: interviewSession.id, currentQuestionIndex: interviewSession.currentQuestionIndex },
          data: { currentQuestionIndex: nextQuestionData.questionIndex },
        });
        if (advancedSession.count !== 1) {
          throw new ApiError('The interview state changed. Please reload.', 409);
        }
      }
    });

    return NextResponse.json({
      success: true,
      turnScore,
      feedback,
      nextQuestion: nextQuestionData,
      isComplete
    });
  } catch (error) {
    return handleApiError(error);
  }
}
