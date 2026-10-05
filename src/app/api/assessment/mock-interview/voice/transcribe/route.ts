import crypto from "node:crypto";
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
import {
  assertSafeOutboundNetworkTarget,
  parseAllowedHosts,
} from "@/lib/security/outboundUrl";
import { createVoiceTranscriptReceipt } from "@/lib/mockInterview/VoiceTranscriptReceipt";

const metadataSchema = z.object({
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0).max(50),
}).strict();

const workerResultSchema = z.object({
  transcript: z.string().trim().min(1).max(10_000),
  detectedLanguage: z.string().trim().min(1).max(32),
  confidence: z.number().finite().min(0).max(1),
  lowConfidence: z.boolean(),
  durationSeconds: z.number().finite().min(0).max(300),
  provider: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160),
  version: z.string().trim().min(1).max(160),
  workerVersion: z.string().trim().min(1).max(160),
}).strict();

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
  const started = Date.now();
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

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (
      Number.isFinite(contentLength) &&
      contentLength > config.maxAudioBytes + 256 * 1024
    ) {
      throw new ApiError("Voice recording exceeds the configured size limit.", 413);
    }

    const form = await request.formData();
    const audio = form.get("audio");
    const sessionId = String(form.get("sessionId") || "");
    const questionIndexRaw = String(form.get("questionIndex") || "");
    const metadata = metadataSchema.safeParse({
      sessionId,
      questionIndex: Number(questionIndexRaw),
    });
    if (!metadata.success) {
      throw new ApiError("Invalid voice turn metadata.", 400);
    }
    if (!(audio instanceof File)) {
      throw new ApiError("Voice recording is required.", 400);
    }

    const mediaType = (audio.type || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mediaType)) {
      throw new ApiError("Unsupported voice recording format.", 415);
    }
    if (audio.size < 128 || audio.size > config.maxAudioBytes) {
      throw new ApiError("Voice recording size is outside the allowed range.", 413);
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
            where: { questionIndex: metadata.data.questionIndex },
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
      throw new ApiError("This interview session is not in Voice Mode.", 409);
    }
    if (interviewSession.status !== "IN_PROGRESS") {
      throw new ApiError("Interview is not in progress.", 409);
    }
    if (interviewSession.currentQuestionIndex !== metadata.data.questionIndex) {
      throw new ApiError("The interview state changed. Please reload.", 409);
    }

    const turn = interviewSession.turns[0];
    if (!turn || turn.candidateAnswerTranscript !== null) {
      throw new ApiError("This voice turn is no longer accepting a response.", 409);
    }

    const workerUrl = `${config.workerUrl}/transcribe-turn`;
    if (process.env.NODE_ENV === "production") {
      await assertSafeOutboundNetworkTarget(workerUrl, {
        label: "Voice transcription worker",
        requireHttps: true,
        allowedHosts: parseAllowedHosts(
          process.env.VIDEO_ANALYSIS_ALLOWED_HOSTS,
        ),
      });
    }

    const workerForm = new FormData();
    workerForm.append(
      "audio",
      audio,
      audio.name?.slice(0, 120) || "mock-interview-voice.webm",
    );

    const workerResponse = await fetch(workerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.internalToken}`,
      },
      body: workerForm,
      signal: AbortSignal.timeout(
        Math.min(120_000, Math.max(30_000, config.maxSeconds * 1_000)),
      ),
      redirect: "error",
      cache: "no-store",
    });

    if (!workerResponse.ok) {
      const safeMessage =
        workerResponse.status === 413
          ? "Voice answer is too long."
          : workerResponse.status === 422
            ? "No clear speech was detected."
            : workerResponse.status === 503
              ? "Voice transcription is temporarily busy."
              : "Voice transcription failed.";
      throw new ApiError(safeMessage, workerResponse.status >= 500 ? 503 : 400);
    }

    const workerJson: unknown = await workerResponse.json();
    const parsedWorker = workerResultSchema.safeParse(workerJson);
    if (!parsedWorker.success) {
      throw new ApiError("Voice transcription returned an invalid result.", 503);
    }

    const result = parsedWorker.data;
    await prisma.aiExecutionLog
      .create({
        data: {
          id: crypto.randomUUID(),
          task: "mock-interview-stt",
          provider: result.provider,
          model: result.model,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          latencyMs: Date.now() - started,
          costEstUsd: null,
          status: "SUCCESS",
          timestamp: new Date(),
        },
      })
      .catch(() => null);

    const requiresRepeat =
      result.lowConfidence ||
      result.confidence < config.minTranscriptConfidence;

    if (requiresRepeat) {
      return NextResponse.json({
        success: true,
        requiresRepeat: true,
        confidence: result.confidence,
        detectedLanguage: result.detectedLanguage,
        heardText: result.transcript.slice(0, 2_000),
        message:
          "I could not transcribe that answer confidently enough to score it. Please answer again.",
      });
    }

    const receipt = await createVoiceTranscriptReceipt({
      userId: auth.id,
      candidateProfileId: candidateProfile.id,
      sessionId: interviewSession.id,
      questionIndex: metadata.data.questionIndex,
      transcript: result.transcript,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
      durationSeconds: result.durationSeconds,
      provider: result.provider,
      model: result.model,
      versionLabel: result.version,
      workerVersion: result.workerVersion,
    });

    return NextResponse.json({
      success: true,
      requiresRepeat: false,
      receiptId: receipt.receiptId,
      transcript: receipt.transcript,
      confidence: receipt.confidence,
      detectedLanguage: receipt.detectedLanguage,
      durationSeconds: receipt.durationSeconds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
