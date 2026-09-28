import { NextResponse } from "next/server";
import { z } from "zod";
import { referralDb } from "@/lib/referral-db";
import {
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";

const payoutActionSchema = z.object({
  payoutId: z.string().trim().min(1).max(191),
  action: z.enum(["APPROVE", "MARK_PAID", "REJECT"]),
  transactionRef: z.string().trim().min(3).max(200).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
  rejectionReason: z.string().trim().min(3).max(1000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.action === "MARK_PAID" && !value.transactionRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["transactionRef"],
      message: "Settlement transaction reference is required.",
    });
  }
  if (value.action === "REJECT" && !value.rejectionReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rejectionReason"],
      message: "Rejection reason is required.",
    });
  }
});

const querySchema = z.object({
  status: z.enum(["PENDING_ADMIN_APPROVAL", "APPROVED", "PROCESSING", "PAID", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_payouts_read:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const result = await referralDb.getAdminPayoutQueuePage(query);

    return NextResponse.json({
      success: true,
      queue: result.queue,
      total: result.total,
      page: query.page,
      limit: query.limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_payouts_update:${admin.id}`, 20, 60_000);
    const { payoutId, action, transactionRef, adminNotes, rejectionReason } =
      await readValidatedJson(request, payoutActionSchema, 8 * 1024);
    const ipAddress = getClientIp(request);

    if (action === "APPROVE") {
      const payout = await referralDb.adminApprovePayout(
        payoutId,
        admin.id,
        adminNotes,
        ipAddress,
      );
      return NextResponse.json({
        success: true,
        message: "Payout status updated to APPROVED for processing.",
        payout,
      });
    }

    if (action === "MARK_PAID") {
      const payout = await referralDb.adminMarkPayoutPaid(
        payoutId,
        admin.id,
        transactionRef!,
        ipAddress,
      );
      return NextResponse.json({
        success: true,
        message: "Payout marked as PAID with settlement transaction reference.",
        payout,
      });
    }

    const payout = await referralDb.adminRejectPayout(
      payoutId,
      admin.id,
      rejectionReason!,
      ipAddress,
    );
    return NextResponse.json({
      success: true,
      message: "Payout request rejected and unreserved liability released.",
      payout,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
