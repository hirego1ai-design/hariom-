import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getCandidateJarvisConfig } from "@/lib/jarvis/CandidateJarvisConfig";
import { takeCandidateJarvisSpeechReceipt } from "@/lib/jarvis/CandidateJarvisVoiceReceipt";
import { synthesizeHireGoVoice } from "@/lib/voice/HireGoVoiceEngine";

const bodySchema = z.object({ receiptId: z.string().uuid() }).strict();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    await enforceRateLimit(request, `candidate_jarvis_voice_tts:${auth.id}`, 30, 60_000);

    const config = await getCandidateJarvisConfig();
    if (!config.enabled || !config.voiceEnabled) {
      throw new ApiError("Candidate Jarvis voice is not enabled.", 503);
    }

    const body = await readValidatedJson(request, bodySchema, 4 * 1024);
    const receipt = await takeCandidateJarvisSpeechReceipt({
      receiptId: body.receiptId,
      userId: auth.id,
    });
    if (!receipt) throw new ApiError("This Jarvis speech response is invalid or expired.", 409);

    let speech;
    try {
      speech = await synthesizeHireGoVoice({
        text: receipt.text,
        voiceKey: receipt.voiceKey,
        language: receipt.language,
      });
    } catch {
      throw new ApiError("HireGo speech output is temporarily unavailable.", 503);
    }

    return new Response(Buffer.from(speech.audio), {
      status: 200,
      headers: {
        "Content-Type": speech.contentType,
        "Cache-Control": "private, no-store",
        "Content-Length": String(speech.audio.byteLength),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
