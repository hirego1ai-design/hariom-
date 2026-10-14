import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import {
  getProviderApiKey,
  getProviderRuntime,
} from "@/lib/ai/AiRoutingConfig";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";

export class SpeechToTextUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpeechToTextUnavailableError";
  }
}

function baseUrlForProvider(provider: string, runtimeBaseUrl?: string) {
  if (provider === "openai") {
    return runtimeBaseUrl || "https://api.openai.com/v1";
  }
  if (provider === "self_hosted" && runtimeBaseUrl) {
    return runtimeBaseUrl;
  }
  throw new SpeechToTextUnavailableError(
    `STT adapter is not implemented for provider '${provider}'.`,
  );
}

export async function assertSpeechToTextRouteConfigured(): Promise<void> {
  const route = await ModelRouter.route({
    taskType: "mock-interview-stt",
    requiredCapabilities: ["STT"],
  });
  const endpoints = [route.primary, ...route.fallbackChain];
  if (
    !endpoints.some(
      (endpoint) =>
        endpoint.provider === "openai" ||
        endpoint.provider === "self_hosted",
    )
  ) {
    throw new SpeechToTextUnavailableError(
      "No supported STT provider is configured for mock-interview-stt.",
    );
  }
}

export async function transcribeMockInterviewAudio(params: {
  audio: File;
  expectedLanguage?: string | null;
  roleTarget: string;
  skillTags?: string[];
}): Promise<{
  transcript: string;
  detectedLanguage: string;
  confidence: null;
  requiresConfirmation: true;
  provider: string;
  model: string;
  version: string;
}> {
  if (!params.audio.size) {
    throw new SpeechToTextUnavailableError("Voice recording is empty.");
  }

  const promptParts = [
    `Role: ${params.roleTarget.trim().slice(0, 160)}`,
    params.skillTags?.length
      ? `Relevant terms: ${params.skillTags.slice(0, 8).join(", ")}`
      : "",
    params.expectedLanguage
      ? `Expected conversation language: ${params.expectedLanguage}`
      : "",
    "Preserve technical terms, product names, acronyms, numbers, and code-switching faithfully.",
  ].filter(Boolean);

  const routed = await ModelRouter.executeWithFallback({
    taskType: "mock-interview-stt",
    requiredCapabilities: ["STT"],
    fn: async (endpoint, policy, isFallback) => {
      const started = Date.now();
      const runtime = getProviderRuntime(endpoint.provider);
      const apiKey = getProviderApiKey(endpoint.provider);
      if (!runtime.configured || !apiKey) {
        throw new SpeechToTextUnavailableError(
          runtime.reason || "STT provider is not configured.",
        );
      }

      const baseUrl = baseUrlForProvider(
        endpoint.provider,
        runtime.baseURL,
      );
      const transcriptionUrl = new URL(
        "audio/transcriptions",
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
      ).toString();

      if (process.env.NODE_ENV === "production") {
        await assertSafeOutboundNetworkTarget(transcriptionUrl, {
          label: "STT provider URL",
          requireHttps: true,
        });
      }

      const form = new FormData();
      form.append("file", params.audio, params.audio.name || "voice-answer.webm");
      form.append("model", endpoint.model);
      form.append("response_format", "json");
      if (promptParts.length) {
        form.append("prompt", promptParts.join("\n").slice(0, 2_000));
      }

      const logId = crypto.randomUUID();
      try {
        const response = await fetch(transcriptionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: form,
          signal: AbortSignal.timeout(policy.timeoutMs),
          redirect: "error",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `STT provider returned HTTP ${response.status}`,
          );
        }

        const payload = (await response.json()) as {
          text?: unknown;
          language?: unknown;
          languages?: unknown;
        };
        const transcript =
          typeof payload.text === "string" ? payload.text.trim() : "";
        if (!transcript || transcript.length > 10_000) {
          throw new Error("STT provider returned an invalid transcript.");
        }

        let detectedLanguage =
          typeof payload.language === "string"
            ? payload.language.trim()
            : "";
        if (
          !detectedLanguage &&
          Array.isArray(payload.languages) &&
          payload.languages.length > 0
        ) {
          const first = payload.languages[0];
          if (
            first &&
            typeof first === "object" &&
            "code" in first &&
            typeof (first as { code?: unknown }).code === "string"
          ) {
            detectedLanguage = (first as { code: string }).code.trim();
          }
        }
        detectedLanguage =
          detectedLanguage ||
          params.expectedLanguage?.trim() ||
          "und";

        void prisma.aiExecutionLog.create({
          data: {
            id: logId,
            task: "mock-interview-stt",
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
          transcript,
          detectedLanguage,
          confidence: null as null,
          requiresConfirmation: true as const,
          provider: endpoint.provider,
          model: endpoint.model,
          version: "provider-file-transcription-v1",
        };
      } catch (error) {
        await prisma.aiExecutionLog
          .create({
            data: {
              id: logId,
              task: "mock-interview-stt",
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
