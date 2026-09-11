import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentSession, getSessionToken, revokeSessionToken, verifySessionToken } from "@/lib/auth";
import { logCriticalAuditEvent } from "@/lib/auditLogger";
import { handleApiError } from "@/lib/apiSecurity";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    const token = getSessionToken(request.headers);

    // Expired or malformed tokens cannot authorize requests. Still clear their
    // browser cookie so an expired session never traps the user in logout errors.
    if (token && verifySessionToken(token)) await revokeSessionToken(token);

    if (session) {
      await logCriticalAuditEvent({
        userId: session.id,
        action: "USER_LOGOUT",
        resource: "/api/auth/logout",
        details: `User ${session.email} logged out`,
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
