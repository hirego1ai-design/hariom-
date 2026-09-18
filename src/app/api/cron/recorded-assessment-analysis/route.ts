import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchRecordedAssessmentAnalysis } from "@/lib/recordedAssessmentAnalysis";

const BATCH_SIZE = 20;
const STALE_PROCESSING_MINUTES = 15;
const BASE_RETRY_MINUTES = 2;

function retryDelayMs(attempts: number) {
  return BASE_RETRY_MINUTES * 60_000 * 2 ** Math.max(0, attempts - 1);
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) return false;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : request.headers.get("x-cron-secret")?.trim();
  return secret ? supplied === secret : process.env.NODE_ENV !== "production" && supplied === "dev-cron-secret";
}

/**
 * Durable recovery boundary for analysis dispatch. Candidate response storage is
 * independent from worker availability; this job retries bounded infrastructure
 * failures without ever asking the candidate to record again.
 */
async function run(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MINUTES * 60_000);
  const jobs = await prisma.recordedAssessmentAnalysisJob.findMany({
    where: {
      OR: [
        { status: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] } },
        { status: "PROCESSING", startedAt: { lt: staleBefore } },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, responseId: true, attempts: true, maxAttempts: true, status: true, updatedAt: true },
  });
  const results = [];
  for (const job of jobs) {
    if (job.attempts >= job.maxAttempts) { results.push({ jobId: job.id, responseId: job.responseId, dispatched: false, reason: "max-attempts" }); continue; }
    if (job.status !== "PROCESSING" && now.getTime() - job.updatedAt.getTime() < retryDelayMs(job.attempts)) { results.push({ jobId: job.id, responseId: job.responseId, dispatched: false, reason: "backoff" }); continue; }
    if (job.status === "PROCESSING") {
      await prisma.$transaction([
        prisma.recordedAssessmentAnalysisJob.update({ where: { id: job.id }, data: { status: "BLOCKED_INFRA", error: "Worker callback timed out; queued for bounded recovery.", completedAt: now } }),
        prisma.recordedAssessmentResponse.update({ where: { id: job.responseId }, data: { analysisStatus: "BLOCKED_INFRA" } }),
      ]);
    }
    try {
      await dispatchRecordedAssessmentAnalysis(job.responseId);
      results.push({ jobId: job.id, responseId: job.responseId, dispatched: true });
    } catch {
      results.push({ jobId: job.id, responseId: job.responseId, dispatched: false });
    }
  }
  return NextResponse.json({ success: true, scanned: jobs.length, results, staleProcessingMinutes: STALE_PROCESSING_MINUTES });
}

export async function GET(request: NextRequest) { return run(request); }
export async function POST(request: NextRequest) { return run(request); }
