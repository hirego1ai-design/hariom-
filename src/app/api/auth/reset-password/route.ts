import { NextResponse } from "next/server";
import { z } from "zod";
import { db, prisma } from "@/lib/prisma";
import { verifyOtpCode } from "@/lib/otp";
import { hashPassword, revokeAllUserSessions, validatePasswordStrength } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logCriticalAuditEvent } from "@/lib/auditLogger";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(4, "OTP code is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "auth_reset_password");
    const body = await readValidatedJson(request, resetPasswordSchema);

    const otpValidation = await verifyOtpCode(body.email, body.otp, "RESET_PASSWORD");
    if (!otpValidation.valid) {
      return NextResponse.json(
        { success: false, error: otpValidation.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    const strengthCheck = validatePasswordStrength(body.newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { success: false, error: strengthCheck.message || "Password does not meet complexity requirements." },
        { status: 400 }
      );
    }

    const user = await db.findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    const newHashed = hashPassword(body.newPassword);

    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHashed, sessionVersion: { increment: 1 } },
        select: { sessionVersion: true },
      });
      await revokeAllUserSessions(user.id, updatedUser.sessionVersion);
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to update password. Please try again later.");
      }
      (user as any).passwordHash = newHashed;
    }

    await logCriticalAuditEvent({
      userId: user.id,
      action: "PASSWORD_RESET_SUCCESS",
      resource: "/api/auth/reset-password",
      details: `Password reset successfully for ${user.email}`,
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. Please log in with your new password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
