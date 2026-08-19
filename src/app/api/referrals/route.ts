import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { FraudStatus } from "@/types/referral";

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, "referrals_get", 30, 60000);

    const session = getCurrentSession(request.headers);
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
    enforceRateLimit(request, "referrals_invite", 10, 60000);

    const session = getCurrentSession(request.headers);
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

    const body = await request.json();

    // IDOR Protection: Reject attempts to specify a different referrer
    if (body.referrerId && body.referrerId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot initiate referral on behalf of another user" },
        { status: 403 }
      );
    }

    if (body.action === "INVITE") {
      const email = body.email;
      if (!email) {
        return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
      }

      const attr = await referralDb.createAttribution({
        referrerId: session.id,
        referralCode: (session.name ? session.name.replace(/\s+/g, "").toUpperCase() : "HIREGO") + "2026",
        attributionSource: "DIRECT_EMAIL_INVITE",
        referredEmail: email,
        metadata: { inviteeEmail: email, inviteeName: body.name || "Friend" },
      });

      return NextResponse.json({
        success: true,
        message: `Referral invitation registered for ${email}`,
        attributionId: attr.id,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
