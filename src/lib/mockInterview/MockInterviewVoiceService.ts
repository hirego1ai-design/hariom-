import { getMockInterviewVoiceConfig } from "@/lib/env";
import {
  assertSpeechToTextRouteConfigured,
} from "@/lib/mockInterview/SpeechToTextService";
import {
  assertTextToSpeechRouteConfigured,
} from "@/lib/mockInterview/TextToSpeechService";

export type MockVoiceReadiness = {
  ready: boolean;
  code:
    | "READY"
    | "DISABLED"
    | "PERSONA_VOICE_MISSING"
    | "TTS_NOT_CONFIGURED"
    | "STT_NOT_CONFIGURED";
  message: string;
};

export async function getMockVoiceReadiness(
  voiceKey?: string | null,
): Promise<MockVoiceReadiness> {
  let config: ReturnType<typeof getMockInterviewVoiceConfig>;
  try {
    config = getMockInterviewVoiceConfig();
  } catch {
    return {
      ready: false,
      code: "STT_NOT_CONFIGURED",
      message: "Voice practice is temporarily unavailable.",
    };
  }

  if (!config.enabled) {
    return {
      ready: false,
      code: "DISABLED",
      message: "Voice practice is not available right now.",
    };
  }

  if (!voiceKey?.trim()) {
    return {
      ready: false,
      code: "PERSONA_VOICE_MISSING",
      message:
        "Voice practice is not available for this interviewer right now.",
    };
  }

  try {
    await assertTextToSpeechRouteConfigured();
  } catch {
    return {
      ready: false,
      code: "TTS_NOT_CONFIGURED",
      message:
        "Voice practice is temporarily unavailable.",
    };
  }

  try {
    await assertSpeechToTextRouteConfigured();
  } catch {
    return {
      ready: false,
      code: "STT_NOT_CONFIGURED",
      message:
        "Voice practice is temporarily unavailable.",
    };
  }

  return {
    ready: true,
    code: "READY",
    message: "Voice practice is ready.",
  };
}

export async function assertMockVoiceReady(
  voiceKey?: string | null,
): Promise<void> {
  const readiness = await getMockVoiceReadiness(voiceKey);
  if (!readiness.ready) {
    const error = new Error(readiness.message);
    error.name = "MockVoiceUnavailableError";
    throw error;
  }
}
