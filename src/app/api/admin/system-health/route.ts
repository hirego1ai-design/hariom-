import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getProviderStatusSummary } from "@/lib/ai/AiRoutingConfig";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_system_health:${admin.id}`, 30, 60_000);
    const memoryUsage = process.memoryUsage();
    
    // DB health check
    let dbStatus: "HEALTHY" | "UNAVAILABLE" = "HEALTHY";
    let dbLatencyMs = 0;
    const dbStartTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStartTime;
    } catch {
      dbStatus = "UNAVAILABLE";
      dbLatencyMs = Date.now() - dbStartTime;
    }

    const aiProviderStatus = getProviderStatusSummary();
    const configuredAiProviders = aiProviderStatus.filter((provider) => provider.configured).map((provider) => provider.provider);
    const storageConfigured = Boolean(
      process.env.S3_BUCKET_NAME &&
      process.env.S3_REGION &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
    );

    const services = [
      {
        name: "PostgreSQL Database",
        type: "DATABASE",
        provider: "PostgreSQL",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        details: dbStatus === "HEALTHY" ? "Database query succeeded." : "Database query failed; no in-memory fallback is used.",
      },
      {
        name: "S3-Compatible Object Storage",
        type: "STORAGE",
        provider: "S3-compatible",
        status: storageConfigured ? "CONFIGURED" : "NOT_CONFIGURED",
        bucketName: process.env.S3_BUCKET_NAME || null,
        details: "Credentials are configured; a storage probe is not performed by this endpoint.",
      },
      {
        name: "Redis Queue & Cache",
        type: "CACHE",
        provider: "Redis REST",
        status: process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? "CONFIGURED" : "NOT_CONFIGURED",
        memoryUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        details: "Credentials are configured; a Redis probe is not performed by this endpoint.",
      },
      {
        name: "Node.js Compute Runtime",
        type: "COMPUTE",
        provider: "Next.js Engine",
        status: "HEALTHY",
        uptimeSeconds: Math.round(process.uptime()),
        memoryHeapMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        details: `Node.js runtime active (${Math.round(memoryUsage.rss / 1024 / 1024)}MB RSS)`,
      },
      {
        name: "AI Provider Gateway",
        type: "AI_GATEWAY",
        provider: configuredAiProviders.length ? configuredAiProviders.join(", ") : "None configured",
        status: configuredAiProviders.length ? "CONFIGURED" : "NOT_CONFIGURED",
        details: configuredAiProviders.length
          ? `${configuredAiProviders.length} AI provider configuration(s) are present; no live model call is made by this endpoint.`
          : "No supported AI provider configuration is present.",
      },
    ];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus: dbStatus === "HEALTHY" ? "APPLICATION_AVAILABLE" : "DEGRADED",
      observedScope: "APPLICATION_RUNTIME_AND_CONFIGURATION",
      services,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
