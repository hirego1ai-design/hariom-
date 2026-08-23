import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtpCode } from "@/lib/otp";
import { db } from "@/lib/prisma";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getDevEmployer, markDevEmployerVerified } from "@/lib/dev-employer-store";

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
  type: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]).default("VERIFY_EMAIL"),
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "auth_verify_otp");
    const body = await readValidatedJson(request, verifyOtpSchema);

    const verification = await verifyOtpCode(body.email, body.otp, body.type);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    const user = await db.findUserByEmail(body.email) || getDevEmployer(body.email);
    if (user && body.type === "VERIFY_EMAIL") {
      const { prisma } = await import("@/lib/prisma");
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }).catch(() => undefined);
      markDevEmployerVerified(body.email);
    }

    const response = NextResponse.json({
      success: true,
      message: "Verification successful.",
      user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null,
    });

    if (user && body.type === "VERIFY_EMAIL") {
      const token = createSessionToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sessionVersion: "sessionVersion" in user ? user.sessionVersion : 0,
      });

      response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
