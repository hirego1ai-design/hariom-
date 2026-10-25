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

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().min(1).max(2000),
  voiceKey: z.string().optional(),
}).strict();

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
      `mock_interview_live_speech:${auth.id}`,
      90,
      60_000,
    );

    const body = await readValidatedJson(request, requestSchema, 8 * 1024);

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    const interviewSession = await prisma.mockInterviewSession.findUnique({
      where: { id: body.sessionId },
      include: { persona: true },
    });

    if (
      !candidateProfile ||
      !interviewSession ||
      interviewSession.candidateProfileId !== candidateProfile.id
    ) {
      throw new ApiError("Interview session not found.", 404);
    }

    const voiceKey = body.voiceKey?.trim() || interviewSession.persona?.voiceKey?.trim() || "sarah";

    const speech = await synthesizeMockInterviewSpeech({
      text: body.text.trim(),
      voiceKey,
      language: interviewSession.language || "en",
    });

    return new NextResponse(Buffer.from(speech.audio), {
      status: 200,
      headers: {
        "Content-Type": speech.contentType,
        "Content-Length": String(speech.audio.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
