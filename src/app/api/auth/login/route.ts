import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { createSessionToken, verifyPassword, AUTH_COOKIE_NAME } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  portal: z.enum(["admin", "employer", "candidate"]).optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "auth_login");
    const body = await readValidatedJson(request, loginSchema);

    const user = await db.findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      logAuditEvent({
        userId: user.id,
        action: "USER_LOGIN_FAILED",
        resource: "/api/auth/login",
        details: `Failed login attempt for ${body.email}`,
      });
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if ("emailVerified" in user && user.emailVerified === false) {
      return NextResponse.json(
        { success: false, error: "Verify your email address before signing in.", requiresEmailVerification: true },
        { status: 403 }
      );
    }

    if (body.portal === "admin" && user.role !== "ADMIN") {
      logAuditEvent({
        userId: user.id,
        action: "ADMIN_LOGIN_DENIED",
        resource: "/api/auth/login",
        details: `Non-admin account ${user.email} attempted to access the admin portal`,
      });
      return NextResponse.json(
        { success: false, error: "This account does not have administrator access." },
        { status: 403 }
      );
    }

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logAuditEvent({
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
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
