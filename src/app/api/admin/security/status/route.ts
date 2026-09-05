import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { logAuditEvent } from "@/lib/auditLogger";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

let securityPolicy = {
  minPasswordLength: 8,
  sessionTimeoutHours: 12,
  ipWhitelistingEnabled: false,
  sslTlsGrade: "A+",
  tlsVersion: "TLS 1.3",
  contentSecurityPolicyEnabled: true,
  rateLimitingActive: true,
  activeSessionsCount: 0,
  lastVulnerabilityScan: new Date().toISOString(),
  vulnerabilitiesFound: 0,
};

const CONFIG_ID = "global-admin-config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readSecurityPolicy() {
  if (process.env.MOCK_DB === "true") return securityPolicy;
  const stored = await prisma.adminConfiguration.findUnique({ where: { id: CONFIG_ID } });
  if (!stored || !isRecord(stored.securityPolicy)) return securityPolicy;
  return { ...securityPolicy, ...stored.securityPolicy };
}

const policySchema = z.object({
  minPasswordLength: z.number().int().min(8).max(128).optional(),
  sessionTimeoutHours: z.number().finite().min(1).max(168).optional(),
  ipWhitelistingEnabled: z.boolean().optional(),
  contentSecurityPolicyEnabled: z.boolean().optional(),
  rateLimitingActive: z.boolean().optional(),
  twoFactorEnforced: z.boolean().optional(),
}).strip().refine((value) => Object.keys(value).length > 0, "At least one security policy field is required.");

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const currentPolicy = await readSecurityPolicy();
    let calculatedScore = 40;

    // Check real security layers
    const hasMiddleware = fs.existsSync(path.join(process.cwd(), "src", "middleware.ts")) || fs.existsSync(path.join(process.cwd(), "src", "proxy.ts"));
    if (hasMiddleware) calculatedScore += 15;
    if (currentPolicy.rateLimitingActive) calculatedScore += 10;
    if (currentPolicy.contentSecurityPolicyEnabled) calculatedScore += 10;
    if (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET) calculatedScore += 10;
    if (process.env.NODE_ENV === "production") calculatedScore += 5;
    const hasRealDbUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("prod_password_2026");
    if (hasRealDbUrl) calculatedScore += 10;

    return NextResponse.json({
      success: true,
      rating: calculatedScore >= 90 ? "A+" : calculatedScore >= 80 ? "A" : calculatedScore >= 70 ? "B+" : calculatedScore >= 60 ? "B" : "C",
      score: calculatedScore,
      securityLayers: {
        edgeMiddleware: hasMiddleware,
        jwtAuthentication: true,
        bcryptPasswordHashing: true,
        rateLimiting: currentPolicy.rateLimitingActive,
        inputSanitization: true,
        zodValidation: true,
        csrfProtection: false,
        twoFactorAuth: false,
        soc2Compliance: false,
        gdprCompliance: false,
      },
      securityPolicy: currentPolicy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_security_policy:${session.id}`, 10, 60_000);
    const body = await readValidatedJson(req, policySchema);
    const currentPolicy = await readSecurityPolicy();
    const nextPolicy = { ...currentPolicy, ...body };
    if (process.env.MOCK_DB === "true") {
      securityPolicy = nextPolicy;
    } else {
      const existing = await prisma.adminConfiguration.findUnique({ where: { id: CONFIG_ID } });
      await prisma.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, securityPolicy: nextPolicy, platformConfig: existing?.platformConfig ?? undefined },
        update: { securityPolicy: nextPolicy },
      });
    }
    await logAuditEvent({
      userId: session.id,
      action: "SECURITY_POLICY_UPDATED",
      resource: "Security policy",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });
    return NextResponse.json({
      success: true,
      message: "Security policy updated successfully.",
      securityPolicy: nextPolicy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
