import { NextResponse } from "next/server";
import { referralDb } from "@/lib/referral-db";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, "referral_code_validate", 20, 300000);

    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, valid: false, error: "Referral code is required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const referrerId = await referralDb.resolveReferralCode(cleanCode);

    if (!referrerId) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          code: cleanCode,
          message: "Referral code is invalid or has expired.",
        },
        { status: 200 }
      );
    }

    // Do NOT leak referrerId or internal database identifiers (Rule 7)
    return NextResponse.json({
      success: true,
      valid: true,
      code: cleanCode,
      message: "Valid referral code applied.",
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
