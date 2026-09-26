import { prisma } from "@/lib/prisma";

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 500;

export async function reconcileExpiredCopilotReservations(input?: {
  companyId?: string;
  limit?: number;
}) {
  const now = new Date();
  const limit = Math.min(
    MAX_BATCH_SIZE,
    Math.max(1, Math.trunc(input?.limit ?? DEFAULT_BATCH_SIZE)),
  );

  const expired = await prisma.copilotUsageReservation.findMany({
    where: {
      status: "RESERVED",
      expiresAt: { lte: now },
      ...(input?.companyId ? { companyId: input.companyId } : {}),
    },
    select: {
      id: true,
      billingCycleId: true,
      companyId: true,
      actionKey: true,
      reservedUnits: true,
      expiresAt: true,
    },
    orderBy: { expiresAt: "asc" },
    take: limit,
  });

  let released = 0;
  let skipped = 0;
  const errors: Array<{ reservationId: string; error: string }> = [];

  for (const candidate of expired) {
    try {
      const didRelease = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "CopilotBillingCycle" WHERE "id" = ${candidate.billingCycleId} FOR UPDATE`;

        const reservation = await tx.copilotUsageReservation.findUnique({
          where: { id: candidate.id },
        });
        if (
          !reservation ||
          reservation.status !== "RESERVED" ||
          reservation.expiresAt > now
        ) {
          return false;
        }

        const cycle = await tx.copilotBillingCycle.findUnique({
          where: { id: reservation.billingCycleId },
          select: { reservedCapacityUnits: true },
        });
        if (!cycle) {
          throw new Error("Copilot billing cycle is missing for an expired reservation.");
        }
        if (cycle.reservedCapacityUnits < reservation.reservedUnits) {
          throw new Error("Copilot reserved-capacity accounting is inconsistent; refusing to decrement below zero.");
        }

        await tx.copilotBillingCycle.update({
          where: { id: reservation.billingCycleId },
          data: { reservedCapacityUnits: { decrement: reservation.reservedUnits } },
        });
        await tx.copilotUsageReservation.update({
          where: { id: reservation.id },
          data: {
            status: "EXPIRED",
            releasedUnits: reservation.reservedUnits,
          },
        });
        await tx.auditLog.create({
          data: {
            companyId: reservation.companyId,
            action: "COPILOT_CAPACITY_RESERVATION_EXPIRED",
            resource: `CopilotUsageReservation:${reservation.id}`,
            details: JSON.stringify({
              actionKey: reservation.actionKey,
              releasedUnits: reservation.reservedUnits,
              expiresAt: reservation.expiresAt.toISOString(),
            }),
          },
        });
        return true;
      });

      if (didRelease) released += 1;
      else skipped += 1;
    } catch (error) {
      errors.push({
        reservationId: candidate.id,
        error: error instanceof Error ? error.message.slice(0, 500) : "Unknown reconciliation failure",
      });
    }
  }

  return {
    scanned: expired.length,
    released,
    skipped,
    failed: errors.length,
    errors,
  };
}
