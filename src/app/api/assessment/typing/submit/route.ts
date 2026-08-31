import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { z } from 'zod';
import crypto from 'crypto';

const typingSubmitSchema = z.object({
  promptId: z.string().uuid(),
  typedText: z.string().max(2_000),
  durationSeconds: z.number().min(1).max(600),
  keystrokeCount: z.number().int().min(0),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== 'CANDIDATE') {
      throw new ApiError('Unauthorized', 401);
    }

    await enforceRateLimit(request, 'assessment_typing_submit');

    const body = await readValidatedJson(request, typingSubmitSchema);
    const { promptId, typedText, durationSeconds, keystrokeCount } = body;

    const prompt = await prisma.typingPracticePrompt.findFirst({
      where: { id: promptId, isActive: true },
      select: { text: true },
    });
    if (!prompt) throw new ApiError('The selected typing prompt is no longer available.', 409);
    const promptText = prompt.text;

    // These are self-reported practice metrics. Browser keystroke counts cannot
    // prove identity or prevent paste, so they must never produce a credential.
    const wordsTyped = typedText.split(/\s+/).filter(w => w.length > 0).length;
    const wpm = Math.round(wordsTyped / (durationSeconds / 60));

    let matchingChars = 0;
    const minLen = Math.min(promptText.length, typedText.length);
    for (let i = 0; i < minLen; i++) {
      if (promptText[i] === typedText[i]) {
        matchingChars++;
      }
    }
    const accuracy = promptText.length > 0 ? (matchingChars / promptText.length) * 100 : 0;
    const errorCount = promptText.length - matchingChars + Math.max(0, typedText.length - promptText.length);

    const recordId = `PRACTICE-TYPE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id }
    });
    if (!candidateProfile) {
      throw new ApiError('Candidate profile not found. Please complete your profile first.', 404);
    }

    const assessment = await prisma.typingAssessment.create({
      data: {
        candidateProfileId: candidateProfile.id,
        wpm,
        accuracy,
        errorCount,
        durationSeconds,
        promptText,
        typedText,
        certificateId: recordId,
      },
    });

    await logAuditEvent({
      action: 'TYPING_ASSESSMENT_SUBMITTED',
      userId: session.id,
      resource: `typing_assessment_${assessment.id}`,
      details: `Unproctored typing practice recorded. WPM: ${wpm}, Accuracy: ${accuracy}%.`
    });

    return NextResponse.json({
      success: true,
      mode: 'SELF_REPORTED_PRACTICE',
      assessment: {
        id: assessment.id,
        wpm: assessment.wpm,
        accuracy: assessment.accuracy,
        errorCount: assessment.errorCount,
        durationSeconds: assessment.durationSeconds,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
