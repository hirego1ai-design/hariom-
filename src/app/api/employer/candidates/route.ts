import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    let candidates: any[] = [];

    try {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });

      if (employerProfile) {
        const companyId = employerProfile.companyId;

        // Fetch all applications for this employer's jobs with full candidate details
        const applications = await prisma.application.findMany({
          where: { job: { companyId } },
          include: {
            candidateProfile: true,
            job: {
              select: {
                title: true,
                location: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Transform applications to candidate format
        candidates = applications.map((app) => {
          const profile = app.candidateProfile;
          const job = app.job;
          
          // Determine stage based on application status
          let stage = "Applied";
          if (app.status === "SHORTLISTED") stage = "AI Screening";
          else if (app.status === "ASSESSMENT") stage = "Assessment";
          else if (app.status === "AI_INTERVIEW") stage = "AI Interview";
          else if (app.status === "SCREENING") stage = "Video Resume Review";
          else if (app.status === "HIRED") stage = "Joined";
          else if (app.status === "REJECTED") stage = "Rejected";

          // Calculate match score from the application's matchScore field
          const matchScore = app.matchScore || 0;

          // Use available profile data with defaults
          const name = profile.headline?.split(" ")[0] || "Unknown";
          
          return {
            id: profile.id,
            name: name,
            matchScore,
            experience: `${Math.round(profile.experienceYears)}y Exp`,
            avatar: profile.resumeUrl ? `https://ui-avatars.com/api/?name=${name}&background=random` : `https://ui-avatars.com/api/?name=${name}&background=random`,
            stage,
            jobId: app.jobId,
            currentRole: profile.headline || "No Role",
            appliedJob: job?.title || "Unknown Position",
            education: "N/A",
            currentCompany: "N/A",
            expectedSalary: "$0/yr",
            noticePeriod: "N/A",
            currentLocation: profile.location || "Unknown",
            preferredLocation: "N/A",
            hasVideoResume: !!profile.resumeUrl,
            assessmentScore: matchScore,
            aiInterviewScore: matchScore,
            recruiterNotes: profile.bio || "",
            recommendation: "Needs Review",
            recommendationReason: "",
            source: "Direct",
            partner: "Direct",
            applicationDate: app.createdAt?.toISOString().split("T")[0] || "Unknown",
            lastActivity: app.updatedAt ? `${app.updatedAt.toLocaleDateString()} ${app.updatedAt.toLocaleTimeString()}` : "Never",
            availability: "N/A",
          };
        });
      }
    } catch (dbError) {
      console.error("Candidates DB error:", dbError);
    }

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    return handleApiError(error);
  }
}
