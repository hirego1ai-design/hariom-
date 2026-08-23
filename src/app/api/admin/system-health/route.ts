import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
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

    const services = [
      {
        name: "Supabase PostgreSQL Database Pool",
        type: "DATABASE",
        provider: "Supabase (AWS ap-south-1)",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        details: dbStatus === "HEALTHY" ? "Database query succeeded." : "Database query failed; no in-memory fallback is used.",
      },
      {
        name: "Cloudflare R2 Object Storage",
        type: "STORAGE",
        provider: "Cloudflare R2",
        status: process.env.S3_BUCKET_NAME && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
        bucketName: process.env.S3_BUCKET_NAME || null,
        details: "Credentials are configured; a storage probe is not performed by this endpoint.",
      },
      {
        name: "Upstash Redis Queue & Cache",
        type: "CACHE",
        provider: "Upstash Redis",
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
        name: "Multi-LLM Router Gateway",
        type: "AI_GATEWAY",
        provider: "OpenAI",
        status: process.env.OPENAI_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
        details: process.env.OPENAI_API_KEY ? "API key is configured; no model call is made by this endpoint." : "No AI provider is configured.",
      },
    ];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus: dbStatus === "HEALTHY" ? "HEALTHY" : "DEGRADED",
      services,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
