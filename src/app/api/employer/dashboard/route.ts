import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN") {
      return jsonError("Employer access required", 403);
    }

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
      select: { companyId: true },
    });

    if (!employerProfile) {
      return jsonError("Employer profile not found", 404);
    }

    const companyId = employerProfile.companyId;
    const [activeJobsCount, totalApplicantsCount, credits, upcomingInterviewsCount] = await Promise.all([
      prisma.jobListing.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.application.count({ where: { job: { companyId } } }),
      prisma.companyCredits.findUnique({ where: { companyId } }),
      prisma.interview.count({ where: { application: { job: { companyId } } } }),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        activeJobsCount,
        totalApplicantsCount,
        upcomingInterviewsCount,
        credits: credits ?? {
          jobPostsLeft: 0,
          resumeUnlocksLeft: 0,
          aiInterviewsLeft: 0,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
