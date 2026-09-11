import { prisma } from '@/lib/prisma';
import { AiCompanyBudget, BudgetReservation } from '@prisma/client';
import { assertAndConsumeAiEntitlement, AiEntitlementError } from './AiEntitlements';

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

export class BudgetNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetNotConfiguredError';
  }
}

export class ReservationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationNotFoundError';
  }
}

export class BudgetManager {
  public static async reserveBudget(params: {
    companyId: string;
    executionId: string;
    correlationId: string;
    estimatedMinor: bigint;
    ttlSeconds?: number;
    billableAgentId?: string;
  }): Promise<BudgetReservation> {
    const { companyId, executionId, correlationId, estimatedMinor, ttlSeconds = 3600 } = params;
    if (estimatedMinor < BigInt(0) || !Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new RangeError('Budget reservations require a non-negative amount and positive integer TTL');
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const budgets = await tx.$queryRaw<AiCompanyBudget[]>`
          SELECT * FROM "AiCompanyBudget" WHERE "companyId" = ${companyId} FOR UPDATE
        `;
        const budget = budgets[0];

        // A missing row used to create an unbounded reservation. This is a
        // financial authorization boundary, so absence must deny execution.
        if (!budget) {
          throw new BudgetNotConfiguredError('AI budget is not configured for this company');
        }

        const currentSpend = BigInt(budget.currentSpendMinorUnits);
        const reservedSpend = BigInt(budget.reservedSpendMinorUnits);
        const limit = BigInt(budget.monthlyLimitMinorUnits);

        if (currentSpend + reservedSpend + estimatedMinor > limit) {
          if (budget.isHardCapEnabled) {
            throw new BudgetExceededError('Budget exceeded');
          }
        }

        // Debit and reservation share a transaction. Rejected budgets and
        // duplicate execution IDs must never consume an additional AI credit.
        if (params.billableAgentId) {
          await assertAndConsumeAiEntitlement(companyId, params.billableAgentId, tx);
        }

        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

        const reservation = await tx.budgetReservation.create({
          data: {
            executionId,
            correlationId,
            companyId,
            reservedMinor: estimatedMinor,
            expiresAt,
            status: 'HELD',
          },
        });

        await tx.aiCompanyBudget.update({
          where: { id: budget.id },
          data: {
            reservedSpendMinorUnits: BigInt(budget.reservedSpendMinorUnits) + estimatedMinor,
          },
        });

        return reservation;
      });
    } catch (err) {
      if (err instanceof BudgetExceededError || err instanceof BudgetNotConfiguredError || err instanceof AiEntitlementError) throw err;
      if (process.env.NODE_ENV === "production" || process.env.MOCK_DB !== "true") throw err;
      // Development/test-only fallback. It is never available to production
      // callers, where a failed budget reservation must fail closed.
      return {
        id: `res-${Date.now()}`,
        companyId,
        executionId,
        correlationId,
        reservedMinor: estimatedMinor,
        actualMinor: null,
        status: 'HELD',
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        reconciledAt: null,
        createdAt: new Date(),
      };
    }
  }

  public static async reconcileBudget(params: { executionId: string; actualMinor: bigint }): Promise<void> {
    const { executionId, actualMinor } = params;
    if (actualMinor < BigInt(0)) throw new RangeError('Actual spend cannot be negative');

    try {
      await prisma.$transaction(async (tx) => {
        const reservations = await tx.$queryRaw<BudgetReservation[]>`
          SELECT * FROM "BudgetReservation" WHERE "executionId" = ${executionId} AND "status" = 'HELD' FOR UPDATE
        `;
        const reservation = reservations[0];

        if (!reservation) {
          return;
        }

        await tx.budgetReservation.update({
          where: { id: reservation.id },
          data: {
            status: 'COMMITTED',
            actualMinor,
            reconciledAt: new Date(),
          },
        });

        const budgets = await tx.$queryRaw<AiCompanyBudget[]>`
          SELECT * FROM "AiCompanyBudget" WHERE "companyId" = ${reservation.companyId} FOR UPDATE
        `;
        const budget = budgets[0];

        if (budget) {
          await tx.aiCompanyBudget.update({
            where: { id: budget.id },
            data: {
              reservedSpendMinorUnits: BigInt(budget.reservedSpendMinorUnits) - BigInt(reservation.reservedMinor),
              currentSpendMinorUnits: BigInt(budget.currentSpendMinorUnits) + actualMinor,
            },
          });
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production" || process.env.MOCK_DB !== "true") throw error;
    }
  }

  public static async releaseBudget(executionId: string, refundAiCredit = false): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const reservations = await tx.$queryRaw<BudgetReservation[]>`
        SELECT * FROM "BudgetReservation" WHERE "executionId" = ${executionId} AND "status" = 'HELD' FOR UPDATE
      `;
      const reservation = reservations[0];

      if (!reservation) {
        return;
      }

      await tx.budgetReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'RELEASED',
        },
      });

      const budgets = await tx.$queryRaw<AiCompanyBudget[]>`
        SELECT * FROM "AiCompanyBudget" WHERE "companyId" = ${reservation.companyId} FOR UPDATE
      `;
      const budget = budgets[0];

      if (budget) {
        await tx.aiCompanyBudget.update({
          where: { id: budget.id },
          data: {
              reservedSpendMinorUnits: BigInt(budget.reservedSpendMinorUnits) - BigInt(reservation.reservedMinor),
            },
          });
      }

      // Match reservation's budget -> credits lock order. Only the execution
      // owner requests this before execution; the HELD lock prevents repeats.
      if (refundAiCredit) {
        await tx.companyCredits.update({
          where: { companyId: reservation.companyId },
          data: { aiAgentCreditsLeft: { increment: 1 } },
        });
      }
    });
  }

  public static async expireStaleReservations(batchSize = 100, stopAt = Number.POSITIVE_INFINITY): Promise<number> {
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new Error('Invalid reservation recovery batch size');
    let expiredCount = 0;
    const now = new Date();

    const staleReservations = await prisma.budgetReservation.findMany({
      where: {
        status: 'HELD',
        expiresAt: { lt: now },
      },
      take: batchSize,
      orderBy: { expiresAt: 'asc' },
    });

    for (const reservation of staleReservations) {
      if (Date.now() >= stopAt) break;
      try {
        // A dead worker may have reached the provider. Expiry is not proof of
        // zero spend, so preserve the held estimate instead of freeing it.
        await BudgetManager.reconcileBudget({ executionId: reservation.executionId, actualMinor: reservation.reservedMinor });
        expiredCount++;
      } catch (err) {
        console.error(`Failed to release stale budget reservation ${reservation.id}`, err);
        throw new Error('Budget reservation recovery failed; retry after restoring database availability.');
      }
    }

    return expiredCount;
  }
}
