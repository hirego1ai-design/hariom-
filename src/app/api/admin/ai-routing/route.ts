import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import {
  aiRoutingConfigSchema,
  getAiRoutingConfig,
  getProviderStatusSummary,
} from "@/lib/ai/AiRoutingConfig";
import { getAiUsageStats } from "@/utils/aiRouter";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const CONFIG_ID = "global-admin-config";

const updateSchema = z.object({
  config: aiRoutingConfigSchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_ai_routing_read:${admin.id}`, 60, 60_000);

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
    const nextConfig = aiRoutingConfigSchema.parse(payload.config);

    await prisma.$transaction(async (tx) => {
      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platformConfig: {} },
        update: {},
      });

      await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
      const row = await tx.adminConfiguration.findUniqueOrThrow({
        where: { id: CONFIG_ID },
        select: { platformConfig: true },
      });

      const platformConfig = isRecord(row.platformConfig)
        ? { ...row.platformConfig }
        : {};
      const rawPrevious = platformConfig.aiRouting;
      const previous = rawPrevious === undefined
        ? { version: 1, models: [], routes: [] }
        : aiRoutingConfigSchema.parse(rawPrevious);

      if (nextConfig.version !== previous.version + 1) {
        throw new ApiError(
          `AI routing configuration changed; reload before saving. Expected version ${previous.version + 1}.`,
          409,
        );
      }

      platformConfig.aiRouting = nextConfig;

      await tx.adminConfiguration.update({
        where: { id: CONFIG_ID },
        data: { platformConfig: platformConfig as Prisma.InputJsonValue },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "AI_ROUTING_CONFIG_UPDATED",
          resource: "AdminConfiguration:aiRouting",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            fromVersion: previous.version,
            toVersion: nextConfig.version,
            modelRegistrySize: nextConfig.models.length,
            routeCount: nextConfig.routes.length,
            reason: payload.reason || null,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
    });

    return NextResponse.json({
      success: true,
      config: nextConfig,
      providers: getProviderStatusSummary(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
