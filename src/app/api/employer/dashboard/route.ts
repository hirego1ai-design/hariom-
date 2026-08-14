import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    let activeJobsCount = 0;
    let totalApplicantsCount = 0;
    let upcomingInterviewsCount = 0;
    let companyCredits: any = {
      jobPostsLeft: 0,
      resumeUnlocksLeft: 0,
      aiInterviewsLeft: 0,
    };

    try {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
        include: { company: true },
      });

      if (employerProfile) {
        const companyId = employerProfile.companyId;

        const [jobsCount, appsCount, credits, interviewsCount] = await Promise.all([
          prisma.jobListing.count({ where: { companyId, status: "ACTIVE" } }),
          prisma.application.count({ where: { job: { companyId } } }),
          prisma.companyCredits.findUnique({ where: { companyId } }),
          prisma.interview.count({ where: { application: { job: { companyId } } } }),
        ]);

        activeJobsCount = jobsCount;
        totalApplicantsCount = appsCount;
        if (credits) companyCredits = credits;
        upcomingInterviewsCount = interviewsCount;
      }
    } catch (dbError) {
      console.error("Dashboard metrics DB error:", dbError);
    }

    return NextResponse.json({
      success: true,
      metrics: {
        activeJobsCount,
        totalApplicantsCount,
        upcomingInterviewsCount,
        credits: companyCredits,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
