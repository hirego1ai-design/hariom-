import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { createSessionToken, hashPassword, AUTH_COOKIE_NAME } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["CANDIDATE", "EMPLOYER", "RECRUITER", "ADMIN"]).default("CANDIDATE"),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "auth_register");
    const body = await readValidatedJson(request, registerSchema);

    const existing = await db.findUserByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(body.password);
    const user = await db.createUser({
      email: body.email,
      passwordHash: hashedPassword,
      name: body.name,
      role: body.role,
    });

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logAuditEvent({
      userId: user.id,
      action: "USER_REGISTER",
      resource: "/api/auth/register",
      details: `Registered new user ${user.email} with role ${user.role}`,
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
