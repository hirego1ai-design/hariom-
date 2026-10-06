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
import { prisma } from "@/lib/prisma";
import {
  candidateJarvisConfigSchema,
  readCandidateJarvisConfig,
  isCandidateJarvisVoiceRuntimeConfigured,
} from "@/lib/jarvis/CandidateJarvisConfig";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const updateSchema = z.object({
  config: candidateJarvisConfigSchema,
  reason: z.string().trim().min(3).max(500),
  expectedUpdatedAt: z.string().datetime().nullable(),
}).strict();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_jarvis_read:${admin.id}`, 60, 60_000);

    const row = await prisma.adminConfiguration.findUnique({
      where: { id: "global-admin-config" },
      select: { platformConfig: true, updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      config: readCandidateJarvisConfig(row?.platformConfig ?? null),
      updatedAt: row?.updatedAt.toISOString() ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_candidate_jarvis_write:${admin.id}`, 12, 60_000);
    const payload = await readValidatedJson(request, updateSchema, 64 * 1024);
    const nextConfig = candidateJarvisConfigSchema.parse(payload.config);
    if (nextConfig.voiceEnabled && !isCandidateJarvisVoiceRuntimeConfigured()) {
      throw new ApiError("HireGo Voice Engine is not ready; Candidate Jarvis voice must remain off.", 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.adminConfiguration.findUnique({
        where: { id: "global-admin-config" },
        select: { platformConfig: true, updatedAt: true },
      });
      if (!current) throw new ApiError("Global admin configuration is missing.", 503);

      const currentUpdatedAt = current.updatedAt.toISOString();
      if (payload.expectedUpdatedAt && payload.expectedUpdatedAt !== currentUpdatedAt) {
        throw new ApiError("Jarvis configuration changed; reload before saving.", 409);
      }

      const platformConfig = isRecord(current.platformConfig)
        ? { ...current.platformConfig }
        : {};
      const previous = readCandidateJarvisConfig(platformConfig);
      platformConfig.candidateJarvis = nextConfig;

      const row = await tx.adminConfiguration.update({
        where: { id: "global-admin-config" },
        data: { platformConfig: platformConfig as Prisma.InputJsonValue },
        select: { updatedAt: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "CANDIDATE_JARVIS_CONFIG_UPDATED",
          resource: "AdminConfiguration:candidateJarvis",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            reason: payload.reason,
            previous,
            next: nextConfig,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);

      return row;
    });

    return NextResponse.json({
      success: true,
      config: nextConfig,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
