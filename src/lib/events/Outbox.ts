import { prisma } from '@/lib/prisma';
import type { PrismaClient, Prisma } from '@prisma/client';
import { EventDispatcher } from './EventDispatcher';
import { ConsumerRegistry } from './ConsumerRegistry';

export interface OutboxPollReport {
  claimed: number;
  reclaimed: number;
  dispatched: number;
  retried: number;
  failed: number;
  unhandled: number;
}

export class OutboxPublisher {
  static async publish(params: {
    eventType: string;
    payload: Record<string, unknown>;
    correlationId: string;
    companyId?: string | null;
    idempotencyKey: string;
  }, tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) {
    if (!params.eventType || !/^[A-Za-z0-9_.-]+$/.test(params.eventType)) {
      throw new Error('Invalid event type');
    }
    return (tx || prisma).outboxEntry.create({
      data: { ...params, payload: params.payload as Prisma.InputJsonValue, status: 'PENDING', retryCount: 0 },
    });
  }
}

export class OutboxPoller {
  static async pollAndProcess(batchSize = 10, leaseTimeoutMs = 60000, stopAt = Number.POSITIVE_INFINITY): Promise<OutboxPollReport> {
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100 ||
        !Number.isSafeInteger(leaseTimeoutMs) || leaseTimeoutMs < 1000) {
      throw new Error('Invalid outbox batch size or lease duration');
    }
    const eligible = (now: Date): Prisma.OutboxEntryWhereInput => ({
      OR: [
        { status: 'PENDING' },
        { status: 'PROCESSING', claimedAt: { lt: new Date(now.getTime() - leaseTimeoutMs) } },
      ],
    });
    const entries = await prisma.outboxEntry.findMany({
      where: eligible(new Date()), take: batchSize, orderBy: { createdAt: 'asc' },
    });
    const report: OutboxPollReport = { claimed: 0, reclaimed: 0, dispatched: 0, retried: 0, failed: 0, unhandled: 0 };
    for (const entry of entries) {
      if (Date.now() >= stopAt) break;
      // No business handler is not successful delivery. Keep the event durable
      // for the deployment that registers its real idempotent consumers.
      if (ConsumerRegistry.getConsumers(entry.eventType).length === 0) {
        report.unhandled++;
        continue;
      }
      // Compare-and-set the snapshot as well as eligibility. A second poller
      // cannot claim this row after its state or lease timestamp has changed.
      const claimedAt = new Date(Math.max(Date.now(), (entry.claimedAt?.getTime() ?? 0) + 1));
      const claim = await prisma.outboxEntry.updateMany({
        where: { id: entry.id, status: entry.status, claimedAt: entry.claimedAt, retryCount: entry.retryCount,
          AND: [eligible(claimedAt)] },
        data: { status: 'PROCESSING', claimedAt },
      });
      if (claim.count !== 1) continue;
      report.claimed++;
      if (entry.status === 'PROCESSING') report.reclaimed++;
      const owned = { id: entry.id, status: 'PROCESSING', claimedAt, retryCount: entry.retryCount };
      try {
        await EventDispatcher.dispatchOutboxEntry(entry);
        const settled = await prisma.outboxEntry.updateMany({
          where: owned, data: { status: 'DISPATCHED', dispatchedAt: new Date() },
        });
        if (settled.count === 1) report.dispatched++;
      } catch (error) {
        // Keep final failure and its dead-letter record atomic. Delivery is
        // at-least-once; consumers must deduplicate external side effects.
        const settlement = await prisma.$transaction(async (tx) => {
          const terminal = entry.retryCount + 1 >= entry.maxRetries;
          const updated = await tx.outboxEntry.updateMany({
            where: owned,
            data: {
              retryCount: { increment: 1 },
              status: terminal ? 'FAILED' : 'PENDING',
              claimedAt: null,
              ...(terminal ? { failedAt: new Date() } : {}),
            },
          });
          if (terminal && updated.count === 1) {
            await tx.deadLetterJob.create({
              data: {
                sourceType: 'OutboxEntry', sourceId: entry.id, correlationId: entry.correlationId,
                errorType: 'DispatchFailed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                payload: entry.payload as Prisma.InputJsonValue, status: 'OPEN', retryCount: 0,
              },
            });
          }
          return updated.count === 1 ? (terminal ? 'failed' : 'retried') : null;
        });
        if (settlement) report[settlement]++;
      }
    }
    return report;
  }
}
