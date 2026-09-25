import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const llmProviderSchema = z.enum(["openai", "gemini", "deepseek", "kimi", "qwen"]);
export type LlmProviderName = z.infer<typeof llmProviderSchema>;

export const routingModeSchema = z.enum([
  "MANUAL",
  "COST_SAVER",
  "BALANCED",
  "QUALITY_FIRST",
  "SMART_AUTO",
]);
export type RoutingMode = z.infer<typeof routingModeSchema>;

export const modelQualityTierSchema = z.enum(["ECONOMY", "BALANCED", "PREMIUM"]);
export type ModelQualityTier = z.infer<typeof modelQualityTierSchema>;

export const modelCapabilitySchema = z.enum([
  "TEXT",
  "STRUCTURED_OUTPUT",
  "TOOL_USE",
  "VISION",
  "LONG_CONTEXT",
  "REASONING",
]);

export const aiModelConfigSchema = z.object({
  key: z.string().trim().min(3).max(160).regex(/^[a-zA-Z0-9._:-]+$/),
  provider: llmProviderSchema,
  modelId: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(160),
  enabled: z.boolean(),
  qualityTier: modelQualityTierSchema,
  capabilities: z.array(modelCapabilitySchema).max(12).default(["TEXT"]),
  taskTypes: z.array(z.string().trim().min(1).max(120)).max(100).default(["*"]),
  inputUsdPerMillion: z.number().finite().nonnegative().nullable().default(null),
  outputUsdPerMillion: z.number().finite().nonnegative().nullable().default(null),
  cachedInputUsdPerMillion: z.number().finite().nonnegative().nullable().default(null),
  contextWindow: z.number().int().positive().max(20_000_000).nullable().default(null),
}).strict();

export type AiModelConfig = z.infer<typeof aiModelConfigSchema>;

export const aiTaskRouteSchema = z.object({
  taskType: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._:-]+$/),
  mode: routingModeSchema,
  primaryModelKey: z.string().trim().min(3).max(160).nullable(),
  fallbackModelKeys: z.array(z.string().trim().min(3).max(160)).max(5),
  timeoutMs: z.number().int().min(1_000).max(120_000).default(20_000),
  maxTokens: z.number().int().min(1).max(100_000).default(2_000),
  temperature: z.number().finite().min(0).max(2).nullable().default(null),
  maxRetriesPerEndpoint: z.number().int().min(0).max(1).default(0),
  maxCostUsdPerRequest: z.number().finite().positive().max(100).nullable().default(null),
}).strict();

export type AiTaskRoute = z.infer<typeof aiTaskRouteSchema>;

export const aiRoutingConfigSchema = z.object({
  version: z.number().int().min(1).default(1),
  models: z.array(aiModelConfigSchema).max(200),
  routes: z.array(aiTaskRouteSchema).max(100),
}).strict().superRefine((value, ctx) => {
  const modelKeys = new Set<string>();
  for (const [index, model] of value.models.entries()) {
    if (modelKeys.has(model.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["models", index, "key"],
        message: "Model key must be unique.",
      });
    }
    modelKeys.add(model.key);
  }

  const routeKeys = new Set<string>();
  for (const [index, route] of value.routes.entries()) {
    if (routeKeys.has(route.taskType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["routes", index, "taskType"],
        message: "Task route must be unique.",
      });
    }
    routeKeys.add(route.taskType);

    for (const modelKey of [route.primaryModelKey, ...route.fallbackModelKeys].filter(Boolean) as string[]) {
      if (!modelKeys.has(modelKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["routes", index],
          message: `Unknown model key: ${modelKey}`,
        });
      }
    }
  }
});

export type AiRoutingConfig = z.infer<typeof aiRoutingConfigSchema>;

const CONFIG_ID = "global-admin-config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getAiRoutingConfig(): Promise<AiRoutingConfig> {
  const row = await prisma.adminConfiguration.findUnique({
    where: { id: CONFIG_ID },
    select: { platformConfig: true },
  });
  if (!row || !isRecord(row.platformConfig) || !("aiRouting" in row.platformConfig)) {
    return { version: 1, models: [], routes: [] };
  }

  const parsed = aiRoutingConfigSchema.safeParse(row.platformConfig.aiRouting);
  if (!parsed.success) {
    throw new Error("Stored AI routing configuration is invalid. Refusing to route an AI request.");
  }
  return parsed.data;
}

export async function saveAiRoutingConfig(config: AiRoutingConfig): Promise<void> {
  const parsed = aiRoutingConfigSchema.parse(config);

  await prisma.$transaction(async (tx) => {
    await tx.adminConfiguration.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, platformConfig: { aiRouting: parsed } as Prisma.InputJsonValue },
      update: {},
    });

    await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;

    const existing = await tx.adminConfiguration.findUniqueOrThrow({
      where: { id: CONFIG_ID },
      select: { platformConfig: true },
    });
    const platformConfig = isRecord(existing.platformConfig)
      ? { ...existing.platformConfig }
      : {};

    platformConfig.aiRouting = parsed;
    await tx.adminConfiguration.update({
      where: { id: CONFIG_ID },
      data: { platformConfig: platformConfig as Prisma.InputJsonValue },
    });
  });
}

type ProviderRuntime = {
  configured: boolean;
  baseURL?: string;
  reason?: string;
};

export function getProviderRuntime(provider: LlmProviderName): ProviderRuntime {
  if (provider === "openai") {
    return process.env.OPENAI_API_KEY
      ? { configured: true, baseURL: process.env.OPENAI_BASE_URL || undefined }
      : { configured: false, reason: "OPENAI_API_KEY is missing" };
  }
  if (provider === "gemini") {
    return process.env.GEMINI_API_KEY
      ? {
          configured: true,
          baseURL: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/",
        }
      : { configured: false, reason: "GEMINI_API_KEY is missing" };
  }
  if (provider === "deepseek") {
    return process.env.DEEPSEEK_API_KEY
      ? { configured: true, baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com" }
      : { configured: false, reason: "DEEPSEEK_API_KEY is missing" };
  }
  if (provider === "kimi") {
    return process.env.KIMI_API_KEY
      ? { configured: true, baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1" }
      : { configured: false, reason: "KIMI_API_KEY is missing" };
  }

  if (!process.env.QWEN_API_KEY) return { configured: false, reason: "QWEN_API_KEY is missing" };
  if (!process.env.QWEN_BASE_URL) return { configured: false, reason: "QWEN_BASE_URL is missing" };
  return { configured: true, baseURL: process.env.QWEN_BASE_URL };
}

export function getProviderApiKey(provider: LlmProviderName): string | null {
  const value = provider === "openai"
    ? process.env.OPENAI_API_KEY
    : provider === "gemini"
      ? process.env.GEMINI_API_KEY
      : provider === "deepseek"
        ? process.env.DEEPSEEK_API_KEY
        : provider === "kimi"
          ? process.env.KIMI_API_KEY
          : process.env.QWEN_API_KEY;
  return value?.trim() || null;
}

export function getProviderStatusSummary() {
  return llmProviderSchema.options.map((provider) => {
    const runtime = getProviderRuntime(provider);
    return {
      provider,
      configured: runtime.configured,
      status: runtime.configured ? "CONFIGURED" : "MISSING_CONFIGURATION",
      reason: runtime.configured ? null : runtime.reason || "Provider is not configured",
    };
  });
}
