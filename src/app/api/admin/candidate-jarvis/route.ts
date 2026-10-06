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
import { getHireGoVoiceCapabilities } from "@/lib/voice/HireGoVoiceEngine";

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

    const config = readCandidateJarvisConfig(row?.platformConfig ?? null);
    let voiceRuntime: { ready: boolean; stt: boolean; tts: boolean; workerVersion: string | null } = {
      ready: false,
      stt: false,
      tts: false,
      workerVersion: null,
    };
    if (isCandidateJarvisVoiceRuntimeConfigured()) {
      try {
        const capabilities = await getHireGoVoiceCapabilities(4_000);
        voiceRuntime = {
          ready: capabilities.stt.ready && capabilities.tts.ready,
          stt: capabilities.stt.ready,
          tts: capabilities.tts.ready,
          workerVersion: capabilities.workerVersion,
        };
      } catch {
        voiceRuntime = { ready: false, stt: false, tts: false, workerVersion: null };
      }
    }

    return NextResponse.json({
      success: true,
      config,
      voiceRuntime,
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
    if (nextConfig.voiceEnabled) {
      if (!isCandidateJarvisVoiceRuntimeConfigured()) {
        throw new ApiError("HireGo Voice Engine is not configured; Candidate Jarvis voice must remain off.", 409);
      }
      try {
        const capabilities = await getHireGoVoiceCapabilities(5_000);
        if (!capabilities.stt.ready || !capabilities.tts.ready) {
          throw new Error("Voice capabilities are incomplete.");
        }
      } catch {
        throw new ApiError("HireGo Voice Engine did not pass live STT/TTS readiness; Candidate Jarvis voice must remain off.", 409);
      }
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
