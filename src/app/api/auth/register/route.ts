import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { referralDb } from "@/lib/referral-db";
import { generateAndSendOtp } from "@/lib/otp";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  referralCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "auth_register");
    const body = await readValidatedJson(request, registerSchema);
    const passwordStrength = validatePasswordStrength(body.password);
    if (!passwordStrength.valid) {
      return NextResponse.json({ success: false, error: passwordStrength.message }, { status: 422 });
    }

    const existing = await db.findUserByEmail(body.email);
    if (existing) {
      if ("emailVerified" in existing && existing.emailVerified === false) {
        const otpResult = await generateAndSendOtp(existing.email, "VERIFY_EMAIL");
        return NextResponse.json({
          success: true,
          user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role },
          message: otpResult.message,
          debugOtp: otpResult.debugOtp,
        });
      }
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
      role: "CANDIDATE",
    });

    // Referral Attribution Capture (Rule 11, 12, 13)
    let refCode = body.referralCode;
    if (!refCode) {
      // Check for cookie header
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const refCookie = cookies.find((c) => c.startsWith("hirego_ref="));
        if (refCookie) {
          refCode = refCookie.split("=")[1];
        }
      }
    }

    if (refCode) {
      try {
        const referrerId = await referralDb.resolveReferralCode(refCode);
        // Ensure no self-referral (Rule 13)
        if (referrerId && referrerId !== user.id) {
          try {
            await referralDb.createAttribution({
              referrerId,
              referredUserId: user.id,
              referredEmail: user.email,
              referralCode: refCode,
              attributionSource: "REGISTRATION",
              userType: user.role,
            });
          } catch (refErr: any) {
            if (refErr?.message?.includes("Self-referral")) {
              await referralDb.evaluateFraudRisk(referrerId, {
                triggers: ["SELF_REFERRAL_ATTEMPT"],
                email: user.email,
              });
            }
            console.warn("[Referral Engine] Attribution creation notice:", refErr?.message);
          }
        }
      } catch (refErr: any) {
        console.warn("[Referral Engine] Attribution lookup notice:", refErr?.message);
      }
    }

    const otpResult = await generateAndSendOtp(user.email, "VERIFY_EMAIL");

    logAuditEvent({
      userId: user.id,
      action: "USER_REGISTER",
      resource: "/api/auth/register",
      details: `Registered new user ${user.email} with role ${user.role}`,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      message: otpResult.message,
      debugOtp: otpResult.debugOtp,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
