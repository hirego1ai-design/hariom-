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

    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      voiceEnabled: config.voiceEnabled && isCandidateJarvisVoiceRuntimeConfigured(),
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

    return NextResponse.json({
      success: true,
      reply,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
