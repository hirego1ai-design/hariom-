import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import {
  aiRoutingConfigSchema,
  getAiRoutingConfig,
  getProviderStatusSummary,
  saveAiRoutingConfig,
} from "@/lib/ai/AiRoutingConfig";
import { getAiUsageStats } from "@/utils/aiRouter";

const updateSchema = z.object({
  config: aiRoutingConfigSchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_ai_routing_read", 60, 60_000);

    const [config, usage] = await Promise.all([
      getAiRoutingConfig(),
      getAiUsageStats(),
    ]);

    return NextResponse.json({
      success: true,
      config,
      providers: getProviderStatusSummary(),
      telemetry: {
        totalRequests: usage.totalRequests,
        totalTokens: usage.totalTokens,
        totalCostUsd: usage.totalCostUsd,
        avgLatencyMs: usage.avgLatencyMs,
        providerCounts: usage.providerCounts,
        modelStats: usage.modelStats,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_ai_routing_write:${session.id}`, 10, 60_000);
    const payload = await readValidatedJson(request, updateSchema, 256 * 1024);
    const config = aiRoutingConfigSchema.parse(payload.config);
    const reason = payload.reason;

    const previous = await getAiRoutingConfig();
    await saveAiRoutingConfig(config);

    const changedModels = new Set([
      ...previous.models.map((model) => model.key),
      ...config.models.map((model) => model.key),
    ]).size;
    const changedRoutes = new Set([
      ...previous.routes.map((route) => route.taskType),
      ...config.routes.map((route) => route.taskType),
    ]).size;

    await logAuditEvent({
      userId: session.id,
      action: "AI_ROUTING_CONFIG_UPDATED",
      resource: "AdminConfiguration:aiRouting",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      details: JSON.stringify({
        fromVersion: previous.version,
        toVersion: config.version,
        modelRegistrySize: config.models.length,
        routeCount: config.routes.length,
        modelKeysTouched: changedModels,
        routeKeysTouched: changedRoutes,
        reason: reason || null,
      }),
    });

    return NextResponse.json({
      success: true,
      config,
      providers: getProviderStatusSummary(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
