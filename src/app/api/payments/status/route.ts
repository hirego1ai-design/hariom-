import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const gatewayOrderId = searchParams.get("gatewayOrderId");
    const txId = searchParams.get("txId");

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (!profile || !profile.companyId) {
      return jsonError("No employer profile found for this account", 403);
    }
    const companyId = profile.companyId;

    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        companyId,
        OR: [
          ...(orderId ? [{ orderId }] : []),
          ...(gatewayOrderId ? [{ gatewayOrderId }] : []),
          ...(txId ? [{ gatewayTxId: txId }, { gatewayOrderId: txId }, { orderId: txId }] : []),
        ],
      },
    });

    let transaction = null;
    const searchKey = paymentOrder?.gatewayTxId || txId || gatewayOrderId || orderId || "";
    
    if (searchKey) {
      transaction = await prisma.paymentTransaction.findFirst({
        where: {
          companyId,
          gatewayTxId: searchKey,
        },
      });
    }

    // Fetch active subscription & live credits for company
    const [subscription, credits] = await Promise.all([
      prisma.companySubscription.findFirst({
        where: { companyId, status: "ACTIVE" },
        include: { plan: true },
      }),
      prisma.companyCredits.findUnique({
        where: { companyId },
      }),
    ]);

    if (!transaction) {
      // If transaction not found yet, return PENDING status to allow webhook polling
      return NextResponse.json({
        success: true,
        status: "PENDING",
        message: "Payment transaction awaiting gateway webhook confirmation.",
        transaction: null,
        subscription,
        credits,
      });
    }

    return NextResponse.json({
      success: true,
      status: transaction.status, // "SUCCESS" | "PENDING" | "FAILED" | "REJECTED"
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
