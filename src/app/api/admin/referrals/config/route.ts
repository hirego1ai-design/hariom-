import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
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
    const session = getCurrentSession(request.headers);
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

    const config = await getReferralProgramConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = getCurrentSession(request.headers);
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

    const body = await request.json();
    const parsed = configUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid configuration values", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const updated = await updateReferralProgramConfig(parsed.data);
    return NextResponse.json({
      success: true,
      message: "Referral program configuration updated successfully",
      config: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
