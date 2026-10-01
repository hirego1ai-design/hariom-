import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import {
  CANDIDATE_CREDIT_PRODUCT_TYPE,
  candidatePaymentSubject,
  parseCandidateCreditPackageSnapshot,
} from "@/lib/payments/candidateCreditCommerce";

const querySchema = z.object({
  orderId: z.string().trim().min(16).max(160),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credit_payment_status", 60, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
    if (!profile) throw new ApiError("Candidate profile not found", 404);

    const { orderId } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const order = await prisma.paymentOrder.findFirst({
      where: {
        orderId,
        companyId: candidatePaymentSubject(profile.id),
        productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
      },
    });
    if (!order) throw new ApiError("Candidate credit payment order not found.", 404);

    const snapshot = parseCandidateCreditPackageSnapshot(order.planSnapshot);
    const [transaction, wallet] = await Promise.all([
      order.gatewayTxId
        ? prisma.paymentTransaction.findUnique({ where: { gatewayTxId: order.gatewayTxId } })
        : Promise.resolve(null),
      prisma.candidateCreditWallet.upsert({
        where: { candidateProfileId: profile.id },
        create: { candidateProfileId: profile.id },
        update: {},
        select: { balance: true, updatedAt: true },
      }),
    ]);

    const status = transaction?.status === "SUCCESS"
      ? "SUCCESS"
      : order.status === "FAILED"
        ? "FAILED"
        : "PENDING";

    return NextResponse.json({
      success: true,
      status,
      order: {
        orderId: order.orderId,
        packageId: snapshot.packageId,
        packageName: snapshot.name,
        credits: snapshot.credits,
        amount: order.expectedAmount,
        currency: snapshot.currency,
        gateway: order.gateway,
      },
      transaction: transaction ? {
        gatewayTxId: transaction.gatewayTxId,
        provider: transaction.provider,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
      } : null,
      wallet,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
