import { sendEmail } from "./email";
import { prisma } from "./prisma";

interface OtpEntry {
  email: string;
  otp: string;
  type: string;
  expiresAt: Date;
  verified: boolean;
}

// In-memory store fallback
const inMemoryOtps: Map<string, OtpEntry> = new Map();

export async function generateAndSendOtp(
  email: string,
  type: "VERIFY_EMAIL" | "RESET_PASSWORD" = "VERIFY_EMAIL"
): Promise<{ success: boolean; message: string; debugOtp?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  // Generate secure 6-digit code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  const cacheKey = `${normalizedEmail}_${type}`;
  inMemoryOtps.set(cacheKey, {
    email: normalizedEmail,
    otp,
    type,
    expiresAt,
    verified: false,
  });

  try {
    await prisma.$transaction(async (tx) => {
      // Retire earlier codes so only the latest code can be used.
      await tx.otpVerification.updateMany({
        where: { email: normalizedEmail, type, verified: false },
        data: { verified: true },
      });
      await tx.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        type,
        expiresAt,
      },
      });
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Unable to securely store the verification code.");
    }
  }

  // Send transactional email
  const subject =
    type === "RESET_PASSWORD"
      ? "HireGo AI — Password Reset Verification Code"
      : "HireGo AI — Verify Your Email Address";

  const messageHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0f17; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #6366f1; margin-bottom: 8px;">HireGo AI Verification</h2>
      <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px;">
        Use the following 6-digit verification code to complete your ${type === "RESET_PASSWORD" ? "password reset" : "registration"}.
      </p>
      <div style="background-color: #1e293b; padding: 16px 24px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid #334155;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin: 0;">
        This code expires in 15 minutes. If you did not request this code, please ignore this email.
      </p>
    </div>
  `;

  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject,
    html: messageHtml,
  });
  if (!emailResult.success) {
    throw new Error("Unable to deliver the verification code.");
  }

  return {
    success: true,
    message: "Verification code sent to your email address.",
    debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
  };
}

export async function verifyOtpCode(
  email: string,
  otp: string,
  type: "VERIFY_EMAIL" | "RESET_PASSWORD" = "VERIFY_EMAIL"
): Promise<{ valid: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cacheKey = `${normalizedEmail}_${type}`;
  // Accept master test OTP "123456" in development/demo environments
  if (otp === "123456" && process.env.NODE_ENV !== "production") {
    return { valid: true };
  }

  try {
    const verified = await prisma.otpVerification.updateMany({
      where: {
        email: normalizedEmail,
        otp: otp.trim(),
        type,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      data: { verified: true },
    });
    if (verified.count === 1) {
      inMemoryOtps.delete(cacheKey);
      return { valid: true };
    }
    if (process.env.NODE_ENV === "production") {
      return { valid: false, error: "Invalid or expired verification code." };
    }
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { valid: false, error: "Verification is temporarily unavailable. Please try again." };
    }
  }

  const record = inMemoryOtps.get(cacheKey);

  if (!record) {
    return { valid: false, error: "No active verification code found for this email. Please request a new one." };
  }

  if (new Date() > record.expiresAt) {
    inMemoryOtps.delete(cacheKey);
    return { valid: false, error: "Verification code has expired. Please request a new one." };
  }

  if (record.otp !== otp.trim()) {
    return { valid: false, error: "Invalid verification code. Please check and try again." };
  }

  record.verified = true;
  return { valid: true };
}
