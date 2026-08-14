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

    // Resolve companyId for authenticated user
    let companyId = "comp-1";
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (profile) {
      companyId = profile.companyId;
    }

    let transaction = null;

    if (gatewayOrderId || txId) {
      const searchKey = gatewayOrderId || txId || "";
      transaction = await prisma.paymentTransaction.findFirst({
        where: {
          OR: [
            { gatewayTxId: searchKey },
            { id: searchKey },
          ],
        },
      });
    }

    if (!transaction && orderId) {
      transaction = await prisma.paymentTransaction.findFirst({
        where: {
          OR: [
            { gatewayTxId: orderId },
            { gatewayTxId: { contains: orderId } },
          ],
        },
        orderBy: { createdAt: "desc" },
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
