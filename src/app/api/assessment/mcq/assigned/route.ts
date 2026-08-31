import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/apiSecurity";
import { ApplicationStatus } from "@prisma/client";

const eligibleStatuses: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.SCREENING,
  ApplicationStatus.AI_INTERVIEW,
  ApplicationStatus.ASSESSMENT,
  ApplicationStatus.SHORTLISTED,
];

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required", 403);
    }

    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
    if (!candidate) throw new ApiError("Candidate profile not found", 404);

    const applications = await prisma.application.findMany({
      where: { candidateProfileId: candidate.id, status: { in: eligibleStatuses } },
      select: {
        job: {
          select: {
            id: true,
            title: true,
            mcqAssessments: {
              where: { isActive: true },
              select: {
                id: true,
                title: true,
                description: true,
                durationMinutes: true,
                passingPercentage: true,
              },
            },
          },
        },
      },
    });

    const assessmentIds = applications.flatMap((application) => application.job.mcqAssessments.map((assessment) => assessment.id));
    const attempts = assessmentIds.length
      ? await prisma.mcqAttempt.findMany({
          where: { candidateProfileId: candidate.id, assessmentId: { in: assessmentIds } },
          select: { assessmentId: true, startedAt: true, submittedAt: true },
          orderBy: { startedAt: "desc" },
        })
      : [];
    const attemptsByAssessment = new Map<string, typeof attempts[number]>();
    for (const attempt of attempts) {
      if (!attemptsByAssessment.has(attempt.assessmentId)) {
        attemptsByAssessment.set(attempt.assessmentId, attempt);
      }
    }

    const assessments = applications.flatMap((application) =>
      application.job.mcqAssessments.map((assessment) => ({
        ...assessment,
        job: application.job,
        attempt: attemptsByAssessment.get(assessment.id) || null,
      })),
    );

    return NextResponse.json({ success: true, assessments });
  } catch (error) {
    return handleApiError(error);
  }
}
