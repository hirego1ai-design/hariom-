import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const LEASE_MS = 5 * 60_000;
const RETRY_BASE_MS = 30_000;

export async function claimVideoAnalysisJob(jobId: string) {
  const now = new Date();
  const claimToken = crypto.randomUUID();
  const leaseExpiresAt = new Date(now.getTime() + LEASE_MS);
  const job = await prisma.videoAnalysisJob.findUnique({ where: { id: jobId } });
  if (!job || job.attempts >= job.maxAttempts) return null;
  const eligible = job.status === "PENDING" &&
    (!job.nextAttemptAt || job.nextAttemptAt <= now);
  if (!eligible) return null;
  const claimed = await prisma.videoAnalysisJob.updateMany({
    where: { id: jobId, status: "PENDING", attempts: job.attempts, updatedAt: job.updatedAt },
    data: {
      status: "PROCESSING", claimedAt: now, startedAt: now,
      leaseExpiresAt, claimToken, nextAttemptAt: null,
      attempts: { increment: 1 }, error: null,
    },
  });
  return claimed.count === 1 ? { claimToken, leaseExpiresAt, attempt: job.attempts + 1 } : null;
}

export async function recoverStaleVideoAnalysisJobs(limit = 10) {
  const now = new Date();
  const stale = await prisma.videoAnalysisJob.findMany({
    where: { status: "PROCESSING", leaseExpiresAt: { lt: now } },
    orderBy: { leaseExpiresAt: "asc" }, take: Math.max(1, Math.min(limit, 50)),
  });
  let retried = 0, exhausted = 0;
  for (const job of stale) {
    if (job.attempts >= job.maxAttempts) {
      const done = await prisma.videoAnalysisJob.updateMany({
        where: { id: job.id, status: "PROCESSING", claimToken: job.claimToken },
        data: { status: "BLOCKED_INFRA", error: "Video analysis retry limit exhausted after stale worker lease.", completedAt: now, claimToken: null, leaseExpiresAt: null },
      });
      if (done.count) {
        exhausted++;
        await prisma.videoResume.updateMany({ where: { id: job.videoResumeId, analysisStatus: "PROCESSING" }, data: { analysisStatus: "BLOCKED_INFRA", analysisError: "Video analysis retry limit exhausted" } });
      }
      continue;
    }
    const delay = RETRY_BASE_MS * Math.pow(2, Math.max(0, job.attempts - 1));
    const released = await prisma.videoAnalysisJob.updateMany({
      where: { id: job.id, status: "PROCESSING", claimToken: job.claimToken },
      data: { status: "PENDING", error: "Recovered stale worker lease.", nextAttemptAt: new Date(now.getTime() + delay), claimToken: null, claimedAt: null, leaseExpiresAt: null },
    });
    if (released.count) {
      retried++;
      await prisma.videoResume.updateMany({ where: { id: job.videoResumeId, analysisStatus: "PROCESSING" }, data: { analysisStatus: "PENDING", analysisError: null } });
    }
  }
  return { scanned: stale.length, retried, exhausted };
}

export async function releaseVideoAnalysisClaimForRetry(params: {
  jobId: string; claimToken: string; reason: string;
}) {
  const job = await prisma.videoAnalysisJob.findUnique({ where: { id: params.jobId } });
  if (!job || job.status !== "PROCESSING" || job.claimToken !== params.claimToken) return { released: false, exhausted: false };
  const now = new Date();
  if (job.attempts >= job.maxAttempts) {
    const terminal = await prisma.videoAnalysisJob.updateMany({
      where: { id: job.id, status: "PROCESSING", claimToken: params.claimToken },
      data: { status: "BLOCKED_INFRA", error: params.reason, completedAt: now, claimToken: null, claimedAt: null, leaseExpiresAt: null },
    });
    if (terminal.count) await prisma.videoResume.updateMany({
      where: { id: job.videoResumeId, analysisStatus: "PROCESSING" },
      data: { analysisStatus: "BLOCKED_INFRA", analysisError: params.reason },
    });
    return { released: false, exhausted: terminal.count === 1 };
  }
  const delay = RETRY_BASE_MS * Math.pow(2, Math.max(0, job.attempts - 1));
  const released = await prisma.videoAnalysisJob.updateMany({
    where: { id: job.id, status: "PROCESSING", claimToken: params.claimToken },
    data: { status: "PENDING", error: params.reason, nextAttemptAt: new Date(now.getTime() + delay), claimToken: null, claimedAt: null, leaseExpiresAt: null },
  });
  if (released.count) await prisma.videoResume.updateMany({
    where: { id: job.videoResumeId, analysisStatus: "PROCESSING" },
    data: { analysisStatus: "PENDING", analysisError: null },
  });
  return { released: released.count === 1, exhausted: false };
}
