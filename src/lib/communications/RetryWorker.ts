import { prisma } from "@/lib/prisma";

export type CommunicationRetryReport = { eligible: number; exhausted: number };

export async function prepareCommunicationRetries(batchSize = 50): Promise<CommunicationRetryReport> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new Error("Invalid communication retry batch size.");
  const now = new Date();
  const rows = await prisma.communicationDelivery.findMany({
    where: { status: "FAILED", retryable: true, nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: "asc" },
    take: batchSize,
    select: { id: true, attemptCount: true, maxAttempts: true },
  });
  let eligible = 0, exhausted = 0;
  for (const row of rows) {
    if (row.attemptCount >= row.maxAttempts) {
      const result = await prisma.communicationDelivery.updateMany({
        where: { id: row.id, status: "FAILED", retryable: true, attemptCount: row.attemptCount },
        data: { retryable: false, nextAttemptAt: null, lastErrorCode: "MAX_ATTEMPTS_EXHAUSTED" },
      });
      exhausted += result.count;
      continue;
    }
    // This worker deliberately does not resend. Delivery rows do not persist raw
    // recipient addresses or message variables, so reconstructing a provider
    // request here would either require storing sensitive payloads or guessing.
    // Keep eligible failures durable for a trusted domain-specific re-dispatcher.
    eligible++;
  }
  return { eligible, exhausted };
}
