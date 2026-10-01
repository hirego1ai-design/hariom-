import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getCurrentSession } from "@/lib/auth";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { reconcileExpiredCompanySubscriptions } from "@/lib/subscriptionAccess";
import { parseCandidateCreditPackageSnapshot } from "@/lib/payments/candidateCreditFulfillment";

const querySchema = z.object({
  orderId: z.string().trim().min(8).max(160).optional(),
  gatewayOrderId: z.string().trim().min(4).max(200).optional(),
  txId: z.string().trim().min(4).max(200).optional(),
}).strict().refine(
  (v) => Boolean(v.orderId || v.gatewayOrderId || v.txId),
  "A payment identifier is required.",
);

function identifierWhere(query: z.infer<typeof querySchema>) {
  return [
    ...(query.orderId ? [{ orderId: query.orderId }] : []),
    ...(query.gatewayOrderId ? [{ gatewayOrderId: query.gatewayOrderId }] : []),
    ...(query.txId
      ? [{ gatewayTxId: query.txId }, { gatewayOrderId: query.txId }, { orderId: query.txId }]
      : []),
  ];
}

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "payment_status", 60, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) throw new ApiError("Unauthorized", 401);
    if (session.role === "ADMIN") {
      throw new ApiError(
        "Administrator payment lookup requires an explicitly scoped administration endpoint.",
        400,
      );
    }

    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));

    if (session.role === "CANDIDATE") {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: session.id },
        select: { id: true },
      });
      if (!profile) throw new ApiError("Candidate profile not found.", 404);

      const paymentOrder = await prisma.paymentOrder.findFirst({
        where: {
          candidateProfileId: profile.id,
          productType: "CANDIDATE_CREDITS",
          OR: identifierWhere(query),
        },
      });
      if (!paymentOrder) throw new ApiError("Payment order not found.", 404);

      const [transaction, wallet] = await Promise.all([
        paymentOrder.gatewayTxId
          ? prisma.paymentTransaction.findFirst({
              where: {
                candidateProfileId: profile.id,
                gatewayTxId: paymentOrder.gatewayTxId,
                productType: "CANDIDATE_CREDITS",
              },
            })
          : null,
        prisma.candidateCreditWallet.upsert({
          where: { candidateProfileId: profile.id },
          create: { candidateProfileId: profile.id },
          update: {},
          select: { balance: true, updatedAt: true },
        }),
      ]);

      let packageSnapshot = null;
      try {
        packageSnapshot = parseCandidateCreditPackageSnapshot(paymentOrder.planSnapshot);
      } catch {
        packageSnapshot = null;
      }

      const status = transaction?.status ||
        (paymentOrder.status === "FAILED" ? "FAILED" :
          paymentOrder.status === "SUCCESS" ? "SUCCESS" : "PENDING");

      return NextResponse.json({
        success: true,
        product: "CANDIDATE_CREDITS",
        status,
        order: {
          orderId: paymentOrder.orderId,
          status: paymentOrder.status,
          gateway: paymentOrder.gateway,
          amount: paymentOrder.expectedAmount,
        },
        transaction: transaction ? {
          id: transaction.id,
          gatewayTxId: transaction.gatewayTxId,
          provider: transaction.provider,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          createdAt: transaction.createdAt,
        } : null,
        candidateCredits: wallet,
        package: packageSnapshot,
        message:
          status === "SUCCESS"
            ? "Payment verified and candidate credits added."
            : status === "FAILED"
              ? "Payment attempt failed. No candidate credits were added."
              : "Payment is awaiting authoritative gateway confirmation.",
      });
    }

    if (session.role !== "EMPLOYER") {
      throw new ApiError("Employer or candidate payment access required.", 403);
    }

    const company = await getSessionCompany(session);
    const companyId = company.id;
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        companyId,
        OR: identifierWhere(query),
      },
    });
    if (!paymentOrder) throw new ApiError("Payment order not found.", 404);

    const transaction = paymentOrder.gatewayTxId
      ? await prisma.paymentTransaction.findFirst({
          where: { companyId, gatewayTxId: paymentOrder.gatewayTxId },
        })
      : null;

    if (paymentOrder.productType === "COPILOT" || paymentOrder.productType === "COPILOT_ADDON") {
      const { getCopilotCapacityStatus } = await import("@/lib/copilot/capacity");
      const capacity = await getCopilotCapacityStatus(companyId);
      if (!transaction) {
        return NextResponse.json({
          success: true,
          product: paymentOrder.productType,
          status: paymentOrder.status === "FAILED" ? "FAILED" : "PENDING",
          message: paymentOrder.status === "FAILED"
            ? "Copilot payment attempt failed."
            : "Copilot payment is awaiting gateway confirmation.",
          transaction: null,
          capacity,
        });
      }
      return NextResponse.json({
        success: true,
        product: paymentOrder.productType,
        status: transaction.status,
        transaction: {
          id: transaction.id,
          gatewayTxId: transaction.gatewayTxId,
          provider: transaction.provider,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
        capacity,
      });
    }

    const [subscription, credits] = await Promise.all([
      prisma.$transaction(async (tx) => {
        const now = new Date();
        await reconcileExpiredCompanySubscriptions(tx, companyId, now);
        return tx.companySubscription.findFirst({
          where: {
            companyId,
            status: "ACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          include: { plan: true },
          orderBy: { endDate: "desc" },
        });
      }),
      prisma.companyCredits.findUnique({ where: { companyId } }),
    ]);

    if (!transaction) {
      return NextResponse.json({
        success: true,
        status: paymentOrder.status === "FAILED" ? "FAILED" : "PENDING",
        message: paymentOrder.status === "FAILED"
          ? "Payment attempt failed."
          : "Payment transaction awaiting gateway webhook confirmation.",
        transaction: null,
        subscription,
        credits,
      });
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      transaction: {
        id: transaction.id,
        gatewayTxId: transaction.gatewayTxId,
        provider: transaction.provider,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      subscription,
      credits,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
