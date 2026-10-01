/**
 * GET /api/whatsapp/auth/handoff?token=xxx
 *
 * Exchanges a short-lived (5 min) WhatsApp auth handoff token for a
 * standard hirego_session cookie, then redirects to the dashboard.
 *
 * Security:
 * - Token is JWT-signed with JWT_SECRET
 * - 5-minute expiry enforced by JWT
 * - Single-use: jti is consumed on first valid exchange
 * - Redirect target is hardcoded to internal dashboard (no open redirect)
 * - Expired or already-used tokens redirect to /login?error=link_expired
 */

import { NextRequest, NextResponse } from "next/server";
import { consumeHandoffToken } from "@/lib/whatsapp-auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/apiSecurity";

// Approved redirect destinations — prevents open redirect. Assessment
// destinations are built only from validated UUID query parameters.
const ALLOWED_DESTINATIONS: Record<string, string> = {
  dashboard: "/candidate/dashboard",
  jobs: "/candidate/job-search",
  profile: "/candidate/profile",
  default: "/candidate/dashboard",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveDestination(req: NextRequest, dest: string) {
  if (dest === "skill-validation") {
    const assessmentId = req.nextUrl.searchParams.get("assessmentId") || "";
    const applicationId = req.nextUrl.searchParams.get("applicationId") || "";
    if (!UUID_RE.test(assessmentId) || !UUID_RE.test(applicationId)) return ALLOWED_DESTINATIONS.default;
    return `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assessmentId)}&applicationId=${encodeURIComponent(applicationId)}`;
  }
  if (dest === "job-assessment") {
    const assessmentId = req.nextUrl.searchParams.get("assessmentId") || "";
    if (!UUID_RE.test(assessmentId)) return ALLOWED_DESTINATIONS.default;
    return `/assessment/mcq/active?id=${encodeURIComponent(assessmentId)}`;
  }
  return ALLOWED_DESTINATIONS[dest] ?? ALLOWED_DESTINATIONS.default;
}

export async function GET(req: NextRequest) {
  // Rate limit: 10 exchange attempts per minute per IP
  try {
    await enforceRateLimit(req as any, "whatsapp:auth_handoff", 10, 60_000);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get("token");
  const dest = req.nextUrl.searchParams.get("dest") ?? "default";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.nextUrl.origin));
  }

  const result = await consumeHandoffToken(token);

  if (!result.valid) {
    // Redirect to login with a safe, non-sensitive error code
    return NextResponse.redirect(new URL("/login?error=link_expired", req.nextUrl.origin));
  }

  // Issue standard hirego_session cookie
  const redirectPath = resolveDestination(req, dest);
  const response = NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin));

  response.cookies.set(AUTH_COOKIE_NAME, result.sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days — same as normal login
  });

  return response;
}
