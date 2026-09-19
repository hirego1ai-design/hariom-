import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { FraudStatus } from "@/types/referral";
import { z } from "zod";

const fraudUpdateSchema = z.object({ userId: z.string().trim().min(1).max(191), newStatus: z.nativeEnum(FraudStatus), reason: z.string().trim().min(3).max(1000), riskScore: z.number().finite().min(0).max(100).optional(), riskFactors: z.array(z.string().trim().min(1).max(200)).max(50).optional() }).strict();

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

    await enforceRateLimit(request, "admin_referral_fraud_read", 60, 60_000);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (userId) {
      const profile = await referralDb.getUserFraudProfile(userId);
      return NextResponse.json({ success: true, profile });
    }

    const queue = await referralDb.getAdminFraudQueue();
    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
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

    await enforceRateLimit(request, "admin_referral_fraud_update", 20, 60_000);
    const { userId, newStatus, reason, riskScore, riskFactors } = await readValidatedJson(request, fraudUpdateSchema);

    const updatedProfile = await referralDb.updateFraudStatus({
      userId,
      newStatus,
      reason,
      actorId: session.id,
      riskScore,
      riskFactors,
    });

    return NextResponse.json({
      success: true,
      message: `Fraud status updated to ${newStatus} for user ${userId}`,
      profile: updatedProfile,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
