import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { executeCandidateJarvis } from "@/lib/jarvis/CandidateJarvisService";
import { getCandidateJarvisConfig, isCandidateJarvisVoiceRuntimeConfigured } from "@/lib/jarvis/CandidateJarvisConfig";
import { getHireGoVoiceCapabilities } from "@/lib/voice/HireGoVoiceEngine";
import { createCandidateJarvisSpeechReceipt } from "@/lib/jarvis/CandidateJarvisVoiceReceipt";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required.", 403);
    }
    await enforceRateLimit(request, "candidate_jarvis_readiness", 60, 60_000);
    const config = await getCandidateJarvisConfig();

    let voiceEnabled = false;
    if (config.voiceEnabled && isCandidateJarvisVoiceRuntimeConfigured()) {
      try {
        const capabilities = await getHireGoVoiceCapabilities(4_000);
        voiceEnabled = capabilities.stt.ready && capabilities.tts.ready;
      } catch {
        voiceEnabled = false;
      }
    }

    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      voiceEnabled,
      hybridRoutingEnabled: config.hybridRoutingEnabled,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required.", 403);
    }
    await enforceRateLimit(request, "candidate_jarvis_message", 30, 60_000);
    const payload = await readValidatedJson(request, requestSchema, 8 * 1024);

    const reply = await executeCandidateJarvis({
      userId: session.id,
      message: payload.message,
    });

    const config = await getCandidateJarvisConfig();
    let speechReceiptId: string | null = null;
    if (config.voiceEnabled && isCandidateJarvisVoiceRuntimeConfigured()) {
      try {
        const preference = await prisma.userAiPreference.findUnique({
          where: { userId: session.id },
          select: { preferredLanguage: true, preferredVoiceKey: true },
        });
        const receipt = await createCandidateJarvisSpeechReceipt({
          userId: session.id,
          text: reply.message,
          language: preference?.preferredLanguage || config.defaultLanguage,
          voiceKey: preference?.preferredVoiceKey || config.defaultVoiceKey,
        });
        speechReceiptId = receipt.receiptId;
      } catch {
        speechReceiptId = null;
      }
    }

    return NextResponse.json({
      success: true,
      reply: { ...reply, speechReceiptId },
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
