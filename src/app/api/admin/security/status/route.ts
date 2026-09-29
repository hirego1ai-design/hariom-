import { NextRequest, NextResponse } from "next/server";
import { configuredSecurityHeaders } from "@/lib/securityHeaders";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

/**
 * Reports application-owned configuration evidence only.
 * External TLS/WAF/SCA/SAST/compliance measurements require independent evidence.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_security_status:${admin.id}`, 30, 60_000);
    const headers = configuredSecurityHeaders(process.env.NODE_ENV !== "production");
    const coop = headers["Cross-Origin-Opener-Policy"] || "";
    const corp = headers["Cross-Origin-Resource-Policy"] || "";
    const coep = headers["Cross-Origin-Embedder-Policy"] || "";
    const browserCrossOriginIsolation =
      coop === "same-origin" && ["require-corp", "credentialless"].includes(coep);

    return NextResponse.json({
      success: true,
      observedAt: new Date().toISOString(),
      posture: "APPLICATION_CONFIGURATION_EVIDENCE_ONLY",
      summary:
        "This view reports application-configured response controls. It is not a live WAF, reverse-proxy, TLS, vulnerability, compliance, or penetration-test certification.",
      applicationControls: {
        contentSecurityPolicy: {
          configured: Boolean(headers["Content-Security-Policy"]),
          mode: "enforced",
          value: headers["Content-Security-Policy"] || "",
        },
        hsts: {
          configured: Boolean(headers["Strict-Transport-Security"]),
          value: headers["Strict-Transport-Security"] || "",
        },
        clickjackingProtection: headers["X-Frame-Options"] === "DENY",
        mimeSniffingProtection: headers["X-Content-Type-Options"] === "nosniff",
        referrerPolicy: {
          configured: Boolean(headers["Referrer-Policy"]),
          value: headers["Referrer-Policy"] || "",
        },
        permissionsPolicy: {
          configured: Boolean(headers["Permissions-Policy"]),
          value: headers["Permissions-Policy"] || "",
        },
        crossOriginPolicies: {
          openerPolicy: coop || null,
          resourcePolicy: corp || null,
          embedderPolicy: coep || null,
          browserIsolationConfigured: browserCrossOriginIsolation,
          reason: browserCrossOriginIsolation
            ? "COOP and COEP configuration supports browser cross-origin isolation."
            : "Browser cross-origin isolation is not claimed because a qualifying COEP policy is not configured.",
        },
      },
      measurements: {
        edgeProxyOrWaf: {
          status: "NOT_MEASURED",
          reason: "Reverse proxy/WAF presence and policy require deployment-platform evidence.",
        },
        tls: {
          status: "NOT_MEASURED",
          reason: "Run an external TLS scanner against the deployed hostname.",
        },
        vulnerabilities: {
          status: "NOT_MEASURED",
          reason: "Use CI/SCA/SAST/secret-scan evidence; no browser-side vulnerability scan is simulated here.",
        },
        activeSessions: {
          status: "NOT_MEASURED",
          reason: "JWT sessions are not a complete database-backed live-session inventory.",
        },
        compliance: {
          status: "NOT_MEASURED",
          reason: "Compliance requires an independent audit and evidence program.",
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_security_policy:${session.id}`, 10, 60_000);
    throw new ApiError(
      "Security posture is read-only. Configure deployed controls through the application configuration and infrastructure change process.",
      409,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
