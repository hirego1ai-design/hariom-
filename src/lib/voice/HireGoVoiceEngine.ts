import { z } from "zod";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";
import { resolveAiProvider } from "@/lib/ai/AiProviderCredentials";

const healthSchema = z.object({
  message: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

const modelsSchema = z.object({
  data: z.array(z.unknown()).optional(),
}).passthrough();

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
    "Systran/faster-whisper-base";
  const ttsModel =
    process.env.HIREGO_VOICE_TTS_MODEL?.trim() ||
    "speaches-ai/piper-en_US-hfc_female-medium";

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
  if (process.env.HIREGO_VOICE_ENGINE_E2E_VERIFIED !== "true") {
    throw new Error(
      "HireGo Voice Engine has not passed the production E2E verification gate.",
    );
  }

  const health = await safeEndpoint("health");
  const healthResponse = await fetch(health.url, {
    method: "GET",
    headers: { Authorization: `Bearer ${health.token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!healthResponse.ok) {
    throw new Error(
      `HireGo Voice Engine health returned HTTP ${healthResponse.status}`,
    );
  }
  healthSchema.parse(await healthResponse.json().catch(() => ({})));

  const models = await safeEndpoint("v1/models");
  const modelsResponse = await fetch(models.url, {
    method: "GET",
    headers: { Authorization: `Bearer ${models.token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!modelsResponse.ok) {
    throw new Error(
      `HireGo Voice Engine authenticated probe returned HTTP ${modelsResponse.status}`,
    );
  }
  modelsSchema.parse(await modelsResponse.json().catch(() => ({})));

  return {
    status: "ready",
    workerVersion: "speaches",
    e2eVerified: true,
    stt: {
      ready: true,
      provider: "hirego-self-hosted",
      model: models.sttModel,
    },
    tts: {
      ready: true,
      provider: "hirego-self-hosted",
      model: models.ttsModel,
    },
    // Full TTS output is verified only for English at launch. Faster-Whisper
    // can transcribe Hindi/Hinglish, but Hindi speech output stays gated until
    // a Hindi TTS model passes the same production E2E test.
    languages: ["en"],
    voices: ["hfc_female"],
  };
}

export async function transcribeHireGoVoice(params: {
  audio: File;
  expectedLanguage?: string | null;
  timeoutMs?: number;
}) {
  const requestedLanguage = params.expectedLanguage
    ?.trim()
    .toLowerCase()
    .split("-")[0];

  // 1. Primary: Self-hosted Voice Engine (if configured)
  try {
    const endpoint = await safeEndpoint("v1/audio/transcriptions");
    const form = new FormData();
    form.append("file", params.audio, params.audio.name || "jarvis-voice.webm");
    form.append("model", endpoint.sttModel);
    form.append("response_format", "verbose_json");

    if (requestedLanguage && /^[a-z]{2,3}$/.test(requestedLanguage)) {
      form.append("language", requestedLanguage);
    }

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${endpoint.token}` },
      body: form,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(params.timeoutMs ?? 20_000),
    });
    if (response.ok) {
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
  } catch {
    // Self-hosted not configured or unreachable; smoothly proceed to cloud fallbacks
  }

  // 2. High-speed Groq Whisper fallback (~200ms ultra-low latency)
  try {
    const groq = await resolveAiProvider("groq").catch(() => null);
    if (groq?.apiKey) {
      const groqForm = new FormData();
      groqForm.append("file", params.audio, params.audio.name || "audio.webm");
      groqForm.append("model", "whisper-large-v3-turbo");
      if (requestedLanguage && /^[a-z]{2,3}$/.test(requestedLanguage)) {
        groqForm.append("language", requestedLanguage);
      }
      const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groq.apiKey}` },
        body: groqForm,
        cache: "no-store",
        signal: AbortSignal.timeout(params.timeoutMs ?? 15_000),
      });
      if (groqRes.ok) {
        const groqData = await groqRes.json().catch(() => ({}));
        if (typeof groqData.text === "string" && groqData.text.trim()) {
          return {
            transcript: groqData.text.trim(),
            detectedLanguage: requestedLanguage || "auto",
            confidence: 0.95,
            durationSeconds: null,
            provider: "groq" as any,
            model: "whisper-large-v3-turbo",
            workerVersion: "groq-whisper" as any,
          };
        }
      }
    }
  } catch {
    // Proceed to OpenAI fallback
  }

  // 3. OpenAI Whisper fallback
  try {
    const oai = await resolveAiProvider("openai").catch(() => null);
    if (oai?.apiKey) {
      const oaiForm = new FormData();
      oaiForm.append("file", params.audio, params.audio.name || "audio.webm");
      oaiForm.append("model", "whisper-1");
      if (requestedLanguage && /^[a-z]{2,3}$/.test(requestedLanguage)) {
        oaiForm.append("language", requestedLanguage);
      }
      const oaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${oai.apiKey}` },
        body: oaiForm,
        cache: "no-store",
        signal: AbortSignal.timeout(params.timeoutMs ?? 15_000),
      });
      if (oaiRes.ok) {
        const oaiData = await oaiRes.json().catch(() => ({}));
        if (typeof oaiData.text === "string" && oaiData.text.trim()) {
          return {
            transcript: oaiData.text.trim(),
            detectedLanguage: requestedLanguage || "auto",
            confidence: 0.95,
            durationSeconds: null,
            provider: "openai" as any,
            model: "whisper-1",
            workerVersion: "openai-whisper" as any,
          };
        }
      }
    }
  } catch {
    // Fall through
  }

  throw new Error("No voice transcription service is currently available. Please speak again or type your message.");
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
  // Safe multilingual voice fallback - never block voice output with an exception
  const effectiveVoice = (language && !language.startsWith("en")) ? "hfc_female" : (params.voiceKey.trim().slice(0, 80) || "hfc_female");

  const endpoint = await safeEndpoint("v1/audio/speech");
  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${endpoint.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: endpoint.ttsModel,
      voice: effectiveVoice,
      input: text,
      response_format: "mp3",
      speed: 1,
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(params.timeoutMs ?? 15_000),
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
      response.headers.get("content-type")?.split(";")[0] || "audio/mpeg",
  };
}
