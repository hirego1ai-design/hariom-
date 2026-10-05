import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { synthesizeMockInterviewSpeech } from "@/lib/mockInterview/TextToSpeechService";

const requestSchema = z.discriminatedUnion("kind", [
  z.object({
    sessionId: z.string().uuid(),
    kind: z.literal("OPENING"),
  }).strict(),
  z.object({
    sessionId: z.string().uuid(),
    kind: z.literal("QUESTION"),
    questionIndex: z.number().int().min(0).max(50),
  }).strict(),
  z.object({
    sessionId: z.string().uuid(),
    kind: z.literal("FINAL_SUMMARY"),
  }).strict(),
]);

function finalSummaryText(value: unknown, fallback: string | null) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "summary" in value &&
    typeof (value as { summary?: unknown }).summary === "string"
  ) {
    return (value as { summary: string }).summary.trim();
  }
  return fallback?.trim() || "";
}

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
      `mock_interview_voice_speech:${auth.id}`,
      30,
      60_000,
    );

    const body = await readValidatedJson(request, requestSchema, 8 * 1024);

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    const interviewSession = await prisma.mockInterviewSession.findUnique({
      where: { id: body.sessionId },
      include: {
        persona: true,
        turns:
          body.kind === "QUESTION"
            ? {
                where: { questionIndex: body.questionIndex },
                take: 1,
              }
            : false,
      },
    });

    if (
      !candidateProfile ||
      !interviewSession ||
      interviewSession.candidateProfileId !== candidateProfile.id
    ) {
      throw new ApiError("Voice interview session not found.", 404);
    }

    if (interviewSession.mode !== "VOICE") {
      throw new ApiError("This session is not in Voice Mode.", 409);
    }

    if (!interviewSession.persona?.voiceKey?.trim()) {
      throw new ApiError(
        "This interviewer does not have an approved voice configured.",
        503,
      );
    }

    let text = "";
    if (body.kind === "OPENING") {
      text = interviewSession.openingMessage?.trim() || "";
    } else if (body.kind === "QUESTION") {
      if (interviewSession.status !== "IN_PROGRESS") {
        throw new ApiError("Interview is not in progress.", 409);
      }
      if (body.questionIndex !== interviewSession.currentQuestionIndex) {
        throw new ApiError(
          "Only the current interview question can be spoken.",
          409,
        );
      }
      text = interviewSession.turns[0]?.questionText?.trim() || "";
    } else {
      if (interviewSession.status !== "COMPLETED") {
        throw new ApiError(
          "Final spoken feedback is available only after completion.",
          409,
        );
      }
      text = finalSummaryText(
        interviewSession.finalReport,
        interviewSession.aiFeedback,
      );
    }

    if (!text) {
      throw new ApiError("There is no approved text to synthesize.", 404);
    }

    let speech;
    try {
      speech = await synthesizeMockInterviewSpeech({
        text,
        voiceKey: interviewSession.persona.voiceKey,
        language: interviewSession.language || "en",
      });
    } catch (error) {
      throw new ApiError(
        error instanceof Error
          ? error.message
          : "Voice output is temporarily unavailable.",
        503,
      );
    }

    return new NextResponse(Buffer.from(speech.audio), {
      status: 200,
      headers: {
        "Content-Type": speech.contentType,
        "Content-Length": String(speech.audio.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-HireGo-TTS-Provider": speech.provider,
        "X-HireGo-TTS-Model": speech.model,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
