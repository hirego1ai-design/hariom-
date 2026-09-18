import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { FraudStatus } from "@/types/referral";

const payoutSchema = z.object({
  amount: z.coerce.number().finite().positive().max(10_000_000),
  payoutMethod: z.enum(["UPI", "BANK_TRANSFER"]).default("UPI"),
  payoutAddress: z.string().trim().min(3).max(250).optional(),
  upiId: z.string().trim().min(3).max(150).optional(),
}).strict().refine((body) => Boolean(body.payoutAddress || body.upiId), "Payout address is required.");

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "referrals_payout", 5, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session) throw new ApiError("Authentication required.", 401);
    const body = await readValidatedJson(request, payoutSchema);

    const fraud = await referralDb.getUserFraudProfile(session.id);
    if (fraud.status === FraudStatus.FRAUD_HOLD) throw new ApiError("Payout requests are suspended pending security compliance review.", 403);
    if (fraud.status === FraudStatus.ADMIN_REVIEW) throw new ApiError("Payout requests are suspended while the account is under administrative review.", 403);

    const payoutAddress = body.payoutAddress || body.upiId!;
    const payout = await referralDb.requestPayout({
      referrerId: session.id,
      amount: body.amount,
      payoutMethod: body.payoutMethod,
      payoutAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted and is awaiting compliance verification.",
      payout: { id: payout.id, amount: payout.amount, currency: payout.currency, status: payout.status, createdAt: payout.createdAt },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("exceeds unreserved") || error.message.includes("Minimum payout"))) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return handleApiError(error);
  }
}
