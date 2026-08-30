import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { handleApiError, readValidatedJson, ApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getFallbackQuestion } from '@/lib/assessment/interviewQuestionBank';
import { dispatchAiTask } from '@/utils/aiRouter';

const mockInterviewStartSchema = z.object({
  roleTarget: z.string().min(1).max(120),
  totalQuestions: z.number().min(1).max(10).optional().default(5),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== 'CANDIDATE') {
      throw new ApiError('Unauthorized', 401);
    }

    const body = await readValidatedJson(request, mockInterviewStartSchema);
    const { roleTarget, totalQuestions } = body;

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id }
    });

    if (!candidateProfile) {
      throw new ApiError('Candidate profile not found. Please complete your profile first.', 404);
    }

    const skills = candidateProfile.skills?.join(', ') || 'general programming';

    const promptStr = `Generate a technical interview question for a ${roleTarget} candidate with skills: [${skills}]. Question 1 of ${totalQuestions}. Return JSON: {nextQuestion: string}`;

    let questionText = '';
    
    try {
      const aiResponse = await dispatchAiTask({
        task: 'INTERVIEW_EVALUATION',
        prompt: promptStr,
      });
      const parsed = JSON.parse(aiResponse.resultText) as { nextQuestion?: unknown };
      if (typeof parsed.nextQuestion === 'string' && parsed.nextQuestion.trim()) {
        questionText = parsed.nextQuestion.trim();
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err) {
      questionText = getFallbackQuestion(roleTarget, 0);
    }

    const interviewSession = await prisma.mockInterviewSession.create({
      data: {
        candidateProfileId: candidateProfile.id,
        roleTarget,
        totalQuestions,
        currentQuestionIndex: 0,
        status: 'IN_PROGRESS',
        turns: {
          create: {
            questionIndex: 0,
            questionText,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      session: {
        id: interviewSession.id,
        roleTarget: interviewSession.roleTarget,
        totalQuestions: interviewSession.totalQuestions,
        currentQuestionIndex: interviewSession.currentQuestionIndex,
      },
      question: {
        text: questionText,
        questionIndex: 0
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
