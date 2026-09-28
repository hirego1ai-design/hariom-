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

const payoutStatuses = ["PENDING_ADMIN_APPROVAL", "APPROVED", "PAID", "REJECTED"] as const;

const querySchema = z.object({
  status: z.enum(payoutStatuses).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const payoutActionSchema = z.object({
  payoutId: z.string().trim().min(1).max(191),
  action: z.enum(["APPROVE", "MARK_PAID", "REJECT"]),
  expectedUpdatedAt: z.string().datetime(),
  transactionRef: z.string().trim().min(3).max(200).optional(),
  adminNotes: z.string().trim().min(3).max(1000).optional(),
  rejectionReason: z.string().trim().min(3).max(1000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.action === "APPROVE" && !value.adminNotes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adminNotes"],
      message: "Approval rationale is required.",
    });
  }
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

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_payouts_read:${admin.id}`, 60, 60_000);
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
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
    const body = await readValidatedJson(request, payoutActionSchema, 8 * 1024);
    const ipAddress = getClientIp(request);

    if (body.action === "APPROVE") {
      const payout = await referralDb.adminApprovePayout(
        body.payoutId,
        admin.id,
        body.adminNotes,
        ipAddress,
        body.expectedUpdatedAt,
      );
      if (!payout) {
        return NextResponse.json(
          { success: false, error: "Payout is not awaiting approval or changed; refresh before reviewing." },
          { status: 409 },
        );
      }
      return NextResponse.json({
        success: true,
        message: "Payout approved for processing.",
        payout,
      });
    }

    if (body.action === "MARK_PAID") {
      const payout = await referralDb.adminMarkPayoutPaid(
        body.payoutId,
        admin.id,
        body.transactionRef!,
        ipAddress,
        body.expectedUpdatedAt,
      );
      if (!payout) {
        return NextResponse.json(
          { success: false, error: "Payout not found." },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        message: "Payout marked PAID with settlement transaction reference.",
        payout,
      });
    }

    const payout = await referralDb.adminRejectPayout(
      body.payoutId,
      admin.id,
      body.rejectionReason!,
      ipAddress,
      body.expectedUpdatedAt,
    );
    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Payout rejected and reserved liability released.",
      payout,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
