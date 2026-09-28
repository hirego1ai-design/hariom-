import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const CONFIG_ID = "global-admin-config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readPlatformConfig() {
  const stored = await prisma.adminConfiguration.findUnique({ where: { id: CONFIG_ID } });
  if (!stored || !isRecord(stored.platformConfig)) return {};
  return { ...stored.platformConfig, lastUpdated: stored.updatedAt.toISOString() };
}

// Keep the admin-controlled surface closed: arbitrary keys must not be able to
// masquerade as feature flags or overwrite server-owned metadata.
const configSchema = z.object({
  managedHiringEnabled: z.boolean().optional(),
  aiCopilotEnabled: z.boolean().optional(),
  proctoringEnabled: z.boolean().optional(),
  autoInvoicingEnabled: z.boolean().optional(),
  replacementWarrantyEnabled: z.boolean().optional(),
  slabPricingEnabled: z.boolean().optional(),
  defaultPlacementFeePct: z.number().finite().min(0).max(100).optional(),
  defaultReplacementDays: z.number().int().min(0).max(3650).optional(),
  defaultCreditDays: z.number().int().min(0).max(3650).optional(),
  taxRatePct: z.number().finite().min(0).max(100).optional(),
  currency: z.string().trim().length(3).regex(/^[A-Z]{3}$/).optional(),
  maxActiveRequirementsPerCompany: z.number().int().min(1).max(100_000).optional(),
  slaResponseHours: z.number().int().min(1).max(8_760).optional(),
// Strip read-only metadata such as lastUpdated from the client payload while
// retaining the existing Admin UI contract.
}).strip().refine((value) => Object.keys(value).length > 0, "At least one configuration field is required.");

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_platform_config_read", 30, 60_000);
    const config = await readPlatformConfig();
    return NextResponse.json({
      success: true,
      configured: Object.keys(config).length > 0,
      config,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_platform_config:${session.id}`, 10, 60_000);
    const body = await readValidatedJson(req, configSchema);

    const nextConfig = await prisma.$transaction(async (tx) => {
      const stored = await tx.adminConfiguration.findUnique({ where: { id: CONFIG_ID } });
      const current = stored && isRecord(stored.platformConfig)
        ? { ...stored.platformConfig, lastUpdated: stored.updatedAt.toISOString() }
        : {};
      const updatedConfig = { ...current, ...body, lastUpdated: new Date().toISOString() };

      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platformConfig: updatedConfig },
        update: { platformConfig: updatedConfig },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "ADMIN_CONFIG_UPDATED",
          resource: "Platform Configuration",
          details: `changedKeys:${Object.keys(body).sort().join(",")}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return updatedConfig;
    });

    return NextResponse.json({
      success: true,
      message: "Platform configuration updated successfully.",
      config: nextConfig,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
