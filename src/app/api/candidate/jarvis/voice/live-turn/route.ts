import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getCandidateJarvisConfig, isCandidateJarvisVoiceRuntimeConfigured } from "@/lib/jarvis/CandidateJarvisConfig";
import { prisma } from "@/lib/prisma";
import { transcribeHireGoVoice, synthesizeHireGoVoice } from "@/lib/voice/HireGoVoiceEngine";
import { executeCandidateJarvis } from "@/lib/jarvis/CandidateJarvisService";
import { pickSafeVoiceNavigation } from "@/lib/jarvis/JarvisVoiceNavigation";

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
      throw new ApiError("Candidate access required.", 403);
    }
    await enforceRateLimit(request, `candidate_jarvis_live_stream:${auth.id}`, 30, 60_000);

    const config = await getCandidateJarvisConfig();
    if (!config.enabled || !config.voiceEnabled) {
      throw new ApiError("Candidate Jarvis voice is not enabled.", 503);
    }

    // 1. Instant User Preferences Lookup
    const preference = await prisma.userAiPreference.findUnique({
      where: { userId: auth.id },
      select: { preferredLanguage: true, preferredVoiceKey: true, autoDetectLanguage: true },
    });
    const expectedLanguage =
      preference?.autoDetectLanguage === false
        ? preference.preferredLanguage || config.defaultLanguage
        : preference?.preferredLanguage || null;

    const form = await request.formData();
    const rawTranscript = form.get("transcript");
    let utterance = typeof rawTranscript === "string" ? rawTranscript.trim() : "";

    if (!utterance) {
      const audio = form.get("audio");
      if (!(audio instanceof File)) {
        throw new ApiError("Voice audio stream chunk or transcript is required.", 400);
      }

      const mediaType = (audio.type || "").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_AUDIO_TYPES.has(mediaType)) {
        throw new ApiError("Unsupported voice recording format.", 415);
      }
      if (audio.size < 128 || audio.size > config.maxVoiceAudioBytes) {
        throw new ApiError("Voice recording size is outside the allowed range.", 413);
      }

      // 2. Transcribe with Self-Hosted Engine or Cloud Whisper fallback
      try {
        const sttResult = await transcribeHireGoVoice({
          audio,
          expectedLanguage,
          timeoutMs: 12_000,
        });
        utterance = sttResult.transcript.trim();
      } catch (err) {
        throw new ApiError(
          err instanceof Error ? err.message : "I couldn't hear that clearly. Please try speaking again.",
          422,
        );
      }
    }

    if (!utterance) {
      throw new ApiError("No audible speech detected. Please speak again.", 422);
    }

    // 3. AI Reply Generation (Protected against unconfigured routing/keys)
    let reply;
    try {
      reply = await executeCandidateJarvis({
        userId: auth.id,
        message: utterance,
      });
    } catch (cause) {
      const diagnostic = cause instanceof Error ? cause.message : "";
      if (
        diagnostic.includes("All configured AI endpoints failed") ||
        diagnostic.includes("No enabled, configured model") ||
        diagnostic.includes("No AI routing policy is configured")
      ) {
        throw new ApiError(
          "Jarvis couldn't connect to its AI service. Please verify your configured LLM API keys in Admin or try again shortly.",
          503,
        );
      }
      throw cause;
    }

    const navigation = pickSafeVoiceNavigation(utterance, reply.actions || []);

    // 4. Synthesize Speech Audio (MP3 via Local Engine)
    let audioBase64: string | null = null;
    let audioContentType = "audio/mpeg";

    if (isCandidateJarvisVoiceRuntimeConfigured() && reply.message) {
      try {
        const speech = await synthesizeHireGoVoice({
          text: reply.message,
          voiceKey: preference?.preferredVoiceKey || config.defaultVoiceKey,
          language: preference?.preferredLanguage || config.defaultLanguage,
          timeoutMs: 10_000,
        });
        audioBase64 = Buffer.from(speech.audio).toString("base64");
        audioContentType = speech.contentType;
      } catch (err) {
        console.warn("TTS synthesis skipped on live turn:", err instanceof Error ? err.message : err);
      }
    }

    // Single Atomic Response to eliminate the 3-step HTTP waterfall
    return NextResponse.json(
      {
        success: true,
        heard: utterance,
        reply: {
          message: reply.message,
          actions: reply.actions,
          navigation: navigation || null,
        },
        audio: audioBase64 ? `data:${audioContentType};base64,${audioBase64}` : null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-HireGo-Live-Turn": "pipeline-v2",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
