import OpenAI from "openai";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { getProviderApiKey, getProviderRuntime } from "@/lib/ai/AiRoutingConfig";

export class EmbeddingUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingUnavailableError";
  }
}

function providerClient(provider: Parameters<typeof getProviderRuntime>[0], timeoutMs: number) {
  const runtime = getProviderRuntime(provider);
  const key = getProviderApiKey(provider);
  if (!runtime.configured || !key || /dummy|placeholder|example|replace[-_ ]?me/i.test(key)) throw new EmbeddingUnavailableError(runtime.reason || "Embedding provider is not configured.");
  return new OpenAI({ apiKey: key, ...(runtime.baseURL ? { baseURL: runtime.baseURL } : {}), timeout: timeoutMs, maxRetries: 0 });
}

export async function createEmbedding(input: string): Promise<{ vector: number[]; provider: string; model: string; dimensions: number; logId: string }> {
  const bounded = input.trim().slice(0, 12_000);
  if (!bounded) throw new EmbeddingUnavailableError("Embedding input is empty.");

  const routed = await ModelRouter.executeWithFallback({
    taskType: "semantic-embedding",
    requiredCapabilities: ["EMBEDDING"],
    fn: async (endpoint, policy, isFallback) => {
      const started = Date.now();
      const client = providerClient(endpoint.provider, policy.timeoutMs);
      try {
        const response = await client.embeddings.create({ model: endpoint.model, input: bounded });
        const vector = response.data[0]?.embedding;
        if (!Array.isArray(vector) || vector.length < 8 || vector.length > 65_536 || vector.some((n) => !Number.isFinite(n))) throw new EmbeddingUnavailableError("Embedding provider returned an invalid vector.");
        const promptTokens = response.usage?.prompt_tokens ?? response.usage?.total_tokens ?? null;
        const costEstUsd = promptTokens !== null && endpoint.config.inputUsdPerMillion !== null ? (promptTokens / 1_000_000) * endpoint.config.inputUsdPerMillion : null;
        const logId = crypto.randomUUID();
        await prisma.aiExecutionLog.create({ data: {
          id: logId, task: "semantic-embedding", provider: endpoint.provider, model: endpoint.model,
          promptTokens, completionTokens: 0, totalTokens: response.usage?.total_tokens ?? promptTokens,
          latencyMs: Date.now() - started, costEstUsd, status: isFallback ? "FALLBACK" : "SUCCESS", timestamp: new Date(),
        }});
        return { vector, provider: endpoint.provider, model: endpoint.model, dimensions: vector.length, logId };
      } catch (error) {
        await prisma.aiExecutionLog.create({ data: {
          id: crypto.randomUUID(), task: "semantic-embedding", provider: endpoint.provider, model: endpoint.model,
          promptTokens: null, completionTokens: null, totalTokens: null, latencyMs: Date.now() - started,
          costEstUsd: null, status: "FAILED", timestamp: new Date(),
        }}).catch(() => null);
        throw error;
      }
    },
  });
  return routed.result;
}
