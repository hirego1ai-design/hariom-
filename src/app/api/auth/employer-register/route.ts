import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { generateAndSendOtp } from "@/lib/otp";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { referralDb } from "@/lib/referral-db";

const schema = z.object({
  companyName: z.string().min(2), email: z.string().email(), industry: z.string().min(2), companySize: z.string().min(1),
  password: z.string().min(8), confirmPassword: z.string().min(8),
  referralCode: z.string().trim().toUpperCase().optional(),
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "employer_register");
    const body = await readValidatedJson(request, schema);
    const passwordStrength = validatePasswordStrength(body.password);
    if (!passwordStrength.valid) {
      return NextResponse.json({ success: false, error: passwordStrength.message }, { status: 422 });
    }
    const email = body.email.toLowerCase().trim();
    const referralCode = body.referralCode?.trim().toUpperCase() || null;

    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    // Validate referral code BEFORE creating user (fail fast, no side effects)
    let referrerId: string | null = null;
    if (referralCode) {
      referrerId = await referralDb.resolveReferralCode(referralCode);
      // Invalid code is non-blocking — registration proceeds, attribution is skipped
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({ data: { email, passwordHash, name: body.companyName, role: "EMPLOYER", emailVerified: false } });
      const company = await tx.company.create({ data: { name: body.companyName, industry: body.industry, size: body.companySize } });
      await tx.employerProfile.create({ data: { userId: createdUser.id, companyId: company.id } });
      await tx.companyCredits.create({ data: { companyId: company.id, jobPostsLeft: 5, resumeUnlocksLeft: 25, aiInterviewsLeft: 5, aiAgentCreditsLeft: 0 } });
      // Every company gets an explicit hard budget. A missing budget must never
      // be interpreted as permission to spend without a ceiling.
      await tx.aiCompanyBudget.create({
        data: {
          companyId: company.id,
          currency: "INR",
          monthlyLimitMinorUnits: BigInt(5_000_000),
          isHardCapEnabled: true,
        },
      });
      return { createdUser, companyId: company.id };
    }, { maxWait: 10_000, timeout: 20_000 });

    // Create referral attribution OUTSIDE transaction — non-critical, must not block registration
    if (referrerId && referralCode) {
      try {
        await referralDb.createAttribution({
          referrerId,
          referralCode,
          referredUserId: user.createdUser.id,
          referredCompanyId: undefined,
          attributionSource: "EMPLOYER_REGISTRATION",
          userType: "EMPLOYER",
          metadata: { registeredEmail: email, companyName: body.companyName },
        });
      } catch {
        // Attribution failure must never block account creation
      }
    }

    const otp = await generateAndSendOtp(email, "VERIFY_EMAIL");
    return NextResponse.json({
      success: true,
      email,
      userId: user.createdUser.id,
      message: otp.message,
      debugOtp: otp.debugOtp,
      referralApplied: !!(referrerId && referralCode),
    });
  } catch (error) { return handleApiError(error); }
}
