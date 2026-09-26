import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireEmployerOrAdminSession,
  getSessionCompany,
} from "@/lib/routeAuthorization";
import {
  enforceRateLimit,
  handleApiError,
  ApiError,
} from "@/lib/apiSecurity";
import { requireActiveCompanySubscription } from "@/lib/subscriptionAccess";
import {
  computeMatchScore,
  evaluateCandidateScreening,
} from "@/lib/matching/JobMatchingEngine";

const ACTIVE_WINDOW_DAYS = 30;
const MAX_POOL_EVALUATION = 500;
const MAX_RESULTS = 100;

const dispositionPriority = {
  SHORTLIST_RECOMMENDED: 0,
  ASSESSMENT_RECOMMENDED: 1,
  HUMAN_REVIEW_REQUIRED: 2,
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, "employer_candidate_sourcing", 30);
    const { id: jobId } = await params;
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        companyId: true,
        title: true,
        description: true,
        requirements: true,
        skillRequirements: true,
        matchingConfig: true,
        requiresJobReady: true,
        jobReadyRoleTitle: true,
        jobReadySeniority: true,
      },
    });
    if (!job) throw new ApiError("Job not found.", 404);

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== job.companyId) {
        throw new ApiError("Job access denied.", 403);
      }
      await prisma.$transaction((tx) =>
        requireActiveCompanySubscription(
          tx,
          company.id,
          "An active subscription is required to access proactive candidate sourcing.",
        )
      );
    }

    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);
    const candidates = await prisma.candidateProfile.findMany({
      where: {
        availabilityStatus: "ACTIVE_CONFIRMED",
        lastAvailabilityConfirmedAt: { gte: cutoff },
        ...(job.requiresJobReady &&
        job.jobReadyRoleTitle &&
        job.jobReadySeniority
          ? {
              readinessRecords: {
                some: {
                  roleTitle: job.jobReadyRoleTitle,
                  seniority: job.jobReadySeniority,
                  status: "JOB_READY",
                  OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        headline: true,
        location: true,
        skills: true,
        experience: true,
        experienceYears: true,
        lastAvailabilityConfirmedAt: true,
        candidateSkills: {
          where: { isVisible: true },
          select: {
            name: true,
            normalizedName: true,
            verificationStatus: true,
            validUntil: true,
            isVisible: true,
          },
        },
        sourcingRelationships: {
          where: { jobId },
          select: { status: true },
        },
        applications: {
          where: { jobId },
          select: { id: true, status: true },
        },
        user: { select: { name: true } },
        readinessRecords: {
          where: { status: "JOB_READY" },
          select: {
            roleTitle: true,
            seniority: true,
            score: true,
            validUntil: true,
          },
        },
      },
      orderBy: { lastAvailabilityConfirmedAt: "desc" },
      take: MAX_POOL_EVALUATION,
    });

    const evaluated = candidates.map(
      ({ sourcingRelationships, applications, ...candidate }) => {
        const match = computeMatchScore(candidate, job);
        const screening = evaluateCandidateScreening(match);

        return {
          ...candidate,
          source: "HIREGO_TALENT_POOL",
          sourcingStatus: sourcingRelationships[0]?.status ?? "SOURCED",
          application: applications[0] ?? null,
          match,
          screening,
        };
      },
    );

    // Ranking helps recruiters review the strongest evidenced candidates first,
    // but no score or missing field removes a candidate from the active pool.
    // This prevents a capable candidate with incomplete profile evidence from
    // disappearing because of a keyword or score threshold.
    evaluated.sort((a, b) => {
      const dispositionDelta =
        dispositionPriority[a.screening.disposition] -
        dispositionPriority[b.screening.disposition];
      if (dispositionDelta !== 0) return dispositionDelta;
      if (b.match.matchScore !== a.match.matchScore) {
        return b.match.matchScore - a.match.matchScore;
      }
      return (
        (b.lastAvailabilityConfirmedAt?.getTime() ?? 0) -
        (a.lastAvailabilityConfirmedAt?.getTime() ?? 0)
      );
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        requiresJobReady: job.requiresJobReady,
      },
      source: "HIREGO_TALENT_POOL",
      policy: {
        availabilityWindowDays: ACTIVE_WINDOW_DAYS,
        requiresExplicitCandidateConfirmation: true,
        screeningPolicy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
        automaticRejection: false,
        missingEvidenceAction: "ASSESSMENT_OR_HUMAN_REVIEW",
        preferredSkillsAreMandatory: false,
        suppresses: [
          "NOT_LOOKING",
          "JOINED",
          "TEMPORARILY_UNAVAILABLE",
          "STALE_CONFIRMATION",
        ],
      },
      evaluatedCount: evaluated.length,
      candidates: evaluated.slice(0, MAX_RESULTS),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
