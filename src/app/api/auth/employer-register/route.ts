import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { generateAndSendOtp } from "@/lib/otp";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { referralDb } from "@/lib/referral-db";

const schema = z.object({
  companyName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320).toLowerCase(),
  industry: z.string().trim().min(2).max(120),
  companySize: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(200),
  confirmPassword: z.string().min(8).max(200),
  referralCode: z.string().trim().toUpperCase().max(100).optional(),
}).strict().refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

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
      // New workspaces start with zero commercial entitlements. Plan checkout
      // applies the authoritative admin-managed quota snapshot.
      await tx.companyCredits.create({
        data: {
          companyId: company.id,
          jobPostsLeft: 0,
          resumeUnlocksLeft: 0,
          aiInterviewsLeft: 0,
          aiAgentCreditsLeft: 0,
          applicationsLeft: 0,
          resumeDownloadsLeft: 0,
          backgroundVerificationsLeft: 0,
          copilotJobsLeft: 0,
        },
      });
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

    let verificationCodeSent = false;
    let verificationMessage =
      "Account created. Request a verification code to verify your email.";
    let debugOtp: string | undefined;
    try {
      const otp = await generateAndSendOtp(email, "VERIFY_EMAIL");
      verificationCodeSent = true;
      verificationMessage = otp.message;
      debugOtp = otp.debugOtp;
    } catch {
      // Account creation is already committed. Keep the unverified account
      // recoverable and let the verification screen retry delivery rather
      // than reporting registration failure and trapping the user in a
      // duplicate-account error on retry.
    }

    return NextResponse.json({
      success: true,
      email,
      userId: user.createdUser.id,
      message: verificationMessage,
      verificationCodeSent,
      debugOtp,
      referralApplied: !!(referrerId && referralCode),
    }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
