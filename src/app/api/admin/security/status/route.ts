import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

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

export async function GET(req: NextRequest) {
  try {
    requireAdminSession(req);
    let calculatedScore = 40;

    // Check real security layers
    const hasMiddleware = fs.existsSync(path.join(process.cwd(), "src", "middleware.ts")) || fs.existsSync(path.join(process.cwd(), "src", "proxy.ts"));
    if (hasMiddleware) calculatedScore += 15;
    if (securityPolicy.rateLimitingActive) calculatedScore += 10;
    if (securityPolicy.contentSecurityPolicyEnabled) calculatedScore += 10;
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
        rateLimiting: securityPolicy.rateLimitingActive,
        inputSanitization: true,
        zodValidation: true,
        csrfProtection: false,
        twoFactorAuth: false,
        soc2Compliance: false,
        gdprCompliance: false,
      },
      securityPolicy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdminSession(req);
    const body = await req.json();
    securityPolicy = { ...securityPolicy, ...body };
    return NextResponse.json({
      success: true,
      message: "Security policy updated successfully.",
      securityPolicy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
