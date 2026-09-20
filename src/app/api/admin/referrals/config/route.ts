import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import {
  getReferralProgramConfig,
  updateReferralProgramConfig,
} from "@/lib/referral-rules";

const configUpdateSchema = z.object({
  isEnabled: z.boolean().optional(),
  candidateRewardAmount: z.number().min(0).max(10000).optional(),
  candidateMaxQualifyingTransactions: z.number().int().min(1).max(100).optional(),
  employerJobRewardAmount: z.number().min(0).max(50000).optional(),
  employerMaxQualifyingTransactions: z.number().int().min(1).max(100).optional(),
  managedHiringRewardAmount: z.number().min(0).max(100000).optional(),
  managedHiringMaxRewards: z.number().int().min(1).max(10).optional(),
  managedHiringDefaultLockDays: z.union([z.literal(45), z.literal(60), z.literal(90)]).optional(),
  minPayoutAmount: z.number().min(100).max(100000).optional(),
  attributionWindowDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator access required" },
        { status: 403 }
      );
    }

    await enforceRateLimit(request, "admin_referral_config_read", 60, 60_000);
    const config = await getReferralProgramConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator access required" },
        { status: 403 }
      );
    }

    await enforceRateLimit(request, "admin_referral_config_write", 20, 60_000);
    const body = await readValidatedJson(request, configUpdateSchema);
    const updated = await updateReferralProgramConfig(body);
    return NextResponse.json({
      success: true,
      message: "Referral program configuration updated successfully",
      config: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
