import { NextResponse } from "next/server";
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
const RESOURCE = "Managed Hiring Configuration";

const ALLOWED_CONFIG_KEYS = new Set([
  "frameworkName",
  "version",
  "pricing",
  "agreements",
  "invoicing",
  "warranty",
  "creditsAndDeposits",
  "approvals",
  "invoiceRule",
  "replacement",
  "advance",
  "credit",
  "volumeTiers",
  "contractProfiles",
  "approvalWorkflow",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function versionOf(config: Record<string, unknown>): string | null {
  return typeof config.lastUpdated === "string" ? config.lastUpdated : null;
}

function validateConfigPayload(payload: Record<string, unknown>) {
  const keys = Object.keys(payload);
  if (
    keys.some(
      (key) =>
        !ALLOWED_CONFIG_KEYS.has(key) ||
        ["__proto__", "prototype", "constructor", "lastUpdated"].includes(key),
    )
  ) {
    throw new ApiError("Unknown or protected managed hiring configuration section.", 400);
  }

  if (JSON.stringify(payload).length > 100_000) {
    throw new ApiError("Managed hiring configuration payload is too large.", 413);
  }
}

async function recentAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    where: { resource: RESOURCE },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      userId: true,
      action: true,
      details: true,
      createdAt: true,
    },
  });

  return logs.map((log) => {
    let details: Record<string, unknown> = {};
    try {
      const parsed = log.details ? JSON.parse(log.details) : {};
      if (isRecord(parsed)) details = parsed;
    } catch {
      details = { reason: log.details || null };
    }

    return {
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      adminUser: log.userId || "system",
      adminRole: "Administrator",
      category:
        typeof details.category === "string" ? details.category : "Configuration",
      action: log.action,
      oldValue: "redacted",
      newValue: "updated",
      reason:
        typeof details.reason === "string" ? details.reason : "Configuration update",
      changedSections: Array.isArray(details.changedSections)
        ? details.changedSections.filter((item): item is string => typeof item === "string")
        : [],
    };
  });
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_managed_hiring_config_read:${admin.id}`,
      30,
      60_000,
    );

    const [stored, auditLogs] = await Promise.all([
      prisma.adminConfiguration.findUnique({
        where: { id: CONFIG_ID },
        select: { managedHiringConfig: true },
      }),
      recentAuditLogs(),
    ]);

    const config = isRecord(stored?.managedHiringConfig)
      ? stored.managedHiringConfig
      : {};

    return NextResponse.json({
      success: true,
      configured: Object.keys(config).length > 0,
      config,
      configUpdatedAt: versionOf(config),
      auditLogs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const managedHiringUpdateSchema = z.object({
  updatedConfig: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  expectedUpdatedAt: z.string().datetime().nullable(),
  reason: z.string().trim().min(3).max(1000),
  auditEntry: z.object({
    category: z.enum([
      "Pricing",
      "Invoice Milestone",
      "Replacement",
      "Credit Policy",
      "Contract Profile",
      "Approval Workflow",
      "Configuration",
    ]).optional(),
    action: z.string().trim().min(1).max(200).optional(),
  }).strict().optional(),
}).strict().superRefine((value, context) => {
  if (!value.updatedConfig && !value.config) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Managed hiring configuration is required.",
    });
  }
  if (value.updatedConfig && value.config) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide only one configuration field.",
    });
  }
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_managed_hiring_config_write:${admin.id}`,
      10,
      60_000,
    );

    const body = await readValidatedJson(
      request,
      managedHiringUpdateSchema,
      128 * 1024,
    );
    const payloadConfig = body.updatedConfig || body.config;
    if (!payloadConfig || !isRecord(payloadConfig)) {
      throw new ApiError("Managed hiring configuration is required.", 400);
    }
    validateConfigPayload(payloadConfig);

    const nextConfig = await prisma.$transaction(async (tx) => {
      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, managedHiringConfig: {} },
        update: {},
      });

      await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;

      const stored = await tx.adminConfiguration.findUniqueOrThrow({
        where: { id: CONFIG_ID },
        select: { managedHiringConfig: true },
      });
      const current = isRecord(stored.managedHiringConfig)
        ? stored.managedHiringConfig
        : {};
      const currentVersion = versionOf(current);

      if (currentVersion !== body.expectedUpdatedAt) {
        throw new ApiError(
          "Managed hiring configuration changed; reload before saving.",
          409,
        );
      }

      const next: Record<string, unknown> = {
        ...current,
        ...payloadConfig,
        lastUpdated: new Date().toISOString(),
      };

      await tx.adminConfiguration.update({
        where: { id: CONFIG_ID },
        data: {
          managedHiringConfig: next as Prisma.InputJsonValue,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action:
            body.auditEntry?.action || "MANAGED_HIRING_CONFIGURATION_UPDATED",
          resource: RESOURCE,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            category: body.auditEntry?.category || "Configuration",
            reason: body.reason,
            changedSections: Object.keys(payloadConfig).sort(),
            configUpdatedAt: next.lastUpdated,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return next;
    });

    return NextResponse.json({
      success: true,
      message: "Managed hiring configuration saved and audited.",
      config: nextConfig,
      configUpdatedAt: versionOf(nextConfig),
      auditLogs: await recentAuditLogs(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
