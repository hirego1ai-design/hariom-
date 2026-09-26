import type { PaymentOrder } from "@prisma/client";
import type { VerifyWebhookResult, GatewayName } from "@/lib/payments/PaymentGatewayInterface";
import { ApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { parseCopilotPurchaseSnapshot } from "./purchaseSnapshot";

function addMonths(start: Date, months: number) {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export async function fulfillCopilotPayment(params: {
  paymentOrder: PaymentOrder;
  verification: VerifyWebhookResult;
  provider: GatewayName;
  gatewayTxId: string;
  rawPayload: unknown;
}) {
  const { paymentOrder, verification, provider, gatewayTxId } = params;
  const snapshot = parseCopilotPurchaseSnapshot(paymentOrder.planSnapshot);

  if (snapshot.planId !== paymentOrder.planId) throw new ApiError("Copilot payment snapshot does not match the ordered plan.", 409);
  if (verification.companyId && verification.companyId !== paymentOrder.companyId) throw new ApiError("Gateway company does not match the Copilot order.", 400);
  if (verification.currency && verification.currency !== snapshot.currency) throw new ApiError("Gateway currency does not match the Copilot order.", 400);
  if (verification.amount === undefined || !Number.isFinite(verification.amount) || verification.amount <= 0) {
    throw new ApiError("Gateway payment amount missing or invalid.", 400);
  }
  const expectedAmount = snapshot.amountMinor / 100;
  if (Math.abs(verification.amount - expectedAmount) > 0.01 || Math.abs(paymentOrder.expectedAmount - expectedAmount) > 0.01) {
    throw new ApiError("Gateway payment amount does not match the Copilot order.", 400);
  }

  const currentPlan = await prisma.copilotPlan.findUnique({ where: { id: snapshot.planId } });
  if (!currentPlan) throw new ApiError("Purchased Copilot plan no longer exists. Manual reconciliation is required.", 409);

  return prisma.$transaction(async (tx) => {
    const existingTx = await tx.paymentTransaction.findUnique({ where: { gatewayTxId } });
    if (existingTx?.status === "SUCCESS") {
      return { duplicate: true as const, subscriptionId: null, billingCycleId: null };
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { orderId: paymentOrder.orderId, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", gatewayTxId },
    });
    if (claimed.count !== 1) return { duplicate: true as const, subscriptionId: null, billingCycleId: null };

    await tx.paymentTransaction.upsert({
      where: { gatewayTxId },
      update: {
        productType: "COPILOT",
        status: "SUCCESS",
        planId: snapshot.planId,
        amount: expectedAmount,
        currency: snapshot.currency,
        provider,
      },
      create: {
        gatewayTxId,
        companyId: paymentOrder.companyId,
        productType: "COPILOT",
        planId: snapshot.planId,
        amount: expectedAmount,
        currency: snapshot.currency,
        status: "SUCCESS",
        provider,
        rawPayload: params.rawPayload as any,
      },
    });

    await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${paymentOrder.companyId} FOR UPDATE`;
    const now = new Date();
    await tx.copilotSubscription.updateMany({
      where: { companyId: paymentOrder.companyId, status: "ACTIVE", endDate: { lte: now } },
      data: { status: "EXPIRED" },
    });

    const existing = await tx.copilotSubscription.findFirst({
      where: { companyId: paymentOrder.companyId, status: "ACTIVE", endDate: { gt: now } },
      orderBy: { endDate: "desc" },
    });

    let subscription;
    let cycleStart: Date;
    if (existing && existing.planId === snapshot.planId) {
      cycleStart = existing.endDate;
      const newEnd = addMonths(cycleStart, snapshot.validityMonths);
      subscription = await tx.copilotSubscription.update({
        where: { id: existing.id },
        data: { endDate: newEnd, paymentId: gatewayTxId, priceSnapshot: snapshot as any, billingCountry: snapshot.billingCountry },
      });
    } else {
      if (existing) {
        await tx.copilotSubscription.update({ where: { id: existing.id }, data: { status: "CANCELLED", endDate: now } });
        await tx.copilotBillingCycle.updateMany({
          where: { subscriptionId: existing.id, status: { in: ["ACTIVE", "SCHEDULED"] } },
          data: { status: "CLOSED" },
        });
      }
      cycleStart = now;
      const newEnd = addMonths(now, snapshot.validityMonths);
      subscription = await tx.copilotSubscription.create({
        data: {
          companyId: paymentOrder.companyId,
          planId: snapshot.planId,
          status: "ACTIVE",
          billingCountry: snapshot.billingCountry,
          priceSnapshot: snapshot as any,
          startDate: now,
          endDate: newEnd,
          paymentId: gatewayTxId,
        },
      });
    }

    const cycleEnd = addMonths(cycleStart, snapshot.validityMonths);
    const billingCycle = await tx.copilotBillingCycle.create({
      data: {
        subscriptionId: subscription.id,
        startsAt: cycleStart,
        endsAt: cycleEnd,
        baseCapacityUnits: snapshot.monthlyCapacityUnits,
        status: cycleStart <= now ? "ACTIVE" : "SCHEDULED",
      },
    });

    await tx.auditLog.create({
      data: {
        userId: null,
        companyId: paymentOrder.companyId,
        action: "COPILOT_SUBSCRIPTION_PAYMENT_COMMITTED",
        resource: `CopilotSubscription:${subscription.id}`,
        details: JSON.stringify({
          planId: snapshot.planId,
          billingCountry: snapshot.billingCountry,
          currency: snapshot.currency,
          amount: expectedAmount,
          provider,
          automaticHiringDecision: false,
        }),
      },
    });

    await tx.systemEvent.upsert({
      where: { idempotencyKey: `copilot_payment_${gatewayTxId}` },
      update: {},
      create: {
        scope: "TENANT",
        companyId: paymentOrder.companyId,
        eventType: "COPILOT_SUBSCRIPTION_ACTIVATED",
        correlationId: gatewayTxId,
        idempotencyKey: `copilot_payment_${gatewayTxId}`,
        payload: {
          subscriptionId: subscription.id,
          billingCycleId: billingCycle.id,
          planId: snapshot.planId,
          billingCountry: snapshot.billingCountry,
          provider,
        },
      },
    });

    return { duplicate: false as const, subscriptionId: subscription.id, billingCycleId: billingCycle.id };
  });
}
