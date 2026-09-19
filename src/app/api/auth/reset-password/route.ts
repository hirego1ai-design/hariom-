import { NextResponse } from "next/server";
import { z } from "zod";
import { db, prisma } from "@/lib/prisma";
import { verifyOtpCode } from "@/lib/otp";
import { hashPassword, revokeAllUserSessions, validatePasswordStrength } from "@/lib/auth";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, "OTP code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
}).strict();

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

    let newSessionVersion: number;
    try {
      newSessionVersion = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { passwordHash: newHashed, sessionVersion: { increment: 1 } },
          select: { sessionVersion: true },
        });
        const auditLog = await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "PASSWORD_RESET_SUCCESS",
            resource: "/api/auth/reset-password",
            details: `Password reset successfully for ${user.email}`,
            ipAddress: getClientIp(request),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, user.id);
        return updatedUser.sessionVersion;
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to update password. Please try again later.");
      }
      (user as any).passwordHash = newHashed;
      newSessionVersion = ((user as any).sessionVersion || 0) + 1;
    }

    await revokeAllUserSessions(user.id, newSessionVersion).catch((error) => {
      console.error("PASSWORD_RESET_SESSION_CACHE_REFRESH_FAILED", { userId: user.id, error });
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. Please log in with your new password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
