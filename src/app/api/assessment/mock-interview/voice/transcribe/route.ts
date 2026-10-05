import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
} from "@/lib/apiSecurity";
import { getMockInterviewVoiceConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { transcribeMockInterviewAudio } from "@/lib/mockInterview/SpeechToTextService";
import { createVoiceTranscriptDraft } from "@/lib/mockInterview/VoiceTranscriptConfirmation";

const metadataSchema = z
  .object({
    sessionId: z.string().uuid(),
    questionIndex: z.number().int().min(0).max(50),
  })
  .strict();

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "video/webm",
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    await enforceRateLimit(
      request,
      `mock_interview_voice_transcribe:${auth.id}`,
      20,
      60_000,
    );

    const config = getMockInterviewVoiceConfig();
    if (!config.enabled) {
      throw new ApiError("Voice Mock Interview is not enabled.", 503);
    }

    const contentLength = Number(
      request.headers.get("content-length") || "0",
    );
    if (
      Number.isFinite(contentLength) &&
      contentLength > config.maxAudioBytes + 256 * 1024
    ) {
      throw new ApiError(
        "Voice recording exceeds the configured size limit.",
        413,
      );
    }

    const form = await request.formData();
    const audio = form.get("audio");
    const metadata = metadataSchema.safeParse({
      sessionId: String(form.get("sessionId") || ""),
      questionIndex: Number(String(form.get("questionIndex") || "")),
    });

    if (!metadata.success) {
      throw new ApiError("Invalid voice turn metadata.", 400);
    }
    if (!(audio instanceof File)) {
      throw new ApiError("Voice recording is required.", 400);
    }

    const mediaType = (audio.type || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mediaType)) {
      throw new ApiError("Unsupported voice recording format.", 415);
    }
    if (audio.size < 128 || audio.size > config.maxAudioBytes) {
      throw new ApiError(
        "Voice recording size is outside the allowed range.",
        413,
      );
    }

    const [candidateProfile, interviewSession] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { userId: auth.id },
        select: { id: true },
      }),
      prisma.mockInterviewSession.findUnique({
        where: { id: metadata.data.sessionId },
        include: {
          turns: {
            where: {
              questionIndex: metadata.data.questionIndex,
            },
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
    if (interviewSession.mode !== "VOICE") {
      throw new ApiError(
        "This interview session is not in Voice Mode.",
        409,
      );
    }
    if (interviewSession.status !== "IN_PROGRESS") {
      throw new ApiError("Interview is not in progress.", 409);
    }
    if (
      interviewSession.currentQuestionIndex !==
      metadata.data.questionIndex
    ) {
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

    let result;
    try {
      result = await transcribeMockInterviewAudio({
        audio,
        expectedLanguage: interviewSession.language,
        roleTarget: interviewSession.roleTarget,
        skillTags: turn.skillTags,
      });
    } catch {
      throw new ApiError(
        "Voice transcription is temporarily unavailable. Please try again.",
        503,
      );
    }

    const draft = await createVoiceTranscriptDraft({
      userId: auth.id,
      candidateProfileId: candidateProfile.id,
      sessionId: interviewSession.id,
      questionIndex: metadata.data.questionIndex,
      transcript: result.transcript,
      detectedLanguage: result.detectedLanguage,
      durationSeconds: null,
      provider: result.provider,
      model: result.model,
      versionLabel: result.version,
    });

    return NextResponse.json({
      success: true,
      requiresConfirmation: true,
      requiresRepeat: false,
      draftId: draft.draftId,
      transcript: draft.transcript,
      confidence: null,
      detectedLanguage: draft.detectedLanguage,
      message:
        "Please confirm the transcript before HireGo evaluates this answer.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
