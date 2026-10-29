import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { createSessionToken, verifyPassword, AUTH_COOKIE_NAME } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logCriticalAuditEvent } from "@/lib/auditLogger";
import {
  clearLoginProtection,
  getLoginLockRetryAfterSeconds,
  registerFailedLogin,
} from "@/lib/loginProtection";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(320).toLowerCase(),
  password: z.string().min(1, "Password is required").max(200),
  portal: z.enum(["admin", "employer", "candidate"]).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    // Login is a high-value brute-force target; it needs a stricter limit
    // than the general authenticated API default.
    await enforceRateLimit(request, "auth_login", 5, 60_000);
    const body = await readValidatedJson(request, loginSchema);

    const lockRetryAfterSeconds = await getLoginLockRetryAfterSeconds(body.email);
    if (lockRetryAfterSeconds > 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 429, headers: { "Retry-After": String(lockRetryAfterSeconds) } },
      );
    }

    const user = await db.findUserByEmail(body.email);
    if (!user) {
      const retryAfterSeconds = await registerFailedLogin(body.email);
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: retryAfterSeconds > 0 ? 429 : 401, headers: retryAfterSeconds > 0 ? { "Retry-After": String(retryAfterSeconds) } : undefined }
      );
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      const retryAfterSeconds = await registerFailedLogin(body.email);
      await logCriticalAuditEvent({
        userId: user.id,
        action: "USER_LOGIN_FAILED",
        resource: "/api/auth/login",
        details: `Failed login attempt for ${body.email}`,
      });
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: retryAfterSeconds > 0 ? 429 : 401, headers: retryAfterSeconds > 0 ? { "Retry-After": String(retryAfterSeconds) } : undefined }
      );
    }

    if ("emailVerified" in user && user.emailVerified === false) {
      return NextResponse.json(
        { success: false, error: "Verify your email address before signing in.", requiresEmailVerification: true },
        { status: 403 }
      );
    }

    const portalAllowed =
      !body.portal ||
      (body.portal === "admin" && user.role === "ADMIN") ||
      (body.portal === "employer" && ["EMPLOYER", "RECRUITER"].includes(user.role)) ||
      (body.portal === "candidate" && user.role === "CANDIDATE");

    if (!portalAllowed) {
      await logCriticalAuditEvent({
        userId: user.id,
        action: "PORTAL_LOGIN_DENIED",
        resource: "/api/auth/login",
        details: `Role ${user.role} attempted to sign in through the ${body.portal} portal`,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            body.portal === "admin"
              ? "This account does not have administrator access."
              : body.portal === "employer"
                ? "Use an employer or recruiter account to access the employer workspace."
                : "Use a candidate account to access the candidate portal.",
        },
        { status: 403 },
      );
    }

    // A valid credential is the only event that clears account-level failure
    // history. Fail closed if the distributed protection store is unavailable.
    await clearLoginProtection(body.email);

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionVersion: "sessionVersion" in user ? user.sessionVersion : 0,
    });

    await logCriticalAuditEvent({
      userId: user.id,
      action: "USER_LOGIN_SUCCESS",
      resource: "/api/auth/login",
      details: `User ${user.email} logged in successfully`,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Match the 7-day JWT expiry. A longer cookie must never imply that
      // the user still has a valid session after the token has expired.
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
