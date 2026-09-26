import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";

export type CopilotUsageReference = {
  jobId?: string;
  applicationId?: string;
  candidateId?: string;
  interviewId?: string;
  metadata?: Prisma.InputJsonValue;
};

export type CopilotCapacityLevel = "NORMAL" | "MODERATE" | "HIGH" | "REACHED";

function safeUnits(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${label}`);
  return value;
}

function usageLevel(percentage: number, soft: number, hard: number): CopilotCapacityLevel {
  if (percentage >= 100) return "REACHED";
  if (percentage >= hard) return "HIGH";
  if (percentage >= soft) return "MODERATE";
  return "NORMAL";
}

async function activeSubscription(tx: Prisma.TransactionClient, companyId: string, now: Date) {
  await tx.copilotSubscription.updateMany({
    where: { companyId, status: "ACTIVE", endDate: { lte: now } },
    data: { status: "EXPIRED" },
  });
  return tx.copilotSubscription.findFirst({
    where: { companyId, status: "ACTIVE", startDate: { lte: now }, endDate: { gt: now } },
    include: { plan: true },
    orderBy: { endDate: "desc" },
  });
}

async function activeCycle(tx: Prisma.TransactionClient, subscriptionId: string, now: Date) {
  await tx.copilotBillingCycle.updateMany({
    where: { subscriptionId, status: "SCHEDULED", startsAt: { lte: now }, endsAt: { gt: now } },
    data: { status: "ACTIVE" },
  });
  await tx.copilotBillingCycle.updateMany({
    where: { subscriptionId, status: "ACTIVE", endsAt: { lte: now } },
    data: { status: "CLOSED" },
  });
  return tx.copilotBillingCycle.findFirst({
    where: { subscriptionId, status: "ACTIVE", startsAt: { lte: now }, endsAt: { gt: now } },
    orderBy: { startsAt: "desc" },
  });
}

export async function getCopilotCapacityStatus(companyId: string) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const subscription = await activeSubscription(tx, companyId, now);
    if (!subscription) {
      return { active: false as const, level: "REACHED" as const, percentageUsed: 100 };
    }
    const cycle = await activeCycle(tx, subscription.id, now);
    if (!cycle) throw new ApiError("Copilot billing cycle is unavailable. Contact support.", 503);

    const total = safeUnits(cycle.baseCapacityUnits + cycle.addonCapacityUnits, "Copilot capacity");
    const used = safeUnits(cycle.consumedCapacityUnits + cycle.reservedCapacityUnits, "Copilot usage");
    const percentageUsed = total <= 0 ? 100 : Math.min(100, Math.round((used / total) * 100));

    return {
      active: true as const,
      plan: { id: subscription.plan.id, code: subscription.plan.code, name: subscription.plan.name },
      subscriptionId: subscription.id,
      billingCycle: { startsAt: cycle.startsAt, endsAt: cycle.endsAt },
      percentageUsed,
      level: usageLevel(percentageUsed, subscription.plan.softWarningPct, subscription.plan.hardWarningPct),
      canStartExpensiveOperation: used < total,
    };
  });
}

export async function reserveCopilotCapacity(params: {
  companyId: string;
  actionKey: string;
  quantity: number;
  idempotencyKey: string;
  expiresAt?: Date;
  reference?: CopilotUsageReference;
}) {
  const quantity = safeUnits(params.quantity, "Copilot quantity");
  if (quantity < 1) throw new ApiError("Copilot usage quantity must be at least 1.", 400);
  if (!/^[A-Z0-9_]{2,100}$/.test(params.actionKey)) throw new ApiError("Invalid Copilot action.", 400);
  if (params.idempotencyKey.length < 16 || params.idempotencyKey.length > 160) {
    throw new ApiError("Invalid Copilot idempotency key.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.copilotUsageReservation.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) {
      if (existing.companyId !== params.companyId || existing.actionKey !== params.actionKey || existing.quantity !== quantity) {
        throw new ApiError("Copilot idempotency key was already used for a different operation.", 409);
      }
      return existing;
    }

    const now = new Date();
    const subscription = await activeSubscription(tx, params.companyId, now);
    if (!subscription) throw new ApiError("An active HireGo Copilot subscription is required.", 402);

    const cycle = await activeCycle(tx, subscription.id, now);
    if (!cycle) throw new ApiError("Copilot billing cycle is unavailable. Contact support.", 503);

    await tx.$queryRaw`SELECT "id" FROM "CopilotBillingCycle" WHERE "id" = ${cycle.id} FOR UPDATE`;
    const lockedCycle = await tx.copilotBillingCycle.findUnique({ where: { id: cycle.id } });
    if (!lockedCycle) throw new ApiError("Copilot billing cycle is unavailable.", 503);

    const rule = await tx.copilotUsageRule.findUnique({ where: { actionKey: params.actionKey } });
    if (!rule || !rule.active) throw new ApiError("This Copilot capability is not currently enabled.", 409);

    const requestedUnits = safeUnits(rule.unitsPerQuantity * quantity, "Copilot reservation");
    const total = lockedCycle.baseCapacityUnits + lockedCycle.addonCapacityUnits;
    const available = total - lockedCycle.consumedCapacityUnits - lockedCycle.reservedCapacityUnits;
    if (requestedUnits > available) {
      throw new ApiError("Included Copilot capacity has been reached. Add capacity or upgrade the Copilot plan.", 402);
    }

    const reservation = await tx.copilotUsageReservation.create({
      data: {
        subscriptionId: subscription.id,
        billingCycleId: lockedCycle.id,
        companyId: params.companyId,
        actionKey: params.actionKey,
        quantity,
        reservedUnits: requestedUnits,
        idempotencyKey: params.idempotencyKey,
        jobId: params.reference?.jobId,
        applicationId: params.reference?.applicationId,
        candidateId: params.reference?.candidateId,
        interviewId: params.reference?.interviewId,
        metadata: params.reference?.metadata,
        expiresAt: params.expiresAt || new Date(Date.now() + 4 * 60 * 60_000),
      },
    });
    await tx.copilotBillingCycle.update({
      where: { id: lockedCycle.id },
      data: { reservedCapacityUnits: { increment: requestedUnits } },
    });
    return reservation;
  });
}

export async function reconcileCopilotReservation(params: {
  reservationId: string;
  actualQuantity: number;
  provider?: string;
  model?: string;
  metadata?: Prisma.InputJsonValue;
  allowOverage?: boolean;
}) {
  const actualQuantity = safeUnits(params.actualQuantity, "actual Copilot quantity");
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.copilotUsageReservation.findUnique({ where: { id: params.reservationId } });
    if (!reservation) throw new ApiError("Copilot reservation not found.", 404);
    if (reservation.status === "CONSUMED") {
      return tx.copilotUsageLedger.findUnique({ where: { idempotencyKey: reservation.idempotencyKey } });
    }
    if (reservation.status !== "RESERVED") throw new ApiError("Copilot reservation is no longer active.", 409);

    await tx.$queryRaw`SELECT "id" FROM "CopilotBillingCycle" WHERE "id" = ${reservation.billingCycleId} FOR UPDATE`;
    const cycle = await tx.copilotBillingCycle.findUnique({ where: { id: reservation.billingCycleId } });
    if (!cycle) throw new ApiError("Copilot billing cycle is unavailable.", 503);

    if (actualQuantity === 0) {
      await tx.copilotBillingCycle.update({
        where: { id: cycle.id },
        data: { reservedCapacityUnits: { decrement: reservation.reservedUnits } },
      });
      await tx.copilotUsageReservation.update({
        where: { id: reservation.id },
        data: { status: "RELEASED", releasedUnits: reservation.reservedUnits },
      });
      return null;
    }

    const unitRate = reservation.reservedUnits / reservation.quantity;
    const actualUnits = safeUnits(Math.ceil(unitRate * actualQuantity), "actual Copilot units");
    const additional = Math.max(0, actualUnits - reservation.reservedUnits);
    const availableAfterReservation =
      cycle.baseCapacityUnits + cycle.addonCapacityUnits - cycle.consumedCapacityUnits - cycle.reservedCapacityUnits;
    if (additional > availableAfterReservation && !params.allowOverage) {
      throw new ApiError("Actual Copilot usage exceeds the remaining plan capacity.", 402);
    }

    const rule = await tx.copilotUsageRule.findUnique({ where: { actionKey: reservation.actionKey } });
    const estimatedCostMinor = rule ? safeUnits(rule.estimatedCostMinor * actualQuantity, "Copilot estimated cost") : 0;
    const releasedUnits = Math.max(0, reservation.reservedUnits - actualUnits);

    const ledger = await tx.copilotUsageLedger.create({
      data: {
        subscriptionId: reservation.subscriptionId,
        billingCycleId: reservation.billingCycleId,
        companyId: reservation.companyId,
        actionKey: reservation.actionKey,
        quantity: actualQuantity,
        capacityUnits: actualUnits,
        estimatedCostMinor,
        costCurrency: rule?.estimatedCostCurrency || "INR",
        idempotencyKey: reservation.idempotencyKey,
        jobId: reservation.jobId,
        applicationId: reservation.applicationId,
        candidateId: reservation.candidateId,
        interviewId: reservation.interviewId,
        provider: params.provider,
        model: params.model,
        metadata: params.metadata,
        status: "CONSUMED",
      },
    });
    await tx.copilotBillingCycle.update({
      where: { id: cycle.id },
      data: {
        reservedCapacityUnits: { decrement: reservation.reservedUnits },
        consumedCapacityUnits: { increment: actualUnits },
      },
    });
    await tx.copilotUsageReservation.update({
      where: { id: reservation.id },
      data: {
        status: "CONSUMED",
        consumedUnits: actualUnits,
        releasedUnits,
      },
    });
    return ledger;
  });
}

export async function releaseCopilotReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.copilotUsageReservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return false;
    if (reservation.status !== "RESERVED") return true;
    await tx.$queryRaw`SELECT "id" FROM "CopilotBillingCycle" WHERE "id" = ${reservation.billingCycleId} FOR UPDATE`;
    await tx.copilotBillingCycle.update({
      where: { id: reservation.billingCycleId },
      data: { reservedCapacityUnits: { decrement: reservation.reservedUnits } },
    });
    await tx.copilotUsageReservation.update({
      where: { id: reservation.id },
      data: { status: "RELEASED", releasedUnits: reservation.reservedUnits },
    });
    return true;
  });
}


export async function reserveCopilotCapacityIfActive(params: {
  companyId: string;
  actionKey: string;
  quantity: number;
  idempotencyKey: string;
  expiresAt?: Date;
  reference?: CopilotUsageReference;
}) {
  const now = new Date();
  const active = await prisma.copilotSubscription.findFirst({
    where: {
      companyId: params.companyId,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gt: now },
    },
    select: { id: true },
  });
  if (!active) return null;
  return reserveCopilotCapacity(params);
}
