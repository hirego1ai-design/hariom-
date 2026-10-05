import { getMockInterviewVoiceConfig } from "@/lib/env";
import {
  assertTextToSpeechRouteConfigured,
} from "@/lib/mockInterview/TextToSpeechService";
import {
  assertSafeOutboundNetworkTarget,
  parseAllowedHosts,
} from "@/lib/security/outboundUrl";

export type MockVoiceReadiness = {
  ready: boolean;
  code:
    | "READY"
    | "DISABLED"
    | "PERSONA_VOICE_MISSING"
    | "TTS_NOT_CONFIGURED"
    | "WORKER_NOT_CONFIGURED"
    | "WORKER_UNAVAILABLE";
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
      code: "WORKER_NOT_CONFIGURED",
      message: "Voice transcription infrastructure is not configured.",
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
      message: "This interviewer does not have an approved voice configured.",
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
    const healthUrl = `${config.workerUrl}/health`;
    if (process.env.NODE_ENV === "production") {
      await assertSafeOutboundNetworkTarget(healthUrl, {
        label: "Voice transcription worker",
        requireHttps: true,
        allowedHosts: parseAllowedHosts(
          process.env.VIDEO_ANALYSIS_ALLOWED_HOSTS,
        ),
      });
    }
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5_000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        ready: false,
        code: "WORKER_UNAVAILABLE",
        message: "Voice transcription worker is not healthy.",
      };
    }
    const health = (await response.json().catch(() => null)) as
      | { voiceTurnSupported?: boolean }
      | null;
    if (health?.voiceTurnSupported !== true) {
      return {
        ready: false,
        code: "WORKER_UNAVAILABLE",
        message:
          "The transcription worker has not been upgraded for Voice Mock Interview yet.",
      };
    }
  } catch {
    return {
      ready: false,
      code: "WORKER_UNAVAILABLE",
      message: "Voice transcription worker is unreachable.",
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
