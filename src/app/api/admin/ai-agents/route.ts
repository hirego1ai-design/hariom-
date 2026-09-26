import { NextRequest, NextResponse } from "next/server";
import { KillSwitchType } from "@prisma/client";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { AgentRegistry } from "@/lib/agents/AgentRegistry";
import {
  getAiRoutingConfig,
  getProviderStatusSummary,
} from "@/lib/ai/AiRoutingConfig";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_ai_agent_control_read", 60, 60_000);

    const registry = AgentRegistry.getInstance();
    const agents = registry.getRegisteredAgents();
    const config = await getAiRoutingConfig();
    const providerStatus = new Map(
      getProviderStatusSummary().map((item) => [item.provider, item]),
    );
    const modelByKey = new Map(config.models.map((model) => [model.key, model]));

    const taskTypes = Array.from(
      new Set(agents.map((agent) => agent.routingTaskType).filter((value): value is string => Boolean(value))),
    );

    const [logs, killSwitches] = await Promise.all([
      taskTypes.length
        ? prisma.aiExecutionLog.findMany({
            where: { task: { in: taskTypes } },
            orderBy: { timestamp: "desc" },
            take: 5_000,
          })
        : Promise.resolve([]),
      prisma.killSwitchConfig.findMany({
        where: {
          targetType: KillSwitchType.AGENT,
          targetId: { in: agents.map((agent) => agent.agentId) },
        },
        select: {
          targetId: true,
          isActive: true,
          reason: true,
          updatedAt: true,
        },
      }),
    ]);

    const killByAgent = new Map(killSwitches.map((item) => [item.targetId, item]));

    const taskLogs = new Map<string, typeof logs>();
    for (const log of logs) {
      const existing = taskLogs.get(log.task) ?? [];
      existing.push(log);
      taskLogs.set(log.task, existing);
    }

    const responseAgents = agents.map((agent) => {
      const taskType = agent.routingTaskType;
      const policy = taskType
        ? config.routes.find((route) => route.taskType === taskType) ?? null
        : null;
      const approvedModelKeys = policy
        ? Array.from(
            new Set(
              [policy.primaryModelKey, ...policy.fallbackModelKeys].filter(Boolean) as string[],
            ),
          )
        : [];
      const configuredModels = approvedModelKeys
        .map((key) => modelByKey.get(key))
        .filter((model): model is NonNullable<typeof model> => Boolean(model));

      const runnableModels = configuredModels.filter((model) => {
        const provider = providerStatus.get(model.provider);
        const supportsTask = !taskType || model.taskTypes.includes("*") || model.taskTypes.includes(taskType);
        return model.enabled && Boolean(provider?.configured) && supportsTask;
      });

      const observed = taskType ? taskLogs.get(taskType) ?? [] : [];
      const successes = observed.filter(
        (log) => log.status === "SUCCESS" || log.status === "FALLBACK",
      );
      const failures = observed.filter((log) => log.status === "FAILED");
      const fallbacks = observed.filter((log) => log.status === "FALLBACK");
      const totalCost = observed.reduce(
        (total, log) => total + (typeof log.costEstUsd === "number" ? log.costEstUsd : 0),
        0,
      );
      const totalTokens = observed.reduce(
        (total, log) => total + (typeof log.totalTokens === "number" ? log.totalTokens : 0),
        0,
      );
      const kill = killByAgent.get(agent.agentId);
      const lastSuccess = successes[0]?.timestamp ?? null;
      const lastFailure = failures[0]?.timestamp ?? null;

      let status:
        | "DETERMINISTIC_NO_LLM"
        | "PAUSED"
        | "UNCONFIGURED"
        | "BLOCKED_CONFIGURATION"
        | "READY";
      if (!taskType) status = "DETERMINISTIC_NO_LLM";
      else if (kill?.isActive) status = "PAUSED";
      else if (!policy) status = "UNCONFIGURED";
      else if (runnableModels.length === 0) status = "BLOCKED_CONFIGURATION";
      else status = "READY";

      const primary = policy?.primaryModelKey
        ? modelByKey.get(policy.primaryModelKey) ?? null
        : null;
      const fallbacksConfigured = policy
        ? policy.fallbackModelKeys
            .map((key) => modelByKey.get(key))
            .filter((model): model is NonNullable<typeof model> => Boolean(model))
        : [];

      return {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        allowedTools: agent.allowedTools,
        taskType,
        status,
        pausedReason: kill?.isActive ? kill.reason ?? "Agent kill switch is active." : null,
        routing: policy
          ? {
              mode: policy.mode,
              primary: primary
                ? {
                    key: primary.key,
                    label: primary.label,
                    provider: primary.provider,
                    modelId: primary.modelId,
                    enabled: primary.enabled,
                    providerConfigured: Boolean(providerStatus.get(primary.provider)?.configured),
                  }
                : null,
              fallbacks: fallbacksConfigured.map((model) => ({
                key: model.key,
                label: model.label,
                provider: model.provider,
                modelId: model.modelId,
                enabled: model.enabled,
                providerConfigured: Boolean(providerStatus.get(model.provider)?.configured),
              })),
              timeoutMs: policy.timeoutMs,
              maxTokens: policy.maxTokens,
              maxCostUsdPerRequest: policy.maxCostUsdPerRequest,
            }
          : null,
        telemetry: {
          requests: observed.length,
          successes: successes.length,
          failures: failures.length,
          fallbackCount: fallbacks.length,
          successRate: observed.length ? successes.length / observed.length : null,
          fallbackRate: observed.length ? fallbacks.length / observed.length : null,
          avgLatencyMs: observed.length
            ? Math.round(
                observed.reduce((total, log) => total + Math.max(0, log.latencyMs), 0) /
                  observed.length,
              )
            : null,
          totalTokens,
          observedCostUsd: Number(totalCost.toFixed(6)),
          costPerSuccessfulTaskUsd: successes.length
            ? Number((totalCost / successes.length).toFixed(6))
            : null,
          lastSuccess,
          lastFailure,
          lastError: null,
          lastErrorNote: lastFailure
            ? "Failure detail is not retained in AiExecutionLog; timestamp is authoritative."
            : null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      agents: responseAgents,
      routingConfigVersion: config.version,
      providerStatus: Array.from(providerStatus.values()),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
