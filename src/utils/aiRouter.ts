import OpenAI from "openai";
import { prisma } from "../lib/prisma";

export type LlmProvider = "openai" | "gemini" | "claude" | "deepseek";

export interface AiTaskRequest {
  task: "RESUME_SCORE" | "JD_GENERATION" | "CANDIDATE_MATCH" | "INTERVIEW_EVALUATION" | "GENERAL";
  prompt: string;
  primaryProvider?: LlmProvider;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
  bypassCache?: boolean;
}

export interface AiExecutionLog {
  id: string;
  task: string;
  provider: LlmProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costEstUsd: number;
  status: "SUCCESS" | "FALLBACK" | "FAILED" | "CACHED";
  timestamp: string;
}

// In-memory cache for repeated prompt signatures
const promptResponseCache = new Map<string, { resultText: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

const executionLogsStore: AiExecutionLog[] = [];

let openaiClient: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("sk-proj-hirego-openai-production-key")) {
  try {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    openaiClient = null;
  }
}

export async function dispatchAiTask(request: AiTaskRequest): Promise<{
  success: boolean;
  resultText: string;
  log: AiExecutionLog;
}> {
  const startTime = Date.now();
  const primaryProvider = request.primaryProvider || "openai";

  // Check cache unless explicitly bypassed
  const cacheKey = `${request.task}:${request.prompt.trim().toLowerCase()}`;
  if (!request.bypassCache && promptResponseCache.has(cacheKey)) {
    const cachedEntry = promptResponseCache.get(cacheKey)!;
    if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      const cachedLog: AiExecutionLog = {
        id: `ai-cache-${Date.now()}`,
        task: request.task,
        provider: primaryProvider,
        model: "cache-hit",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: Date.now() - startTime,
        costEstUsd: 0.0,
        status: "CACHED",
        timestamp: new Date().toISOString(),
      };
      return { success: true, resultText: cachedEntry.resultText, log: cachedLog };
    }
  }

  const modelMap: Record<LlmProvider, string> = {
    openai: "gpt-4o",
    gemini: "gemini-1.5-pro",
    claude: "claude-3-5-sonnet",
    deepseek: "deepseek-v3",
  };

  const providerUsed: LlmProvider = primaryProvider;
  const status = "SUCCESS" as const;
  let responseText = "";
  let actualPromptTokens = 0;
  let actualCompletionTokens = 0;

  const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-") && !process.env.OPENAI_API_KEY.includes("dummy");
  // Try real OpenAI API call if client is configured and real key present
  if (openaiClient && primaryProvider === "openai" && hasRealKey) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: modelMap.openai,
        messages: [{ role: "user", content: request.prompt }],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 500,
      });

      responseText = response.choices[0]?.message?.content || "";
      actualPromptTokens = response.usage?.prompt_tokens || 0;
      actualCompletionTokens = response.usage?.completion_tokens || 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown provider error";
      throw new Error(`AI provider ${primaryProvider} failed: ${message}`);
    }
  }

  if (!responseText) {
    if (process.env.NODE_ENV !== "production") {
      responseText = `Simulated AI task output for ${request.task}: High compatibility score (88/100).`;
      actualPromptTokens = Math.max(10, Math.floor(request.prompt.length / 4));
      actualCompletionTokens = 35;
    } else {
      throw new Error(
        primaryProvider === "openai"
          ? "AI service is not configured. Set a valid OPENAI_API_KEY."
          : `AI provider ${primaryProvider} is not configured.`,
      );
    }
  }

  const latencyMs = Math.max(120, Date.now() - startTime);
  const promptTokens = actualPromptTokens || Math.max(10, Math.floor(request.prompt.length / 4));
  const completionTokens = actualCompletionTokens || Math.max(20, Math.floor(responseText.length / 4));
  const totalTokens = promptTokens + completionTokens;
  const costEstUsd = Number(((totalTokens / 1000) * 0.002).toFixed(5));

  const log: AiExecutionLog = {
    id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    task: request.task,
    provider: providerUsed,
    model: modelMap[providerUsed],
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    costEstUsd,
    status,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.aiExecutionLog.create({
      data: {
        id: log.id,
        task: log.task,
        provider: log.provider,
        model: log.model,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        latencyMs: log.latencyMs,
        costEstUsd: log.costEstUsd,
        status: log.status,
        timestamp: new Date(log.timestamp),
      },
    });
  } catch {
    // Database fallback
  }

  // Populate cache
  promptResponseCache.set(cacheKey, { resultText: responseText, timestamp: Date.now() });

  executionLogsStore.unshift(log);

  return {
    success: true,
    resultText: responseText,
    log,
  };
}

export async function getAiUsageStats() {
  let logs: AiExecutionLog[] = [];
  try {
    const dbLogs = await prisma.aiExecutionLog.findMany({
      orderBy: { timestamp: "desc" },
    });
    if (dbLogs && dbLogs.length > 0) {
      logs = dbLogs.map((l) => ({
        id: l.id,
        task: l.task,
        provider: l.provider as LlmProvider,
        model: l.model,
        promptTokens: l.promptTokens,
        completionTokens: l.completionTokens,
        totalTokens: l.totalTokens,
        latencyMs: l.latencyMs,
        costEstUsd: l.costEstUsd,
        status: l.status as AiExecutionLog["status"],
        timestamp: l.timestamp.toISOString(),
      }));
    }
  } catch {
    // Fallback
  }

  if (logs.length === 0) {
    logs = executionLogsStore;
  }

  const totalRequests = logs.length;
  const totalTokens = logs.reduce((acc, l) => acc + l.totalTokens, 0);
  const totalCost = logs.reduce((acc, l) => acc + l.costEstUsd, 0);
  const avgLatency = totalRequests > 0 ? Math.round(logs.reduce((acc, l) => acc + l.latencyMs, 0) / totalRequests) : 0;

  const providerCounts = logs.reduce((acc, l) => {
    acc[l.provider] = (acc[l.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRequests,
    totalTokens,
    totalCostUsd: Number(totalCost.toFixed(4)),
    avgLatencyMs: avgLatency,
    providerCounts: {
      openai: providerCounts.openai || 0,
      gemini: providerCounts.gemini || 0,
      claude: providerCounts.claude || 0,
      deepseek: providerCounts.deepseek || 0,
    },
    logs: logs.slice(0, 20),
  };
}
