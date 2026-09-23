import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { getAuditLogs, logAuditEvent } from "@/lib/auditLogger";

const CONFIG_ID = "global-admin-config";

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

function mapManagedHiringAuditLogs(logs: Awaited<ReturnType<typeof getAuditLogs>>) {
  return logs
    .filter((log) => log.resource === "Managed Hiring Configuration")
    .map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminUser: log.userId || "system",
      adminRole: "Administrator",
      category: "Configuration",
      action: log.action,
      oldValue: "redacted",
      newValue: "updated",
      reason: log.details || "Configuration update",
    }));
}

async function readManagedHiringConfig() {
  const stored = await prisma.adminConfiguration.findUnique({ where: { id: CONFIG_ID } });
  return isRecord(stored?.managedHiringConfig) ? stored.managedHiringConfig : {};
}

export async function GET(req: Request) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_managed_hiring_config_read", 30, 60_000);

    const [config, persistedLogs] = await Promise.all([
      readManagedHiringConfig(),
      getAuditLogs(200),
    ]);

    return NextResponse.json({
      success: true,
      configured: Object.keys(config).length > 0,
      config,
      auditLogs: mapManagedHiringAuditLogs(persistedLogs),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const managedHiringUpdateSchema = z.object({
  updatedConfig: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  auditEntry: z.object({
    category: z.enum(["Pricing", "Invoice Milestone", "Replacement", "Credit Policy", "Contract Profile", "Approval Workflow"]).optional(),
    action: z.string().trim().min(1).max(200).optional(),
    oldValue: z.string().trim().max(500).optional(),
    newValue: z.string().trim().max(500).optional(),
    reason: z.string().trim().min(3).max(1000).optional(),
  }).strict().optional(),
  reason: z.string().trim().min(3).max(1000).optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.updatedConfig && !value.config) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Managed hiring configuration is required." });
  }
  if (value.updatedConfig && value.config) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide only one configuration field." });
  }
});

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, "admin_managed_hiring_config_write", 10, 60_000);
    const { updatedConfig, config, auditEntry, reason } = await readValidatedJson(req, managedHiringUpdateSchema);

    const payloadConfig = updatedConfig || config;
    if (!payloadConfig || typeof payloadConfig !== "object" || Array.isArray(payloadConfig)) {
      throw new ApiError("Managed hiring configuration is required", 400);
    }

    const configKeys = Object.keys(payloadConfig);
    if (configKeys.some((key) => !ALLOWED_CONFIG_KEYS.has(key) || ["__proto__", "prototype", "constructor", "lastUpdated"].includes(key))) {
      throw new ApiError("Unknown or protected managed hiring configuration section", 400);
    }

    const encoded = JSON.stringify(payloadConfig);
    if (encoded.length > 100_000) {
      throw new ApiError("Managed hiring configuration payload is too large", 413);
    }

    const current = await readManagedHiringConfig();
    const nextConfig = {
      ...current,
      ...payloadConfig,
      lastUpdated: new Date().toISOString(),
    };

    await prisma.adminConfiguration.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, managedHiringConfig: nextConfig },
      update: { managedHiringConfig: nextConfig },
    });

    const action = auditEntry?.action || "Managed hiring configuration updated";
    const auditReason = auditEntry?.reason || reason || "Managed hiring configuration updated through the admin console.";

    await logAuditEvent({
      userId: session.id,
      action,
      resource: "Managed Hiring Configuration",
      details: auditReason,
    });

    const responseLogs = mapManagedHiringAuditLogs(await getAuditLogs(200));

    return NextResponse.json({
      success: true,
      message: "Managed hiring configuration saved and audit logged successfully.",
      config: nextConfig,
      auditLogs: responseLogs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
