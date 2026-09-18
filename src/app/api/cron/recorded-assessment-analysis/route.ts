import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchRecordedAssessmentAnalysis } from "@/lib/recordedAssessmentAnalysis";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;

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
  const jobs = await prisma.recordedAssessmentAnalysisJob.findMany({
    where: { status: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] }, attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { updatedAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, responseId: true, attempts: true },
  });
  const results = [];
  for (const job of jobs) {
    try {
      await dispatchRecordedAssessmentAnalysis(job.responseId);
      results.push({ jobId: job.id, responseId: job.responseId, dispatched: true });
    } catch {
      results.push({ jobId: job.id, responseId: job.responseId, dispatched: false });
    }
  }
  return NextResponse.json({ success: true, scanned: jobs.length, results, maxAttempts: MAX_ATTEMPTS });
}

export async function GET(request: NextRequest) { return run(request); }
export async function POST(request: NextRequest) { return run(request); }
