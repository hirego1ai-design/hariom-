import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";

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

    const queue = await referralDb.getAdminPayoutQueue();
    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { payoutId, action, transactionRef, adminNotes, rejectionReason } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ success: false, error: "Missing payoutId or action" }, { status: 400 });
    }

    if (action === "APPROVE") {
      const payout = await referralDb.adminApprovePayout(payoutId, session.id, adminNotes);
      if (!payout) {
        return NextResponse.json({ success: false, error: "Payout request not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Payout status updated to APPROVED for processing.",
        payout,
      });
    }

    if (action === "MARK_PAID" || action === "PROCESS") {
      if (!transactionRef || !transactionRef.trim()) {
        return NextResponse.json({ success: false, error: "A valid transactionRef / UTR is required to mark payout as PAID." }, { status: 400 });
      }
      const payout = await referralDb.adminMarkPayoutPaid(
        payoutId,
        session.id,
        transactionRef
      );
      if (!payout) {
        return NextResponse.json({ success: false, error: "Payout request not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Payout marked as PAID with settlement transaction reference.",
        payout,
      });
    }

    if (action === "REJECT") {
      const payout = await referralDb.adminRejectPayout(
        payoutId,
        session.id,
        rejectionReason || "Rejected by administrator."
      );
      if (!payout) {
        return NextResponse.json({ success: false, error: "Payout request not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Payout request rejected and unreserved liability released.",
        payout,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
