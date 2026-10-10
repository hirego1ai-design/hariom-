import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getCandidateJarvisConfig } from "@/lib/jarvis/CandidateJarvisConfig";
import { prisma } from "@/lib/prisma";
import { transcribeHireGoVoice } from "@/lib/voice/HireGoVoiceEngine";

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
    if (!auth || auth.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    await enforceRateLimit(request, `candidate_jarvis_voice_stt:${auth.id}`, 20, 60_000);

    const config = await getCandidateJarvisConfig();
    if (!config.enabled || !config.voiceEnabled) {
      throw new ApiError("Candidate Jarvis voice is not enabled.", 503);
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > config.maxVoiceAudioBytes + 256 * 1024) {
      throw new ApiError("Voice recording exceeds the configured size limit.", 413);
    }

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) throw new ApiError("Voice recording is required.", 400);

    const mediaType = (audio.type || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mediaType)) throw new ApiError("Unsupported voice recording format.", 415);
    if (audio.size < 128 || audio.size > config.maxVoiceAudioBytes) {
      throw new ApiError("Voice recording size is outside the allowed range.", 413);
    }

    const preference = await prisma.userAiPreference.findUnique({
      where: { userId: auth.id },
      select: { preferredLanguage: true, autoDetectLanguage: true },
    });
    const expectedLanguage =
      preference?.autoDetectLanguage === false
        ? preference.preferredLanguage || config.defaultLanguage
        : preference?.preferredLanguage || null;

    let result;
    try {
      result = await transcribeHireGoVoice({ audio, expectedLanguage });
    } catch {
      throw new ApiError("HireGo voice transcription is temporarily unavailable. Please try again.", 503);
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
      requiresConfirmation: true,
      message: "Review the transcript, edit it if needed, then send it to Jarvis.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
