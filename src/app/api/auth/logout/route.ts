import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(request: Request) {
  const session = getCurrentSession(request.headers);

  if (session) {
    logAuditEvent({
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
}
