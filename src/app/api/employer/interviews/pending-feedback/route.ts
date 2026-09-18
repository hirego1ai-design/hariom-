import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const companyId = session.role === "ADMIN" ? null : (await getSessionCompany(session)).id;
    const obligations = await prisma.interviewRoundProgress.findMany({
      where: {
        status: "ENDED_PENDING_FEEDBACK",
        ...(companyId ? { application: { job: { companyId } } } : {}),
        round: { mandatoryFeedback: true, interviewers: { some: { userId: session.id, required: true } } },
        feedbacks: { none: { authorId: session.id, finalizedAt: { not: null } } },
      },
      include: { interview: true, round: true, application: { include: { job: { select: { title: true } }, candidateProfile: { include: { user: { select: { name: true } } } } } } },
      orderBy: { updatedAt: "asc" },
    });
    return NextResponse.json({ success: true, blocking: obligations.length > 0, count: obligations.length, pending: obligations.map((o) => ({ interviewId: o.interviewId, roundName: o.round.name, jobTitle: o.application.job.title, candidateName: o.application.candidateProfile.user?.name || "Candidate", endedAt: o.updatedAt })) });
  } catch (e) { return handleApiError(e); }
}
