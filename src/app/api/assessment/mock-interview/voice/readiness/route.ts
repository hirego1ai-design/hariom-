import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
} from "@/lib/apiSecurity";
import { resolveMockInterviewPersona } from "@/lib/mockInterview/MockInterviewEngineV2";
import { getMockVoiceReadiness } from "@/lib/mockInterview/MockInterviewVoiceService";

const querySchema = z.object({
  role: z.string().trim().min(1).max(120),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }
    await enforceRateLimit(
      request,
      `mock_interview_voice_readiness:${auth.id}`,
      30,
      60_000,
    );

    const parsed = querySchema.safeParse({
      role: request.nextUrl.searchParams.get("role") || "",
    });
    if (!parsed.success) {
      throw new ApiError("A valid target role is required.", 400);
    }

    let personaName: string | null = null;
    let voiceKey: string | null = null;
    try {
      const resolved = await resolveMockInterviewPersona(parsed.data.role);
      personaName = resolved.persona.displayName;
      voiceKey = resolved.persona.voiceKey;
    } catch {
      return NextResponse.json({
        success: true,
        ready: false,
        code: "PERSONA_NOT_CONFIGURED",
        message: "Voice practice is not available for this role right now.",
        personaName: null,
      });
    }

    const readiness = await getMockVoiceReadiness(voiceKey);
    return NextResponse.json({
      success: true,
      ...readiness,
      personaName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
