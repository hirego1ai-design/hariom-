import { CircuitBreaker } from "./CircuitBreaker";
import {
  AiModelConfig,
  AiTaskRoute,
  LlmProviderName,
  getAiRoutingConfig,
  getProviderRuntime,
} from "./AiRoutingConfig";
import { prisma } from "@/lib/prisma";

export interface ProviderModel {
  key: string;
  provider: LlmProviderName;
  model: string;
  config: AiModelConfig;
}

export interface RouteMapping {
  primary: ProviderModel;
  fallbackChain: ProviderModel[];
  policy: AiTaskRoute;
}

function supportsTask(model: AiModelConfig, taskType: string) {
  return model.taskTypes.includes("*") || model.taskTypes.includes(taskType);
}

function costWeight(model: AiModelConfig) {
  if (model.inputUsdPerMillion === null || model.outputUsdPerMillion === null) {
    return Number.POSITIVE_INFINITY;
  }
  return model.inputUsdPerMillion + model.outputUsdPerMillion;
}

function qualityWeight(model: AiModelConfig) {
  return model.qualityTier === "PREMIUM" ? 3 : model.qualityTier === "BALANCED" ? 2 : 1;
}

function providerReady(model: AiModelConfig) {
  return getProviderRuntime(model.provider).configured;
}

async function smartOrder(taskType: string, candidates: ProviderModel[], configuredPrimary: string | null) {
  if (candidates.length <= 1) return candidates;

  const logs = await prisma.aiExecutionLog.findMany({
    where: {
      task: taskType,
      OR: candidates.map((candidate) => ({
        provider: candidate.provider,
        model: candidate.model,
      })),
    },
    select: {
      provider: true,
      model: true,
      latencyMs: true,
      costEstUsd: true,
      status: true,
    },
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  const stats = new Map<string, {
    total: number;
    success: number;
    latencyTotal: number;
    costTotal: number;
    costSamples: number;
  }>();

  for (const log of logs) {
    const key = `${log.provider}:${log.model}`;
    const current = stats.get(key) ?? {
      total: 0,
      success: 0,
      latencyTotal: 0,
      costTotal: 0,
      costSamples: 0,
    };
    current.total += 1;
    if (log.status === "SUCCESS" || log.status === "FALLBACK") current.success += 1;
    current.latencyTotal += Math.max(0, log.latencyMs);
    if (typeof log.costEstUsd === "number" && Number.isFinite(log.costEstUsd)) {
      current.costTotal += log.costEstUsd;
      current.costSamples += 1;
    }
    stats.set(key, current);
  }

  return [...candidates].sort((a, b) => {
    const aStats = stats.get(`${a.provider}:${a.model}`);
    const bStats = stats.get(`${b.provider}:${b.model}`);

    // Keep the admin-selected primary ahead of unproven alternatives. Once
    // both models have enough real observations, cost-per-success can decide.
    const aProven = (aStats?.total ?? 0) >= 5;
    const bProven = (bStats?.total ?? 0) >= 5;
    if (!aProven || !bProven) {
      if (a.key === configuredPrimary && b.key !== configuredPrimary) return -1;
      if (b.key === configuredPrimary && a.key !== configuredPrimary) return 1;
      if (aProven !== bProven) return aProven ? -1 : 1;
      return costWeight(a.config) - costWeight(b.config);
    }

    const aRate = Math.max((aStats?.success ?? 0) / Math.max(1, aStats?.total ?? 1), 0.01);
    const bRate = Math.max((bStats?.success ?? 0) / Math.max(1, bStats?.total ?? 1), 0.01);
    const aAvgCost = aStats && aStats.costSamples > 0
      ? aStats.costTotal / aStats.costSamples
      : costWeight(a.config) / 1_000_000;
    const bAvgCost = bStats && bStats.costSamples > 0
      ? bStats.costTotal / bStats.costSamples
      : costWeight(b.config) / 1_000_000;

    const aCostPerSuccess = aAvgCost / aRate;
    const bCostPerSuccess = bAvgCost / bRate;
    if (aCostPerSuccess !== bCostPerSuccess) return aCostPerSuccess - bCostPerSuccess;

    const aLatency = (aStats?.latencyTotal ?? 0) / Math.max(1, aStats?.total ?? 1);
    const bLatency = (bStats?.latencyTotal ?? 0) / Math.max(1, bStats?.total ?? 1);
    return aLatency - bLatency;
  });
}

export class ModelRouter {
  public static async route(params: { taskType: string }): Promise<RouteMapping> {
    const config = await getAiRoutingConfig();
    const policy = config.routes.find((route) => route.taskType === params.taskType);
    if (!policy) {
      throw new Error(`No AI routing policy is configured for taskType '${params.taskType}'.`);
    }

    const modelByKey = new Map(config.models.map((model) => [model.key, model]));
    const allowedKeys = Array.from(new Set(
      [policy.primaryModelKey, ...policy.fallbackModelKeys].filter(Boolean) as string[],
    ));

    let candidates: ProviderModel[] = allowedKeys
      .map((key) => modelByKey.get(key))
      .filter((model): model is AiModelConfig =>
        Boolean(model && model.enabled && supportsTask(model, params.taskType) && providerReady(model))
      )
      .map((model) => ({
        key: model.key,
        provider: model.provider,
        model: model.modelId,
        config: model,
      }));

    if (candidates.length === 0) {
      throw new Error(
        `No enabled, configured model is available for AI task '${params.taskType}'. Check Admin AI Control Centre and provider credentials.`,
      );
    }

    if (policy.mode === "COST_SAVER") {
      candidates.sort((a, b) => costWeight(a.config) - costWeight(b.config));
    } else if (policy.mode === "BALANCED") {
      candidates.sort((a, b) => {
        const aCost = costWeight(a.config);
        const bCost = costWeight(b.config);
        const aEfficiency = Number.isFinite(aCost) ? qualityWeight(a.config) / Math.max(aCost, 0.000001) : 0;
        const bEfficiency = Number.isFinite(bCost) ? qualityWeight(b.config) / Math.max(bCost, 0.000001) : 0;
        if (aEfficiency !== bEfficiency) return bEfficiency - aEfficiency;
        if (a.key === policy.primaryModelKey && b.key !== policy.primaryModelKey) return -1;
        if (b.key === policy.primaryModelKey && a.key !== policy.primaryModelKey) return 1;
        return aCost - bCost;
      });
    } else if (policy.mode === "QUALITY_FIRST") {
      candidates.sort((a, b) => {
        const qualityDelta = qualityWeight(b.config) - qualityWeight(a.config);
        return qualityDelta !== 0 ? qualityDelta : costWeight(a.config) - costWeight(b.config);
      });
    } else if (policy.mode === "SMART_AUTO") {
      candidates = await smartOrder(params.taskType, candidates, policy.primaryModelKey);
    } else {
      const primaryIndex = candidates.findIndex((candidate) => candidate.key === policy.primaryModelKey);
      if (primaryIndex > 0) {
        const [primary] = candidates.splice(primaryIndex, 1);
        candidates.unshift(primary);
      }
    }

    const [primary, ...fallbackChain] = candidates;
    return { primary, fallbackChain, policy };
  }

  public static async executeWithFallback<T>(params: {
    taskType: string;
    fn: (endpoint: ProviderModel, policy: AiTaskRoute, isFallback: boolean) => Promise<T>;
    validateResult?: (result: T, endpoint: ProviderModel, policy: AiTaskRoute) => void | Promise<void>;
  }): Promise<{ result: T; usedEndpoint: ProviderModel }> {
    const mapping = await this.route({ taskType: params.taskType });
    const endpoints = [mapping.primary, ...mapping.fallbackChain];
    const errors: string[] = [];

    for (const endpoint of endpoints) {
      const breakerKey = `${endpoint.provider}:${endpoint.model}`;
      const maxAttempts = 1 + mapping.policy.maxRetriesPerEndpoint;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const result = await CircuitBreaker.execute(
            breakerKey,
            () => params.fn(endpoint, mapping.policy, endpoint.key !== mapping.primary.key),
          );
          if (params.validateResult) {
            await params.validateResult(result, endpoint, mapping.policy);
          }
          return { result, usedEndpoint: endpoint };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${endpoint.provider}/${endpoint.model}: ${message}`);

          // A timeout/5xx may already have consumed tokens. Do not blindly
          // replay billable calls. Only a clear rate-limit rejection is safe
          // for the optional same-endpoint retry; otherwise move to fallback.
          const rateLimited = /\b429\b|rate.?limit/i.test(message);
          if (!rateLimited || attempt >= maxAttempts) break;
        }
      }
    }

    throw new Error(
      `All configured AI endpoints failed for taskType '${params.taskType}': ${errors.join(" | ")}`,
    );
  }
}
