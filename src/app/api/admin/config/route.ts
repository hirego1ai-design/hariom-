import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/auditLogger";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

let platformConfig = {
  // Feature Flags
  managedHiringEnabled: true,
  aiCopilotEnabled: true,
  proctoringEnabled: true,
  autoInvoicingEnabled: true,
  replacementWarrantyEnabled: true,
  slabPricingEnabled: true,

  // Commercial Defaults
  defaultPlacementFeePct: 8.33,
  defaultReplacementDays: 60,
  defaultCreditDays: 15,
  taxRatePct: 18.0,
  currency: "INR",

  // SLA & Limits
  maxActiveRequirementsPerCompany: 10,
  slaResponseHours: 24,
  lastUpdated: new Date().toISOString(),
};

const CONFIG_ID = "global-admin-config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readPlatformConfig() {
  if (process.env.MOCK_DB === "true") return platformConfig;
  const stored = await prisma.adminConfiguration.findUnique({ where: { id: CONFIG_ID } });
  if (!stored || !isRecord(stored.platformConfig)) return platformConfig;
  return { ...platformConfig, ...stored.platformConfig, lastUpdated: stored.updatedAt.toISOString() };
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
    const config = await readPlatformConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_platform_config:${session.id}`, 10, 60_000);
    const body = await readValidatedJson(req, configSchema);

    const current = await readPlatformConfig();
    const nextConfig = { ...current, ...body, lastUpdated: new Date().toISOString() };
    if (process.env.MOCK_DB === "true") {
      platformConfig = nextConfig;
    } else {
      await prisma.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platformConfig: nextConfig },
        update: { platformConfig: nextConfig },
      });
    }

    await logAuditEvent({
      action: "ADMIN_CONFIG_UPDATED",
      resource: "Platform Configuration",
      userId: session.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Platform configuration updated by Super Admin",
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
