import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { FraudStatus } from "@/types/referral";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "referrals_payout", 5, 60000);

    const session = getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // IDOR Protection: User can only request payouts for their own authenticated account
    if (body.referrerId && body.referrerId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot request payout for another user" },
        { status: 403 }
      );
    }

    if (body.userId && body.userId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot request payout for another user" },
        { status: 403 }
      );
    }

    // Fraud Gate: Check if user is in FRAUD_HOLD or ADMIN_REVIEW
    const fraud = await referralDb.getUserFraudProfile(session.id);
    if (fraud.status === FraudStatus.FRAUD_HOLD) {
      return NextResponse.json(
        { success: false, error: "Payout requests are suspended: Account is on FRAUD_HOLD pending security compliance review." },
        { status: 403 }
      );
    }
    if (fraud.status === FraudStatus.ADMIN_REVIEW) {
      return NextResponse.json(
        { success: false, error: "Payout requests are suspended: Account is currently under ADMIN_REVIEW." },
        { status: 403 }
      );
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid payout amount" }, { status: 400 });
    }

    const payoutAddress = body.payoutAddress || body.upiId;
    if (!payoutAddress) {
      return NextResponse.json(
        { success: false, error: "Payout address (UPI ID or Bank Account) is required" },
        { status: 400 }
      );
    }

    const payout = await referralDb.requestPayout({
      referrerId: session.id,
      amount,
      payoutMethod: body.payoutMethod || "UPI",
      payoutAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request for ₹${amount.toLocaleString()} submitted. Awaiting admin compliance verification.`,
      payout: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        createdAt: payout.createdAt,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("exceeds unreserved") || error.message?.includes("Minimum payout")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return handleApiError(error);
  }
}
