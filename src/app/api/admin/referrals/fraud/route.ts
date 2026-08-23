import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { handleApiError } from "@/lib/apiSecurity";
import { FraudStatus } from "@/types/referral";

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

    const body = await request.json();
    const { userId, newStatus, reason, riskScore, riskFactors } = body;

    if (!userId || !newStatus || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, newStatus, reason" },
        { status: 400 }
      );
    }

    if (!Object.values(FraudStatus).includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(FraudStatus).join(", ")}`,
        },
        { status: 400 }
      );
    }

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
