import type { PaymentOrder } from "@prisma/client";
import type { GatewayName, VerifyWebhookResult } from "@/lib/payments/PaymentGatewayInterface";
import { ApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { parseCopilotCapacityAddonSnapshot } from "./capacityAddonSnapshot";

export async function fulfillCopilotCapacityAddon(params: {
  paymentOrder: PaymentOrder;
  verification: VerifyWebhookResult;
  provider: GatewayName;
  gatewayTxId: string;
  rawPayload: unknown;
}) {
  const { paymentOrder, verification, provider, gatewayTxId } = params;
  const snapshot = parseCopilotCapacityAddonSnapshot(paymentOrder.planSnapshot);
  const expectedAmount = snapshot.amountMinor / 100;

  if (paymentOrder.planId !== snapshot.offerId) throw new ApiError("Copilot add-capacity snapshot does not match the order.", 409);
  if (paymentOrder.billingCountry !== snapshot.billingCountry) throw new ApiError("Copilot add-capacity billing country mismatch.", 409);
  if (verification.companyId && verification.companyId !== paymentOrder.companyId) throw new ApiError("Gateway company does not match the add-capacity order.", 400);
  if (verification.currency && verification.currency !== snapshot.currency) throw new ApiError("Gateway currency does not match the add-capacity order.", 400);
  if (verification.amount === undefined || !Number.isFinite(verification.amount) || verification.amount <= 0) {
    throw new ApiError("Gateway payment amount missing or invalid.", 400);
  }
  if (Math.abs(verification.amount - expectedAmount) > 0.01 || Math.abs(paymentOrder.expectedAmount - expectedAmount) > 0.01) {
    throw new ApiError("Gateway amount does not match the add-capacity order.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const existingTx = await tx.paymentTransaction.findUnique({ where: { gatewayTxId } });
    if (existingTx?.status === "SUCCESS") {
      return { duplicate: true as const, addonId: null };
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { orderId: paymentOrder.orderId, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", gatewayTxId },
    });
    if (claimed.count !== 1) return { duplicate: true as const, addonId: null };

    await tx.paymentTransaction.upsert({
      where: { gatewayTxId },
      update: {
        productType: "COPILOT_ADDON",
        status: "SUCCESS",
        planId: snapshot.offerId,
        amount: expectedAmount,
        currency: snapshot.currency,
        provider,
      },
      create: {
        gatewayTxId,
        companyId: paymentOrder.companyId,
        productType: "COPILOT_ADDON",
        planId: snapshot.offerId,
        amount: expectedAmount,
        currency: snapshot.currency,
        status: "SUCCESS",
        provider,
        rawPayload: params.rawPayload as any,
      },
    });

    const now = new Date();
    await tx.$queryRaw`SELECT "id" FROM "CopilotBillingCycle" WHERE "id" = ${snapshot.billingCycleId} FOR UPDATE`;
    const cycle = await tx.copilotBillingCycle.findUnique({
      where: { id: snapshot.billingCycleId },
      include: { subscription: true },
    });
    if (
      !cycle ||
      cycle.subscriptionId !== snapshot.subscriptionId ||
      cycle.subscription.companyId !== paymentOrder.companyId ||
      cycle.status !== "ACTIVE" ||
      cycle.startsAt > now ||
      cycle.endsAt <= now ||
      cycle.endsAt.toISOString() !== snapshot.expiresAt
    ) {
      throw new ApiError(
        "The Copilot billing cycle changed before add-capacity payment fulfillment. Manual payment reconciliation is required.",
        409,
      );
    }

    const addon = await tx.copilotCapacityAddon.create({
      data: {
        subscriptionId: snapshot.subscriptionId,
        billingCycleId: snapshot.billingCycleId,
        companyId: paymentOrder.companyId,
        capacityUnits: snapshot.capacityUnits,
        amountMinor: snapshot.amountMinor,
        currency: snapshot.currency,
        paymentId: gatewayTxId,
        expiresAt: cycle.endsAt,
      },
    });
    await tx.copilotBillingCycle.update({
      where: { id: cycle.id },
      data: { addonCapacityUnits: { increment: snapshot.capacityUnits } },
    });

    await tx.auditLog.create({
      data: {
        companyId: paymentOrder.companyId,
        action: "COPILOT_CAPACITY_ADDED",
        resource: `CopilotBillingCycle:${cycle.id}`,
        details: JSON.stringify({
          addonId: addon.id,
          offerId: snapshot.offerId,
          amount: expectedAmount,
          currency: snapshot.currency,
          provider,
        }),
      },
    });

    return { duplicate: false as const, addonId: addon.id };
  });
}
