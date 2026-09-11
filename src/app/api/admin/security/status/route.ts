import { NextRequest, NextResponse } from "next/server";
import { configuredSecurityHeaders } from "@/lib/securityHeaders";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

/**
 * This endpoint intentionally reports only evidence the application can
 * observe. TLS grades, vulnerability scan results, compliance attestations
 * and active session counts need external scanners or a dedicated telemetry
 * source; reporting invented values for them is materially worse than leaving
 * them unmeasured.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const headers = configuredSecurityHeaders(process.env.NODE_ENV !== "production");

    return NextResponse.json({
      success: true,
      observedAt: new Date().toISOString(),
      posture: "CONFIGURATION_EVIDENCE_ONLY",
      summary: "This view reports application-configured controls. It is not a TLS, vulnerability, compliance, or penetration-test certification.",
      applicationControls: {
        edgeProxy: true,
        contentSecurityPolicy: {
          configured: Boolean(headers["Content-Security-Policy"]),
          mode: "enforced",
          value: headers["Content-Security-Policy"],
        },
        hsts: {
          configured: true,
          value: "max-age=63072000; includeSubDomains; preload",
        },
        clickjackingProtection: headers["X-Frame-Options"] === "DENY",
        mimeSniffingProtection: headers["X-Content-Type-Options"] === "nosniff",
        crossOriginIsolation: headers["Cross-Origin-Opener-Policy"] === "same-origin"
          && headers["Cross-Origin-Resource-Policy"] === "same-origin",
      },
      measurements: {
        tls: { status: "NOT_MEASURED", reason: "Run an external TLS scanner against the deployed hostname." },
        vulnerabilities: { status: "NOT_MEASURED", reason: "Connect an SCA/SAST scanner and persist its signed results." },
        activeSessions: { status: "NOT_MEASURED", reason: "JWT sessions are not a database-backed session inventory." },
        compliance: { status: "NOT_MEASURED", reason: "Compliance requires an independent audit and evidence program." },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * The former endpoint persisted UI switches that did not change deployed
 * headers or infrastructure. Keep an explicit response for existing clients
 * instead of silently presenting a simulated security control as real.
 */
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
