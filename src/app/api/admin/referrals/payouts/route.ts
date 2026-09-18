import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { z } from "zod";

const payoutActionSchema = z.object({ payoutId: z.string().trim().min(1).max(191), action: z.enum(["APPROVE", "MARK_PAID", "PROCESS", "REJECT"]), transactionRef: z.string().trim().min(3).max(200).optional(), adminNotes: z.string().trim().max(1000).optional(), rejectionReason: z.string().trim().max(1000).optional() }).strict();

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

    await enforceRateLimit(request, "admin_referral_payouts_read", 60, 60_000);
    const queue = await referralDb.getAdminPayoutQueue();
    return NextResponse.json({ success: true, queue });
  } catch (error) {
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

    await enforceRateLimit(request, "admin_referral_payouts_update", 20, 60_000);
    const { payoutId, action, transactionRef, adminNotes, rejectionReason } = await readValidatedJson(request, payoutActionSchema);

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
  } catch (error) {
    return handleApiError(error);
  }
}
