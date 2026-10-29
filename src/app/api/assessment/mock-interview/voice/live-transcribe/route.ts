import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getMockInterviewVoiceConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { transcribeMockInterviewAudio } from "@/lib/mockInterview/SpeechToTextService";

const metadataSchema = z.object({
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0).max(50),
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

// Live conversational transcription is not a scoring endpoint. It returns only a transcript;
// scored Voice Mode turns continue to use the candidate-confirmed receipt workflow.
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") throw new ApiError("Unauthorized", 401);

    await enforceRateLimit(request, `mock_interview_live_transcribe:${auth.id}`, 20, 60_000);
    const config = getMockInterviewVoiceConfig();
    if (!config.enabled) throw new ApiError("Voice Mock Interview is not enabled.", 503);

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > config.maxAudioBytes + 256 * 1024) {
      throw new ApiError("Voice recording exceeds the configured size limit.", 413);
    }

    const form = await request.formData();
    const audio = form.get("audio");
    const metadata = metadataSchema.safeParse({
      sessionId: String(form.get("sessionId") || ""),
      questionIndex: Number(String(form.get("questionIndex") || "")),
    });
    if (!metadata.success) throw new ApiError("Invalid voice turn metadata.", 400);
    if (!(audio instanceof File)) throw new ApiError("Voice recording is required.", 400);

    const mediaType = (audio.type || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mediaType)) throw new ApiError("Unsupported voice recording format.", 415);
    if (audio.size < 128 || audio.size > config.maxAudioBytes) {
      throw new ApiError("Voice recording size is outside the allowed range.", 413);
    }

    const [candidateProfile, interviewSession] = await Promise.all([
      prisma.candidateProfile.findUnique({ where: { userId: auth.id }, select: { id: true } }),
      prisma.mockInterviewSession.findUnique({
        where: { id: metadata.data.sessionId },
        include: { turns: { where: { questionIndex: metadata.data.questionIndex }, take: 1 } },
      }),
    ]);

    if (!candidateProfile || !interviewSession || interviewSession.candidateProfileId !== candidateProfile.id) {
      throw new ApiError("Voice interview session not found.", 404);
    }
    if (interviewSession.mode !== "VOICE" || interviewSession.status !== "IN_PROGRESS") {
      throw new ApiError("This voice interview is not accepting audio.", 409);
    }
    const turn =
      interviewSession.turns[0] ||
      (await prisma.mockInterviewTurn.findFirst({
        where: { sessionId: interviewSession.id },
        orderBy: { questionIndex: "desc" },
      }));

    let result;
    try {
      result = await transcribeMockInterviewAudio({
        audio,
        expectedLanguage: interviewSession.language,
        roleTarget: interviewSession.roleTarget,
        skillTags: turn.skillTags,
      });
    } catch {
      throw new ApiError("Voice transcription is temporarily unavailable. Please try again.", 503);
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      detectedLanguage: result.detectedLanguage,
      provider: result.provider,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
