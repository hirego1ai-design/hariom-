import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { COMMUNICATION_REPLAY_VERSION, retryPersistedCommunicationDelivery } from "./dispatcher";

const RETRY_LEASE_MS = 5 * 60 * 1000;
const STALE_INITIAL_PROCESSING_MS = 5 * 60 * 1000;
const MIN_PROVIDER_ATTEMPT_BUDGET_MS = 12_000;

export type CommunicationRetryReport = {
  eligible: number;
  exhausted: number;
  accepted: number;
  rescheduled: number;
  terminal: number;
  claimConflicts: number;
  workerErrors: number;
  timeBudgetExhausted: boolean;
};

async function quarantineExpiredProcessingLeases(now: Date) {
  const expired = await prisma.communicationDelivery.findMany({
    where: {
      status: "PROCESSING",
      retryLeaseId: { not: null },
      retryLeasedUntil: { lte: now },
    },
    orderBy: { retryLeasedUntil: "asc" },
    take: 100,
    select: { id: true, retryLeaseId: true },
  });

  let count = 0;
  for (const row of expired) {
    if (!row.retryLeaseId) continue;
    const result = await prisma.communicationDelivery.updateMany({
      where: {
        id: row.id,
        status: "PROCESSING",
        retryLeaseId: row.retryLeaseId,
        retryLeasedUntil: { lte: now },
      },
      data: {
        status: "FAILED",
        retryable: false,
        nextAttemptAt: null,
        lastErrorCode: "AMBIGUOUS_RETRY_LEASE_EXPIRED",
        lastError:
          "Automatic resend disabled because the prior retry outcome is ambiguous after worker lease expiry.",
        replayEnvelopeEncrypted: null,
        replayEnvelopeVersion: null,
        replayExpiresAt: null,
        retryLeaseId: null,
        retryLeasedUntil: null,
        failedAt: now,
      },
    });
    count += result.count;
  }
  const staleInitialCutoff = new Date(
    now.getTime() - STALE_INITIAL_PROCESSING_MS,
  );
  const staleInitial = await prisma.communicationDelivery.findMany({
    where: {
      status: "PROCESSING",
      retryLeaseId: null,
      createdAt: { lte: staleInitialCutoff },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, createdAt: true },
  });

  for (const row of staleInitial) {
    const result = await prisma.communicationDelivery.updateMany({
      where: {
        id: row.id,
        status: "PROCESSING",
        retryLeaseId: null,
        createdAt: row.createdAt,
      },
      data: {
        status: "FAILED",
        retryable: false,
        nextAttemptAt: null,
        lastErrorCode: "AMBIGUOUS_INITIAL_ATTEMPT_TIMEOUT",
        lastError:
          "Automatic resend disabled because the initial provider attempt did not reach a durable terminal state.",
        replayEnvelopeEncrypted: null,
        replayEnvelopeVersion: null,
        replayExpiresAt: null,
        retryLeasedUntil: null,
        failedAt: now,
      },
    });
    count += result.count;
  }

  return count;
}

export async function prepareCommunicationRetries(
  batchSize = 25,
  stopAt = Number.POSITIVE_INFINITY,
): Promise<CommunicationRetryReport> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
    throw new Error("Invalid communication retry batch size.");
  }

  const now = new Date();
  const report: CommunicationRetryReport = {
    eligible: 0,
    exhausted: 0,
    accepted: 0,
    rescheduled: 0,
    terminal: 0,
    claimConflicts: 0,
    workerErrors: 0,
    timeBudgetExhausted: false,
  };

  report.terminal += await quarantineExpiredProcessingLeases(now);

  const rows = await prisma.communicationDelivery.findMany({
    where: {
      status: "FAILED",
      retryable: true,
      nextAttemptAt: { lte: now },
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: batchSize,
    select: {
      id: true,
      attemptCount: true,
      maxAttempts: true,
      replayEnvelopeEncrypted: true,
      replayEnvelopeVersion: true,
      replayExpiresAt: true,
    },
  });

  for (const row of rows) {
    if (Date.now() + MIN_PROVIDER_ATTEMPT_BUDGET_MS > stopAt) {
      report.timeBudgetExhausted = true;
      break;
    }

    if (
      row.attemptCount >= row.maxAttempts ||
      !row.replayEnvelopeEncrypted ||
      row.replayEnvelopeVersion !== COMMUNICATION_REPLAY_VERSION ||
      !row.replayExpiresAt ||
      row.replayExpiresAt <= now
    ) {
      const result = await prisma.communicationDelivery.updateMany({
        where: {
          id: row.id,
          status: "FAILED",
          retryable: true,
          attemptCount: row.attemptCount,
        },
        data: {
          retryable: false,
          nextAttemptAt: null,
          lastErrorCode:
            row.attemptCount >= row.maxAttempts
              ? "MAX_ATTEMPTS_EXHAUSTED"
              : "REPLAY_ENVELOPE_EXPIRED",
          lastError:
            row.attemptCount >= row.maxAttempts
              ? "Communication retry attempts exhausted."
              : "Encrypted communication replay evidence is unavailable or expired.",
          replayEnvelopeEncrypted: null,
          replayEnvelopeVersion: null,
          replayExpiresAt: null,
          retryLeaseId: null,
          retryLeasedUntil: null,
        },
      });
      report.exhausted += row.attemptCount >= row.maxAttempts ? result.count : 0;
      report.terminal += result.count;
      continue;
    }

    const leaseId = randomUUID();
    const leasedUntil = new Date(Date.now() + RETRY_LEASE_MS);
    const claimed = await prisma.communicationDelivery.updateMany({
      where: {
        id: row.id,
        status: "FAILED",
        retryable: true,
        attemptCount: row.attemptCount,
        nextAttemptAt: { lte: now },
      },
      data: {
        status: "PROCESSING",
        attemptCount: { increment: 1 },
        nextAttemptAt: null,
        retryLeaseId: leaseId,
        retryLeasedUntil: leasedUntil,
      },
    });

    if (claimed.count !== 1) {
      report.claimConflicts += 1;
      continue;
    }

    report.eligible += 1;
    try {
      const result = await retryPersistedCommunicationDelivery({
        deliveryId: row.id,
        leaseId,
      });
      if (!result) {
        report.claimConflicts += 1;
        continue;
      }
      if (["ACCEPTED", "DELIVERED", "READ"].includes(result.status)) {
        report.accepted += 1;
      } else if (
        result.status === "FAILED" &&
        result.retryable &&
        result.nextAttemptAt
      ) {
        report.rescheduled += 1;
      } else if (result.status === "FAILED" && !result.retryable) {
        report.terminal += 1;
      }
    } catch {
      // Do not immediately requeue a claimed retry whose provider outcome may
      // be ambiguous. The lease remains PROCESSING and will be quarantined
      // after expiry instead of risking a duplicate send.
      report.workerErrors += 1;
    }
  }

  return report;
}
