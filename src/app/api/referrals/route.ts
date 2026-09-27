import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { FraudStatus } from "@/types/referral";

const inviteSchema = z.object({
  action: z.literal("INVITE"),
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(160).optional(),
}).strict();

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "referrals_get", 30, 60000);

    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // IDOR Protection: Reject tampering with query parameters or headers
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get("userId") || url.searchParams.get("referrerId");
    if (queryUserId && queryUserId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot access referral stats for another user" },
        { status: 403 }
      );
    }

    const headerUserId = request.headers.get("x-user-id");
    if (headerUserId && headerUserId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Header tampering detected" },
        { status: 403 }
      );
    }

    const stats = await referralDb.getUserReferralStats(session.id, session.name);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "referrals_invite", 10, 60000);

    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // Fraud Gate: Check if user's account is under fraud hold
    const fraud = await referralDb.getUserFraudProfile(session.id);
    if (fraud.status === FraudStatus.FRAUD_HOLD) {
      return NextResponse.json(
        { success: false, error: "Account referral actions are suspended on FRAUD_HOLD." },
        { status: 403 }
      );
    }

    const body = await readValidatedJson(request, inviteSchema, 8 * 1024);
    const stats = await referralDb.getUserReferralStats(session.id, session.name);

    const attr = await referralDb.createAttribution({
      referrerId: session.id,
      referralCode: stats.referralCode,
      attributionSource: "DIRECT_EMAIL_INVITE",
      referredEmail: body.email,
      metadata: { inviteeEmail: body.email, inviteeName: body.name || "Friend" },
    });

    return NextResponse.json({
      success: true,
      message: `Referral invitation registered for ${body.email}`,
      attributionId: attr.id,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
