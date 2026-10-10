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

    let reply;
    try {
      reply = await executeCandidateJarvis({
        userId: session.id,
        message: payload.message,
      });
    } catch (cause) {
      // Keep provider diagnostics on the server; do not expose model names,
      // configuration, API credentials or raw errors in the candidate UI.
      const diagnostic = cause instanceof Error ? cause.message : "";
      if (
        diagnostic.includes("All configured AI endpoints failed") ||
        diagnostic.includes("No enabled, configured model") ||
        diagnostic.includes("No AI routing policy is configured")
      ) {
        console.warn("Candidate Jarvis AI routing is unavailable; provider details withheld.");
        throw new ApiError(
          "Jarvis couldn't connect to its AI service. Please try again shortly. You can still browse jobs and check applications.",
          503,
        );
      }
      throw cause;
    }

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
      // The candidate only needs the message, actions and optional playback receipt.
      // Never send internal model/provider/route telemetry to the browser.
      reply: { message: reply.message, actions: reply.actions, speechReceiptId },
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
