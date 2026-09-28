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
import { FraudStatus } from "@/types/referral";

const fraudUpdateSchema = z.object({
  userId: z.string().trim().min(1).max(191),
  newStatus: z.nativeEnum(FraudStatus),
  reason: z.string().trim().min(3).max(1000),
  expectedUpdatedAt: z.string().datetime(),
  riskScore: z.number().finite().min(0).max(100).optional(),
  riskFactors: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
}).strict();

const querySchema = z.object({
  userId: z.string().trim().min(1).max(191).optional(),
  status: z.nativeEnum(FraudStatus).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_fraud_read:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));

    if (query.userId) {
      const profile = await referralDb.getUserFraudProfile(query.userId);
      return NextResponse.json({ success: true, profile });
    }

    const result = await referralDb.getAdminFraudQueuePage({
      page: query.page,
      limit: query.limit,
      status: query.status,
    });
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
    await enforceRateLimit(request, `admin_referral_fraud_update:${admin.id}`, 20, 60_000);
    const { userId, newStatus, reason, expectedUpdatedAt, riskScore, riskFactors } = await readValidatedJson(
      request,
      fraudUpdateSchema,
      16 * 1024,
    );

    const updatedProfile = await referralDb.updateFraudStatus({
      userId,
      newStatus,
      reason,
      actorId: admin.id,
      ipAddress: getClientIp(request),
      expectedUpdatedAt,
      riskScore,
      riskFactors,
    });

    return NextResponse.json({
      success: true,
      message: `Fraud status updated to ${newStatus}.`,
      profile: updatedProfile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
