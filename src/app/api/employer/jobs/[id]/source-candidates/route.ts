import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployerOrAdminSession, getSessionCompany } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, ApiError } from "@/lib/apiSecurity";

const ACTIVE_WINDOW_DAYS = 30;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, "employer_candidate_sourcing", 30);
    const { id: jobId } = await params;
    const job = await prisma.jobListing.findUnique({ where: { id: jobId }, select: { id: true, companyId: true, title: true, requiresJobReady: true, jobReadyRoleTitle: true, jobReadySeniority: true } });
    if (!job) throw new ApiError("Job not found.", 404);
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== job.companyId) throw new ApiError("Job access denied.", 403);
    }
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86400000);
    const candidates = await prisma.candidateProfile.findMany({
      where: {
        availabilityStatus: "ACTIVE_CONFIRMED",
        lastAvailabilityConfirmedAt: { gte: cutoff },
        ...(job.requiresJobReady && job.jobReadyRoleTitle && job.jobReadySeniority ? {
          readinessRecords: { some: { roleTitle: job.jobReadyRoleTitle, seniority: job.jobReadySeniority, status: "JOB_READY", OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] } },
        } : {}),
      },
      select: { id: true, headline: true, location: true, skills: true, experienceYears: true, lastAvailabilityConfirmedAt: true, user: { select: { name: true } }, readinessRecords: { where: { status: "JOB_READY" }, select: { roleTitle: true, seniority: true, score: true, validUntil: true } } },
      orderBy: { lastAvailabilityConfirmedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, job: { id: job.id, title: job.title, requiresJobReady: job.requiresJobReady }, policy: { availabilityWindowDays: ACTIVE_WINDOW_DAYS, requiresExplicitCandidateConfirmation: true, suppresses: ["NOT_LOOKING","JOINED","TEMPORARILY_UNAVAILABLE","STALE_CONFIRMATION"] }, candidates });
  } catch(e) { return handleApiError(e); }
}
