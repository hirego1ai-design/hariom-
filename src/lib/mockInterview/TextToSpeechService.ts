import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import {
  getProviderApiKey,
  getProviderRuntime,
} from "@/lib/ai/AiRoutingConfig";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";

const MAX_TTS_INPUT_CHARS = 5_000;
const MAX_TTS_RESPONSE_BYTES = 5 * 1024 * 1024;

export class TextToSpeechUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextToSpeechUnavailableError";
  }
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
  const voiceKey = params.voiceKey.trim().slice(0, 160);
  if (!text) throw new TextToSpeechUnavailableError("TTS input is empty.");
  if (!voiceKey) {
    throw new TextToSpeechUnavailableError(
      "The selected interviewer does not have a configured voice.",
    );
  }

  const routed = await ModelRouter.executeWithFallback({
    taskType: "mock-interview-tts",
    requiredCapabilities: ["TTS"],
    fn: async (endpoint, policy, isFallback) => {
      const started = Date.now();
      const runtime = getProviderRuntime(endpoint.provider);
      const apiKey = getProviderApiKey(endpoint.provider);
      if (!runtime.configured || !apiKey) {
        throw new TextToSpeechUnavailableError(
          runtime.reason || "TTS provider is not configured.",
        );
      }

      const baseUrl = baseUrlForProvider(endpoint.provider, runtime.baseURL);
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

        await prisma.aiExecutionLog.create({
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
        });

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
