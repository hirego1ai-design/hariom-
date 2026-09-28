import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
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
  expectedUpdatedAt: z.string().datetime(),
}).strict().refine(
  (value) => Object.keys(value).some((key) => key !== "expectedUpdatedAt"),
  "At least one referral configuration field is required.",
);

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_config_read:${admin.id}`, 60, 60_000);
    const config = await getReferralProgramConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_config_write:${admin.id}`, 20, 60_000);
    const body = await readValidatedJson(request, configUpdateSchema, 8 * 1024);
    const { expectedUpdatedAt, ...updates } = body;

    const updated = await updateReferralProgramConfig(
      updates,
      {
        actorId: admin.id,
        ipAddress: getClientIp(request),
      },
      expectedUpdatedAt,
    );

    return NextResponse.json({
      success: true,
      message: "Referral program configuration updated successfully.",
      config: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
