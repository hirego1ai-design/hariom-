import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { GatewayName } from "@/lib/payments/PaymentGatewayInterface";
import { subscriptionCredits, subscriptionExpiry } from "@/lib/payments/subscriptionCredits";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";

const BATCH_SIZE = 50;
const STALE_PENDING_MINUTES = 10;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : request.headers.get("x-cron-secret")?.trim();
  return secret ? supplied === secret : process.env.NODE_ENV !== "production" && supplied === "dev-cron-secret";
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PENDING_MINUTES * 60_000);

  const pendingOrders = await prisma.paymentOrder.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: staleBefore },
      provider: { not: null },
      gatewayTxId: { not: null },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  const results = [];

  for (const order of pendingOrders) {
    if (!order.provider || !order.gatewayTxId) continue;
    
    try {
      const statusRes = await PaymentGatewayController.getPaymentStatus(order.provider as GatewayName, order.gatewayTxId);
      
      if (statusRes.status === "SUCCESS") {
        await prisma.$transaction(async (tx) => {
          const updated = await tx.paymentOrder.updateMany({
            where: { id: order.id, status: "PENDING" },
            data: { status: "SUCCESS" }
          });

          if (updated.count > 0 && order.companyId && order.planId) {
            const plan = await tx.subscriptionPlan.findUnique({ where: { id: order.planId } });
            if (plan) {
              const snapshot = parsePurchasedPlanSnapshot(plan);
              const credits = subscriptionCredits(plan.billingCycle, snapshot);
              const expires = subscriptionExpiry(plan.billingCycle);

              const activeSub = await tx.companySubscription.findFirst({
                where: { companyId: order.companyId, status: "ACTIVE" },
                orderBy: { createdAt: "desc" }
              });

              if (!activeSub) {
                await tx.companySubscription.create({
                  data: {
                    companyId: order.companyId,
                    planId: plan.id,
                    status: "ACTIVE",
                    periodEnd: expires,
                    credits: credits.total,
                    usedCredits: 0,
                  }
                });
              } else {
                await tx.companySubscription.update({
                  where: { id: activeSub.id },
                  data: {
                    periodEnd: expires,
                    credits: { increment: credits.total }
                  }
                });
              }
            }
          }
        });
        results.push({ orderId: order.id, status: "SUCCESS" });
      } else if (statusRes.status === "FAILED") {
        await prisma.paymentOrder.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "FAILED" }
        });
        results.push({ orderId: order.id, status: "FAILED" });
      } else {
        results.push({ orderId: order.id, status: "PENDING" });
      }
    } catch (error: any) {
      results.push({ orderId: order.id, status: "ERROR", error: error.message });
    }
  }

  return NextResponse.json({ success: true, processed: pendingOrders.length, results });
}
