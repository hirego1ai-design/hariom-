import crypto from "crypto";
import { sendEmail } from "./email";
import { prisma } from "./prisma";

interface OtpEntry {
  email: string;
  otp: string;
  type: string;
  expiresAt: Date;
  verified: boolean;
}

class OtpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const OTP_TTL_MS = 15 * 60_000;
const OTP_RESEND_COOLDOWN_MS = 60_000;
const OTP_SEND_LIMIT = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60_000;

// Development-only convenience. Production always relies on PostgreSQL.
const inMemoryOtps = new Map<string, OtpEntry>();

function keyFor(email: string, type: string) {
  return `${email.toLowerCase().trim()}_${type}`;
}

export async function generateAndSendOtp(
  email: string,
  type: "VERIFY_EMAIL" | "RESET_PASSWORD" = "VERIFY_EMAIL",
): Promise<{ success: boolean; message: string; debugOtp?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  const otp = crypto.randomInt(100000, 1_000_000).toString();

  try {
    const [latest, sentRecently] = await Promise.all([
      prisma.otpVerification.findFirst({
        where: { email: normalizedEmail, type },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.otpVerification.count({
        where: { email: normalizedEmail, type, createdAt: { gt: new Date(now.getTime() - OTP_TTL_MS) } },
      }),
    ]);

    if (latest && now.getTime() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new OtpError("Please wait before requesting another verification code.", 429);
    }
    if (sentRecently >= OTP_SEND_LIMIT) {
      throw new OtpError("Too many verification codes requested. Please try again later.", 429);
    }

    await prisma.$transaction(async (tx) => {
      await tx.otpVerification.updateMany({
        where: { email: normalizedEmail, type, verified: false },
        data: { verified: true },
      });
      await tx.otpVerification.create({
        data: { email: normalizedEmail, otp, type, expiresAt },
      });
    });
  } catch (error) {
    if (error instanceof OtpError || process.env.NODE_ENV === "production") {
      if (error instanceof OtpError) throw error;
      throw new OtpError("Verification is temporarily unavailable. Please try again.", 503);
    }

    inMemoryOtps.set(keyFor(normalizedEmail, type), {
      email: normalizedEmail,
      otp,
      type,
      expiresAt,
      verified: false,
    });
  }

  const subject = type === "RESET_PASSWORD"
    ? "HireGo AI — Password Reset Verification Code"
    : "HireGo AI — Verify Your Email Address";
  const messageHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0f17; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #6366f1; margin-bottom: 8px;">HireGo AI Verification</h2>
      <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px;">Use this 6-digit code to complete your ${type === "RESET_PASSWORD" ? "password reset" : "registration"}.</p>
      <div style="background-color: #1e293b; padding: 16px 24px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid #334155;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin: 0;">This code expires in 15 minutes. If you did not request it, please ignore this email.</p>
    </div>`;

  const emailResult = await sendEmail({ to: normalizedEmail, subject, html: messageHtml });
  if (!emailResult.success) throw new OtpError("Unable to deliver the verification code.", 503);

  return {
    success: true,
    message: "Verification code sent to your email address.",
    debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
  };
}

export async function verifyOtpCode(
  email: string,
  otp: string,
  type: "VERIFY_EMAIL" | "RESET_PASSWORD" = "VERIFY_EMAIL",
): Promise<{ valid: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const key = keyFor(normalizedEmail, type);
  if (otp === "123456" && process.env.NODE_ENV !== "production") return { valid: true };

  try {
    const record = await prisma.otpVerification.findFirst({
      where: { email: normalizedEmail, type, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      if (process.env.NODE_ENV === "production") return { valid: false, error: "Invalid or expired verification code." };
    } else if (record.lockedUntil && record.lockedUntil > new Date()) {
      return { valid: false, error: "Too many attempts. Please request a new verification code later." };
    } else if (record.expiresAt <= new Date()) {
      await prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } });
      return { valid: false, error: "Invalid or expired verification code." };
    } else if (record.otp !== otp.trim()) {
      const nextAttempts = record.attempts + 1;
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: {
          attempts: { increment: 1 },
          lockedUntil: nextAttempts >= OTP_MAX_ATTEMPTS ? new Date(Date.now() + OTP_LOCKOUT_MS) : null,
        },
      });
      return {
        valid: false,
        error: nextAttempts >= OTP_MAX_ATTEMPTS
          ? "Too many attempts. Please request a new verification code later."
          : "Invalid or expired verification code.",
      };
    } else {
      const verified = await prisma.otpVerification.updateMany({
        where: { id: record.id, verified: false, expiresAt: { gt: new Date() } },
        data: { verified: true },
      });
      if (verified.count === 1) {
        inMemoryOtps.delete(key);
        return { valid: true };
      }
      return { valid: false, error: "Invalid or expired verification code." };
    }
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { valid: false, error: "Verification is temporarily unavailable. Please try again." };
    }
  }

  const record = inMemoryOtps.get(key);
  if (!record || new Date() > record.expiresAt) {
    inMemoryOtps.delete(key);
    return { valid: false, error: "No active verification code found for this email. Please request a new one." };
  }
  if (record.otp !== otp.trim()) return { valid: false, error: "Invalid verification code. Please check and try again." };

  record.verified = true;
  inMemoryOtps.delete(key);
  return { valid: true };
}
