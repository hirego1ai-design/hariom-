import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    if (!candidateId) {
      throw new ApiError("Candidate ID parameter is required.", 400);
    }

    await enforceRateLimit(req, "employer_candidate_details_get", 60, 60000);
    const session = await getCurrentSession(req.headers);
    if (!session) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
      throw new ApiError("Forbidden. Employer, recruiter, or admin access required.", 403);
    }

    // Fetch candidate profile from database
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
        applications: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
            interviews: true,
          },
        },
        mcqAttempts: {
          include: {
            assessment: true,
          },
          orderBy: { startedAt: "desc" },
        },
        typingAssessments: {
          orderBy: { createdAt: "desc" },
        },
        mockInterviewSessions: {
          include: {
            turns: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      throw new ApiError("Candidate profile not found.", 404);
    }

    // Verify company scope once and reuse it when shaping the response.
    const scopedCompanyId = session.role === "ADMIN" ? null : (await getSessionCompany(session)).id;
    if (scopedCompanyId) {
      const companyId = scopedCompanyId;

      // Candidate must have applied to at least one job in this company
      const hasApplication = profile.applications.some(
        (app) => app.job.companyId === companyId
      );

      if (!hasApplication) {
        throw new ApiError("Access denied. Candidate has no active applications for your company.", 403);
      }
    }

    // Parse JSON fields (education and experience)
    let educationList: any[] = [];
    if (profile.education) {
      try {
        educationList = typeof profile.education === "string" 
          ? JSON.parse(profile.education) 
          : (profile.education as any);
      } catch {}
    }

    let experienceList: any[] = [];
    if (profile.experience) {
      try {
        experienceList = typeof profile.experience === "string" 
          ? JSON.parse(profile.experience) 
          : (profile.experience as any);
      } catch {}
    }

    // Map only persisted/measured evidence. Missing evidence stays unavailable;
    // never synthesize hiring signals or candidate attributes.
    const scopedApplications = session.role === "ADMIN"
      ? profile.applications
      : profile.applications.filter((app) => app.job.companyId === scopedCompanyId);
    const primaryApplication = scopedApplications[0];
    const overallMatch = primaryApplication?.matchScore ?? null;

    const ucpProfile = {
      id: profile.id,
      name: profile.user?.name || "Candidate",
      headline: profile.headline || null,
      currentCompany: experienceList[0]?.company || null,
      experience: `${profile.experienceYears} Years`,
      location: profile.location || null,
      preferredLocation: null,
      expectedSalary: null,
      noticePeriod: null,
      availability: null,
      preferredJobType: null,
      email: profile.user?.email || "",
      phone: profile.user?.phoneNumber || null,
      linkedIn: null,
      github: null,
      portfolio: "",
      profileLink: null,
      avatar: profile.user?.avatarUrl || null,
      isVerified: profile.isVerified,
      isEliteCandidate: null,
      isOpenToWork: null,
      appliedJob: primaryApplication?.job?.title || null,
      appliedDate: primaryApplication?.createdAt?.toISOString().split("T")[0] || null,
      source: null,
      about: profile.bio || null,
    };

    const ucpScores = {
      overallMatch,
      profileCompletion: null,
      recruiterViews: null,
      interviewInvites: primaryApplication?.interviews?.length || 0,
      hiringScore: null,
      matchBreakdown: [],
    };

    const ucpSkills = {
      technical: profile.skills.map((s) => ({
        name: s,
        level: null,
        years: null,
        verified: false,
      })),
      softSkills: [],
      languages: [],
      tools: [],
      cloud: [],
    };

    const ucpExperience = experienceList.map((exp: any) => ({
      company: exp.company || null,
      role: exp.role || null,
      type: exp.type || null,
      duration: exp.duration || null,
      durationYears: exp.duration || null,
      location: exp.location || null,
      achievements: exp.achievements || [],
      skills: exp.skills || [],
      aiImpact: null,
    }));

    const ucpEducation = educationList.map((edu: any) => ({
      institution: edu.institution || null,
      degree: edu.degree || null,
      year: edu.year || null,
      cgpa: edu.cgpa || edu.gpa || null,
      location: edu.location || null,
    }));

    const ucpAssessments = [
      ...profile.mcqAttempts.map((att) => ({
        name: att.assessment.title,
        date: att.submittedAt?.toISOString().split("T")[0] || att.startedAt.toISOString().split("T")[0],
        type: "Technical MCQ",
        score: `${att.score}%`,
        status: att.passed ? "Passed" : "Failed",
        badgeColor: att.passed ? "success" : "danger",
      })),
      ...profile.typingAssessments.map((att) => ({
        name: "Typing Speed & Accuracy",
        date: att.createdAt.toISOString().split("T")[0],
        type: "Typing Test",
        score: `${att.wpm} WPM / ${att.accuracy}% Acc`,
        status: "Certified",
        badgeColor: "success",
      })),
    ];

    const ucpVideoAnalysis = {
      duration: null,
      language: null,
      uploadDate: null,
      quality: null,
      overallReadinessScore: null,
      metrics: [],
      transcriptData: [],
      insights: {
        communicationSummary: "No video resume submitted.",
        strengths: [],
        weaknesses: [],
        speakingPattern: "",
        confidenceAnalysis: "",
        interviewReadiness: "",
        suggestedImprovements: [],
      },
    };

    return NextResponse.json({
      success: true,
      profile: ucpProfile,
      scores: ucpScores,
      skills: ucpSkills,
      experience: ucpExperience,
      education: ucpEducation,
      certifications: [],
      assessments: ucpAssessments,
      videoAnalysis: ucpVideoAnalysis,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
