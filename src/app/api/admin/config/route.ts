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
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const CONFIG_ID = "global-admin-config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const platformControlSchema = z.object({
  managedHiringEnabled: z.boolean().optional(),
  aiCopilotEnabled: z.boolean().optional(),
  proctoringEnabled: z.boolean().optional(),
  autoInvoicingEnabled: z.boolean().optional(),
  replacementWarrantyEnabled: z.boolean().optional(),
  slabPricingEnabled: z.boolean().optional(),
  maxActiveRequirementsPerCompany: z.number().int().min(1).max(100_000).optional(),
  slaResponseHours: z.number().int().min(1).max(8_760).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  "At least one platform control is required.",
);

const updateSchema = z.object({
  config: platformControlSchema,
  expectedUpdatedAt: z.string().datetime().nullable(),
  reason: z.string().trim().min(3).max(500),
}).strict();

function presentPlatformConfig(
  stored: { platformConfig: Prisma.JsonValue | null; updatedAt: Date } | null,
) {
  const raw = stored && isRecord(stored.platformConfig)
    ? stored.platformConfig
    : {};

  return {
    managedHiringEnabled:
      typeof raw.managedHiringEnabled === "boolean"
        ? raw.managedHiringEnabled
        : undefined,
    aiCopilotEnabled:
      typeof raw.aiCopilotEnabled === "boolean" ? raw.aiCopilotEnabled : undefined,
    proctoringEnabled:
      typeof raw.proctoringEnabled === "boolean" ? raw.proctoringEnabled : undefined,
    autoInvoicingEnabled:
      typeof raw.autoInvoicingEnabled === "boolean"
        ? raw.autoInvoicingEnabled
        : undefined,
    replacementWarrantyEnabled:
      typeof raw.replacementWarrantyEnabled === "boolean"
        ? raw.replacementWarrantyEnabled
        : undefined,
    slabPricingEnabled:
      typeof raw.slabPricingEnabled === "boolean"
        ? raw.slabPricingEnabled
        : undefined,
    maxActiveRequirementsPerCompany:
      typeof raw.maxActiveRequirementsPerCompany === "number"
        ? raw.maxActiveRequirementsPerCompany
        : undefined,
    slaResponseHours:
      typeof raw.slaResponseHours === "number" ? raw.slaResponseHours : undefined,
    lastUpdated: stored?.updatedAt.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_platform_config_read:${admin.id}`,
      30,
      60_000,
    );

    const stored = await prisma.adminConfiguration.findUnique({
      where: { id: CONFIG_ID },
      select: { platformConfig: true, updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      configured: Boolean(stored),
      config: presentPlatformConfig(stored),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_platform_config_write:${admin.id}`,
      10,
      60_000,
    );

    const input = await readValidatedJson(request, updateSchema, 16 * 1024);

    await prisma.$transaction(async (tx) => {
      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platformConfig: {} },
        update: {},
      });

      await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
      const stored = await tx.adminConfiguration.findUniqueOrThrow({
        where: { id: CONFIG_ID },
        select: { platformConfig: true, updatedAt: true },
      });

      const currentVersion = stored.updatedAt.toISOString();
      if (currentVersion !== input.expectedUpdatedAt) {
        throw new ApiError(
          "Platform configuration changed; reload before saving.",
          409,
        );
      }

      const current = isRecord(stored.platformConfig)
        ? { ...stored.platformConfig }
        : {};
      const next = {
        ...current,
        ...input.config,
      };

      await tx.adminConfiguration.update({
        where: { id: CONFIG_ID },
        data: { platformConfig: next as Prisma.InputJsonValue },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "ADMIN_PLATFORM_CONTROLS_UPDATED",
          resource: "Platform Configuration",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            changedKeys: Object.keys(input.config).sort(),
            reason: input.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);
    });

    const updated = await prisma.adminConfiguration.findUniqueOrThrow({
      where: { id: CONFIG_ID },
      select: { platformConfig: true, updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      message: "Platform controls updated and audited.",
      config: presentPlatformConfig(updated),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
