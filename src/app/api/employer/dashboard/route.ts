import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { reconcileExpiredJobs } from "@/lib/jobExpiry";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_dashboard_get", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") throw new ApiError("Administrator dashboard access requires an explicitly scoped company endpoint.", 400);
    const company = await getSessionCompany(session);
    const companyId = company.id;
    const now = new Date();
    await reconcileExpiredJobs(prisma, companyId);
    const [activeJobsCount, totalApplicantsCount, credits, upcomingInterviewsCount] = await Promise.all([
      prisma.jobListing.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.application.count({ where: { job: { companyId } } }),
      prisma.companyCredits.findUnique({ where: { companyId } }),
      prisma.interview.count({ where: { application: { job: { companyId } }, scheduledAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
    ]);
    return NextResponse.json({ success: true, metrics: { activeJobsCount, totalApplicantsCount, upcomingInterviewsCount, credits: credits ?? { jobPostsLeft: 0, resumeUnlocksLeft: 0, aiInterviewsLeft: 0 } } });
  } catch (error) { return handleApiError(error); }
}
