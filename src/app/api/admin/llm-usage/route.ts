import { NextRequest, NextResponse } from "next/server";
import { getAiUsageStats } from "@/utils";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getAiRoutingConfig, getProviderStatusSummary } from "@/lib/ai/AiRoutingConfig";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_llm_usage:${admin.id}`, 30, 60_000);

    const [config, stats] = await Promise.all([
      getAiRoutingConfig(),
      getAiUsageStats(),
    ]);

    return NextResponse.json({
      success: true,
      config,
      providers: getProviderStatusSummary(),
      telemetry: {
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        knownTokens: stats.knownTokens,
        tokenCoverageRate: stats.tokenCoverageRate,
        totalCostUsd: stats.totalCostUsd,
        knownCostUsd: stats.knownCostUsd,
        costCoverageRate: stats.costCoverageRate,
        avgLatencyMs: stats.avgLatencyMs,
        providerCounts: stats.providerCounts,
        modelStats: stats.modelStats,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
