import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { takeVoiceTranscriptDraft } from "@/lib/mockInterview/VoiceTranscriptConfirmation";
import { createVoiceTranscriptReceipt } from "@/lib/mockInterview/VoiceTranscriptReceipt";
import { LearningEventStore } from "@/lib/intelligence/LearningEventStore";

const confirmSchema = z
  .object({
    sessionId: z.string().uuid(),
    questionIndex: z.number().int().min(0).max(50),
    draftId: z.string().uuid(),
    transcript: z.string().trim().min(1).max(10_000),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    await enforceRateLimit(
      request,
      `mock_interview_voice_confirm:${auth.id}`,
      30,
      60_000,
    );

    const body = await readValidatedJson(
      request,
      confirmSchema,
      16 * 1024,
    );

    const [candidateProfile, interviewSession] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { userId: auth.id },
        select: { id: true },
      }),
      prisma.mockInterviewSession.findUnique({
        where: { id: body.sessionId },
        include: {
          turns: {
            where: { questionIndex: body.questionIndex },
            take: 1,
          },
        },
      }),
    ]);

    if (
      !candidateProfile ||
      !interviewSession ||
      interviewSession.candidateProfileId !== candidateProfile.id
    ) {
      throw new ApiError("Voice interview session not found.", 404);
    }
    if (
      interviewSession.mode !== "VOICE" ||
      interviewSession.status !== "IN_PROGRESS"
    ) {
      throw new ApiError(
        "This voice interview is not accepting answers.",
        409,
      );
    }
    if (interviewSession.currentQuestionIndex !== body.questionIndex) {
      throw new ApiError(
        "The interview state changed. Please reload.",
        409,
      );
    }

    const turn = interviewSession.turns[0];
    if (!turn || turn.candidateAnswerTranscript !== null) {
      throw new ApiError(
        "This voice turn is no longer accepting a response.",
        409,
      );
    }

    const draft = await takeVoiceTranscriptDraft({
      draftId: body.draftId,
      userId: auth.id,
      candidateProfileId: candidateProfile.id,
      sessionId: interviewSession.id,
      questionIndex: body.questionIndex,
    });

    if (!draft) {
      throw new ApiError(
        "Transcript confirmation expired, was already used, or does not match this turn. Please record again.",
        409,
      );
    }

    const confirmedTranscript = body.transcript.trim();
    const receipt = await createVoiceTranscriptReceipt({
      userId: auth.id,
      candidateProfileId: candidateProfile.id,
      sessionId: interviewSession.id,
      questionIndex: body.questionIndex,
      transcript: confirmedTranscript,
      detectedLanguage: draft.detectedLanguage,
      confidence: null,
      durationSeconds: draft.durationSeconds,
      provider: draft.provider,
      model: draft.model,
      versionLabel: draft.versionLabel,
      workerVersion: null,
      confirmedByCandidate: true,
      transcriptSource: "CANDIDATE_CONFIRMED",
    });

    void LearningEventStore.record({
      idempotencyKey: `mock-interview-transcript-confirm:${receipt.receiptId}`,
      correlationId: interviewSession.id,
      actorUserId: auth.id,
      actorRole: Role.CANDIDATE,
      channel: "WEB_VOICE",
      feature: "MOCK_INTERVIEW",
      task: "TRANSCRIPT_CONFIRMED",
      evidenceRefs: {
        sessionId: interviewSession.id,
        questionIndex: body.questionIndex,
        provider: draft.provider,
        model: draft.model,
        detectedLanguage: draft.detectedLanguage,
      },
      correction:
        confirmedTranscript === draft.transcript
          ? null
          : {
              originalTranscript: draft.transcript,
              confirmedTranscript,
            },
      acceptedResult: {
        confirmedTranscript,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      receiptId: receipt.receiptId,
      transcript: receipt.transcript,
      confidence: receipt.confidence,
      detectedLanguage: receipt.detectedLanguage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
