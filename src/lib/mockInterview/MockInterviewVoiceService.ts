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
      message: "Voice runtime configuration is invalid.",
    };
  }

  if (!config.enabled) {
    return {
      ready: false,
      code: "DISABLED",
      message: "Voice Mock Interview is not enabled yet.",
    };
  }

  if (!voiceKey?.trim()) {
    return {
      ready: false,
      code: "PERSONA_VOICE_MISSING",
      message:
        "This interviewer does not have an approved AI voice configured.",
    };
  }

  try {
    await assertTextToSpeechRouteConfigured();
  } catch {
    return {
      ready: false,
      code: "TTS_NOT_CONFIGURED",
      message:
        "Voice output is not configured in the AI Control Centre for mock-interview-tts.",
    };
  }

  try {
    await assertSpeechToTextRouteConfigured();
  } catch {
    return {
      ready: false,
      code: "STT_NOT_CONFIGURED",
      message:
        "Speech transcription is not configured in the AI Control Centre for mock-interview-stt.",
    };
  }

  return {
    ready: true,
    code: "READY",
    message: "Voice Mock Interview is available.",
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
