import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { isGateway } from "@/lib/payments/PaymentGatewayInterface";

const BATCH_SIZE = 50;
const STALE_PENDING_MINUTES = 10;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : request.headers.get("x-cron-secret")?.trim();
  return secret
    ? supplied === secret
    : process.env.NODE_ENV !== "production" && supplied === "dev-cron-secret";
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALE_PENDING_MINUTES * 60_000);
  const pendingOrders = await prisma.paymentOrder.findMany({
    where: {
      status: "CREATED",
      createdAt: { lt: staleBefore },
      gateway: { not: null },
      gatewayOrderId: { not: null },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  const results: Array<Record<string, unknown>> = [];

  for (const order of pendingOrders) {
    if (!order.gateway || !isGateway(order.gateway) || !order.gatewayOrderId) {
      results.push({ orderId: order.orderId, status: "INVALID_GATEWAY_BINDING" });
      continue;
    }

    try {
      // Stripe accepts its Checkout Session id here; PayU accepts txnid.
      const providerStatus = await PaymentGatewayController.getPaymentStatus(
        order.gateway,
        order.gatewayOrderId,
      );

      if (providerStatus.status === "FAILED") {
        await prisma.$transaction(async (tx) => {
          const claim = await tx.paymentOrder.updateMany({
            where: { id: order.id, status: "CREATED" },
            data: { status: "FAILED" },
          });
          if (claim.count !== 1) return;

          if (order.promoReservationState === "RESERVED" && order.promoCode) {
            const promos = await tx.$queryRaw<Array<{ id: string; reservedUsage: number }>>`
              SELECT "id", "reservedUsage"
              FROM "PromoCode"
              WHERE "code" = ${order.promoCode}
              FOR UPDATE
            `;
            const promo = promos[0];
            if (promo?.reservedUsage && promo.reservedUsage > 0) {
              await tx.promoCode.update({
                where: { id: promo.id },
                data: { reservedUsage: { decrement: 1 } },
              });
            }
            await tx.paymentOrder.update({
              where: { id: order.id },
              data: { promoReservationState: "RELEASED" },
            });
          }

          await tx.auditLog.create({
            data: {
              userId: null,
              companyId: order.companyId,
              action: "PAYMENT_RECONCILIATION_FAILED",
              resource: `PaymentOrder:${order.orderId}`,
              details: `Provider ${order.gateway} reported failed payment for stale checkout.`,
            },
          });
        });
        results.push({ orderId: order.orderId, status: "FAILED" });
        continue;
      }

      if (providerStatus.status === "SUCCESS") {
        // Do not synthesize fulfillment here. The verified webhook owns the
        // atomic subscription/promo/ledger transition. Preserve CREATED so a
        // delayed/replayed verified webhook can still claim and fulfill it.
        await prisma.systemEvent.upsert({
          where: { idempotencyKey: `payment-reconciliation-success:${order.orderId}` },
          update: {},
          create: {
            scope: "TENANT",
            companyId: order.companyId,
            eventType: "PAYMENT_RECONCILIATION_SUCCESS_DETECTED",
            correlationId: order.orderId,
            idempotencyKey: `payment-reconciliation-success:${order.orderId}`,
            payload: {
              orderId: order.orderId,
              gateway: order.gateway,
              gatewayOrderId: order.gatewayOrderId,
              actionRequired: "VERIFIED_WEBHOOK_FULFILLMENT",
            },
          },
        });
        results.push({ orderId: order.orderId, status: "SUCCESS_AWAITING_VERIFIED_WEBHOOK" });
        continue;
      }

      results.push({ orderId: order.orderId, status: "PENDING" });
    } catch (error) {
      results.push({
        orderId: order.orderId,
        status: "ERROR",
        error: error instanceof Error ? error.message : "Payment reconciliation failed",
      });
    }
  }

  return NextResponse.json({ success: true, processed: pendingOrders.length, results });
}
