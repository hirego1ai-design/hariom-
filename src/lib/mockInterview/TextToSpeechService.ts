import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { resolveAiProvider } from "@/lib/ai/AiProviderCredentials";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";

const MAX_TTS_INPUT_CHARS = 4_096;
const MAX_TTS_RESPONSE_BYTES = 5 * 1024 * 1024;

export class TextToSpeechUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextToSpeechUnavailableError";
  }
}

export function resolveElevenLabsVoiceId(voiceKey?: string | null): string {
  if (!voiceKey) return "FFUyfdtZviQ3xDCrBrR2"; // User requested Sara voice
  const normalized = voiceKey.toLowerCase().trim();
  if (normalized.includes("adam") || normalized === "echo" || normalized === "onyx") {
    return "pNInz6obpgDQGcFmaJgB"; // Adam (deep male interviewer)
  }
  if (normalized.includes("george")) {
    return "JBFqnCBsd6RMkjVDRZzb"; // George
  }
  if (normalized.includes("alice")) {
    return "Xb7hH8MSUJpSbSDYk0k2"; // Alice
  }
  if (normalized.includes("daniel")) {
    return "onwK4e9ZLuTAKqWW03F9"; // Daniel
  }
  // ElevenLabs voice IDs are strictly alphanumeric (18-24 chars, never hyphens or underscores like persona keys)
  if (/^[A-Za-z0-9]{18,24}$/.test(voiceKey.trim())) {
    return voiceKey.trim();
  }
  return "FFUyfdtZviQ3xDCrBrR2"; // User requested Sara voice
}

function baseUrlForProvider(provider: string, runtimeBaseUrl?: string) {
  if (provider === "openai") {
    return runtimeBaseUrl || "https://api.openai.com/v1";
  }
  if (provider === "self_hosted" && runtimeBaseUrl) {
    return runtimeBaseUrl;
  }
  throw new TextToSpeechUnavailableError(
    `TTS adapter is not implemented for provider '${provider}'.`,
  );
}

export async function assertTextToSpeechRouteConfigured(): Promise<void> {
  if (process.env.ELEVENLABS_API_KEY?.trim()) {
    return;
  }

  const route = await ModelRouter.route({
    taskType: "mock-interview-tts",
    requiredCapabilities: ["TTS"],
  });
  const endpoints = [route.primary, ...route.fallbackChain];
  if (
    !endpoints.some(
      (endpoint) =>
        endpoint.provider === "openai" || endpoint.provider === "self_hosted",
    )
  ) {
    throw new TextToSpeechUnavailableError(
      "No supported TTS provider is configured for mock-interview-tts.",
    );
  }
}

export async function synthesizeMockInterviewSpeech(params: {
  text: string;
  voiceKey: string;
  language: string;
}): Promise<{
  audio: Uint8Array;
  contentType: string;
  provider: string;
  model: string;
}> {
  const text = params.text.trim().slice(0, MAX_TTS_INPUT_CHARS);
  const voiceKey = params.voiceKey?.trim()?.slice(0, 160) || "sarah";
  if (!text) throw new TextToSpeechUnavailableError("TTS input is empty.");

  // Check ElevenLabs first (Primary High-Fidelity Voice Provider)
  const elevenKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (elevenKey) {
    const started = Date.now();
    const logId = crypto.randomUUID();
    const voiceId = resolveElevenLabsVoiceId(voiceKey);
    const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=4`;

    try {
      const response = await fetch(elevenUrl, {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > 0 && bytes.length <= MAX_TTS_RESPONSE_BYTES) {
          void prisma.aiExecutionLog.create({
            data: {
              id: logId,
              task: "mock-interview-tts",
              provider: "elevenlabs",
              model: "eleven_turbo_v2_5",
              promptTokens: null,
              completionTokens: null,
              totalTokens: null,
              latencyMs: Date.now() - started,
              costEstUsd: null,
              status: "SUCCESS",
              timestamp: new Date(),
            },
          }).catch(() => {});

          return {
            audio: bytes,
            contentType: "audio/mpeg",
            provider: "elevenlabs",
            model: "eleven_turbo_v2_5",
          };
        }
      } else {
        const errorText = await response.text().catch(() => "");
        console.warn(`[ElevenLabs] TTS returned HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        if (response.status === 402 && voiceId !== "EXAVITQu4vr4xnSDxMaL") {
          console.warn("[ElevenLabs] Custom voice requires paid plan, retrying with standard premade voice...");
          const retryRes = await fetch("https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?optimize_streaming_latency=4", {
            method: "POST",
            headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
            body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
            signal: AbortSignal.timeout(8_000),
          });
          if (retryRes.ok) {
            const retryBytes = new Uint8Array(await retryRes.arrayBuffer());
            if (retryBytes.length > 0 && retryBytes.length <= MAX_TTS_RESPONSE_BYTES) {
              return { audio: retryBytes, contentType: "audio/mpeg", provider: "elevenlabs", model: "eleven_turbo_v2_5" };
            }
          }
        }
      }
    } catch (elevenError) {
      console.warn("[ElevenLabs] Error during synthesis, falling back to router:", elevenError);
    }
  }

  const routed = await ModelRouter.executeWithFallback({
    taskType: "mock-interview-tts",
    requiredCapabilities: ["TTS"],
    fn: async (endpoint, policy, isFallback) => {
      const started = Date.now();
      const providerConfig = await resolveAiProvider(endpoint.provider);
      const apiKey = providerConfig.apiKey;
      if (!providerConfig.configured || !apiKey) {
        throw new TextToSpeechUnavailableError(
          providerConfig.reason || "TTS provider is not configured.",
        );
      }

      const baseUrl = baseUrlForProvider(endpoint.provider, providerConfig.baseURL);
      const speechUrl = new URL(
        "audio/speech",
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
      ).toString();

      if (process.env.NODE_ENV === "production") {
        await assertSafeOutboundNetworkTarget(speechUrl, {
          label: "TTS provider URL",
          requireHttps: true,
        });
      }

      const logId = crypto.randomUUID();
      try {
        const response = await fetch(speechUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: endpoint.model,
            voice: voiceKey,
            input: text,
            response_format: "mp3",
          }),
          signal: AbortSignal.timeout(policy.timeoutMs),
          redirect: "error",
        });

        if (!response.ok) {
          throw new Error(`TTS provider returned HTTP ${response.status}`);
        }

        const declaredLength = Number(
          response.headers.get("content-length") || "0",
        );
        if (
          Number.isFinite(declaredLength) &&
          declaredLength > MAX_TTS_RESPONSE_BYTES
        ) {
          throw new Error("TTS provider response exceeded size limit.");
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!bytes.length || bytes.length > MAX_TTS_RESPONSE_BYTES) {
          throw new Error("TTS provider returned invalid audio.");
        }

        void prisma.aiExecutionLog.create({
          data: {
            id: logId,
            task: "mock-interview-tts",
            provider: endpoint.provider,
            model: endpoint.model,
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            latencyMs: Date.now() - started,
            costEstUsd: null,
            status: isFallback ? "FALLBACK" : "SUCCESS",
            timestamp: new Date(),
          },
        }).catch(() => {});

        return {
          audio: bytes,
          contentType:
            response.headers.get("content-type")?.split(";")[0] ||
            "audio/mpeg",
          provider: endpoint.provider,
          model: endpoint.model,
        };
      } catch (error) {
        await prisma.aiExecutionLog
          .create({
            data: {
              id: logId,
              task: "mock-interview-tts",
              provider: endpoint.provider,
              model: endpoint.model,
              promptTokens: null,
              completionTokens: null,
              totalTokens: null,
              latencyMs: Date.now() - started,
              costEstUsd: null,
              status: "FAILED",
              timestamp: new Date(),
            },
          })
          .catch(() => null);
        throw error;
      }
    },
  });

  return routed.result;
}
