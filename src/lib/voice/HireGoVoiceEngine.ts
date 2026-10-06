import { z } from "zod";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";

const readinessSchema = z.object({
  status: z.literal("ready"),
  e2e: z.literal(true),
  stt: z.literal(true),
  tts: z.literal(true),
  checkedAt: z.string().nullable(),
  error: z.null(),
  sttModel: z.string().trim().min(1).max(200),
  ttsModel: z.string().trim().min(1).max(200),
  voice: z.string().trim().min(1).max(80),
}).strict();

const transcriptionSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  language: z.string().trim().min(1).max(32).optional(),
  duration: z.number().finite().min(0).max(300).optional(),
}).passthrough();

export type HireGoVoiceCapabilities = {
  status: "ready";
  workerVersion: "speaches";
  e2eVerified: true;
  stt: { ready: true; provider: "hirego-self-hosted"; model: string };
  tts: { ready: true; provider: "hirego-self-hosted"; model: string };
  languages: string[];
  voices: string[];
};

function runtime() {
  const baseUrl = process.env.HIREGO_VOICE_ENGINE_URL?.trim();
  const token = process.env.HIREGO_VOICE_ENGINE_TOKEN?.trim();
  const sttModel =
    process.env.HIREGO_VOICE_STT_MODEL?.trim() ||
    "Systran/faster-whisper-small";
  const ttsModel =
    process.env.HIREGO_VOICE_TTS_MODEL?.trim() ||
    "speaches-ai/Kokoro-82M-v1.0-ONNX";

  if (!baseUrl || !token) {
    throw new Error("HireGo Voice Engine runtime is not configured.");
  }
  if (process.env.NODE_ENV === "production" && token.length < 32) {
    throw new Error("HireGo Voice Engine token is not production eligible.");
  }
  return { baseUrl, token, sttModel, ttsModel };
}

async function safeEndpoint(
  pathname: string,
): Promise<ReturnType<typeof runtime> & { url: string }> {
  const config = runtime();
  const url = new URL(
    pathname,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  ).toString();

  if (process.env.NODE_ENV === "production") {
    await assertSafeOutboundNetworkTarget(url, {
      label: "HireGo Voice Engine URL",
      requireHttps: true,
    });
  }
  return { ...config, url };
}

export async function getHireGoVoiceCapabilities(
  timeoutMs = 8_000,
): Promise<HireGoVoiceCapabilities> {
  const health = await safeEndpoint("health");
  const healthResponse = await fetch(health.url, {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!healthResponse.ok) {
    throw new Error(
      `HireGo Voice Engine health returned HTTP ${healthResponse.status}`,
    );
  }

  const readiness = await safeEndpoint("hirego/readiness");
  const readinessResponse = await fetch(readiness.url, {
    method: "GET",
    headers: { Authorization: `Bearer ${readiness.token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!readinessResponse.ok) {
    throw new Error(
      `HireGo Voice Engine E2E readiness returned HTTP ${readinessResponse.status}`,
    );
  }
  const verified = readinessSchema.parse(await readinessResponse.json());

  return {
    status: "ready",
    workerVersion: "speaches",
    e2eVerified: true,
    stt: {
      ready: true,
      provider: "hirego-self-hosted",
      model: verified.sttModel,
    },
    tts: {
      ready: true,
      provider: "hirego-self-hosted",
      model: verified.ttsModel,
    },
    // Full voice output is English-only until a Hindi TTS model passes the
    // same worker self-test. Whisper STT itself remains multilingual.
    languages: ["en"],
    voices: [verified.voice],
  };
}

export async function transcribeHireGoVoice(params: {
  audio: File;
  expectedLanguage?: string | null;
  timeoutMs?: number;
}) {
  const endpoint = await safeEndpoint("v1/audio/transcriptions");
  const form = new FormData();
  form.append("file", params.audio, params.audio.name || "jarvis-voice.webm");
  form.append("model", endpoint.sttModel);
  form.append("response_format", "verbose_json");

  const requestedLanguage = params.expectedLanguage
    ?.trim()
    .toLowerCase()
    .split("-")[0];
  if (requestedLanguage && /^[a-z]{2,3}$/.test(requestedLanguage)) {
    form.append("language", requestedLanguage);
  }

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${endpoint.token}` },
    body: form,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(params.timeoutMs ?? 90_000),
  });
  if (!response.ok) {
    throw new Error(
      `HireGo Voice Engine STT returned HTTP ${response.status}`,
    );
  }
  const parsed = transcriptionSchema.parse(await response.json());

  return {
    transcript: parsed.text,
    detectedLanguage: parsed.language || requestedLanguage || "auto",
    confidence: null as number | null,
    durationSeconds: parsed.duration ?? null,
    provider: "hirego-self-hosted" as const,
    model: endpoint.sttModel,
    workerVersion: "speaches" as const,
  };
}

export async function synthesizeHireGoVoice(params: {
  text: string;
  voiceKey: string;
  language: string;
  timeoutMs?: number;
}): Promise<{ audio: Uint8Array; contentType: string }> {
  const text = params.text.trim().slice(0, 2_000);
  if (!text) throw new Error("Voice response text is empty.");

  const language = params.language.trim().toLowerCase();
  if (language && !language.startsWith("en")) {
    throw new Error(
      "HireGo self-hosted TTS is currently verified for English only.",
    );
  }

  const endpoint = await safeEndpoint("v1/audio/speech");
  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${endpoint.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: endpoint.ttsModel,
      voice: params.voiceKey.trim().slice(0, 80),
      input: text,
      response_format: "wav",
      speed: 1,
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(params.timeoutMs ?? 90_000),
  });
  if (!response.ok) {
    throw new Error(
      `HireGo Voice Engine TTS returned HTTP ${response.status}`,
    );
  }

  const declared = Number(response.headers.get("content-length") || "0");
  const maxBytes = 8 * 1024 * 1024;
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error("HireGo Voice Engine TTS response exceeded size limit.");
  }
  const audio = new Uint8Array(await response.arrayBuffer());
  if (!audio.length || audio.length > maxBytes) {
    throw new Error("HireGo Voice Engine returned invalid speech audio.");
  }

  return {
    audio,
    contentType:
      response.headers.get("content-type")?.split(";")[0] || "audio/wav",
  };
}
