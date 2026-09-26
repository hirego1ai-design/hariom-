import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { reconcileExpiredCompanySubscriptions } from "@/lib/subscriptionAccess";

const querySchema = z.object({
  orderId: z.string().trim().min(8).max(160).optional(),
  gatewayOrderId: z.string().trim().min(4).max(200).optional(),
  txId: z.string().trim().min(4).max(200).optional(),
}).strict().refine((v) => Boolean(v.orderId || v.gatewayOrderId || v.txId), "A payment identifier is required.");

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "payment_status", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") throw new ApiError("Administrator payment lookup requires an explicitly scoped administration endpoint.", 400);
    const company = await getSessionCompany(session);
    const companyId = company.id;
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));

    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        companyId,
        OR: [
          ...(query.orderId ? [{ orderId: query.orderId }] : []),
          ...(query.gatewayOrderId ? [{ gatewayOrderId: query.gatewayOrderId }] : []),
          ...(query.txId ? [{ gatewayTxId: query.txId }, { gatewayOrderId: query.txId }, { orderId: query.txId }] : []),
        ],
      },
    });
    if (!paymentOrder) throw new ApiError("Payment order not found.", 404);

    const transaction = paymentOrder.gatewayTxId
      ? await prisma.paymentTransaction.findFirst({ where: { companyId, gatewayTxId: paymentOrder.gatewayTxId } })
      : null;

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
        message: paymentOrder.status === "FAILED" ? "Payment attempt failed." : "Payment transaction awaiting gateway webhook confirmation.",
        transaction: null,
        subscription,
        credits,
      });
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      transaction: { id: transaction.id, gatewayTxId: transaction.gatewayTxId, provider: transaction.provider, amount: transaction.amount, currency: transaction.currency, status: transaction.status, createdAt: transaction.createdAt },
      subscription,
      credits,
    });
  } catch (error) { return handleApiError(error); }
}
