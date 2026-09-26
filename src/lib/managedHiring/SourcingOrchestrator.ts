import { prisma } from "@/lib/prisma";
import {
  computeMatchScore,
  evaluateCandidateScreening,
} from "@/lib/matching/JobMatchingEngine";

const ACTIVE_WINDOW_DAYS = 30;
const MAX_POOL_EVALUATION = 500;
const MAX_SAFE_SOURCED = 50;

const priority = {
  SHORTLIST_RECOMMENDED: 0,
  ASSESSMENT_RECOMMENDED: 1,
  HUMAN_REVIEW_REQUIRED: 2,
} as const;

export async function sourceManagedJobCandidates(params: {
  jobId: string;
  companyId: string;
  sourcedById: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(params.limit ?? MAX_SAFE_SOURCED, 1), 100);
  const [job, actor] = await Promise.all([
    prisma.jobListing.findFirst({
      where: {
        id: params.jobId,
        companyId: params.companyId,
        status: "ACTIVE",
        managedRequirementId: { not: null },
        managedAgreementId: { not: null },
      },
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
    }),
    prisma.user.findUnique({
      where: { id: params.sourcedById },
      select: {
        id: true,
        role: true,
        employerProfile: { select: { companyId: true } },
      },
    }),
  ]);

  if (!job) throw new Error("Active managed hiring job was not found.");
  const actorAllowed =
    actor?.role === "ADMIN" ||
    ((actor?.role === "EMPLOYER" || actor?.role === "RECRUITER") &&
      actor.employerProfile?.companyId === params.companyId);
  if (!actor || !actorAllowed) {
    throw new Error("Managed sourcing actor is not authorized for this company.");
  }

  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);
  const candidates = await prisma.candidateProfile.findMany({
    where: {
      availabilityStatus: "ACTIVE_CONFIRMED",
      lastAvailabilityConfirmedAt: { gte: cutoff },
      applications: { none: { jobId: job.id } },
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
    },
    orderBy: { lastAvailabilityConfirmedAt: "desc" },
    take: MAX_POOL_EVALUATION,
  });

  const ranked = candidates
    .map((candidate) => {
      const match = computeMatchScore(candidate, job);
      const screening = evaluateCandidateScreening(match);
      return { candidate, match, screening };
    })
    .sort((a, b) => {
      const disposition =
        priority[a.screening.disposition] - priority[b.screening.disposition];
      if (disposition !== 0) return disposition;
      if (b.match.verificationCoverage !== a.match.verificationCoverage) {
        return b.match.verificationCoverage - a.match.verificationCoverage;
      }
      return b.match.matchScore - a.match.matchScore;
    })
    .slice(0, limit);

  let created = 0;
  let existing = 0;
  for (const item of ranked) {
    const relationship =
      await prisma.candidateSourcingRelationship.findUnique({
        where: {
          jobId_candidateProfileId: {
            jobId: job.id,
            candidateProfileId: item.candidate.id,
          },
        },
        select: { id: true },
      });
    if (relationship) {
      existing++;
      continue;
    }
    await prisma.candidateSourcingRelationship.create({
      data: {
        jobId: job.id,
        candidateProfileId: item.candidate.id,
        companyId: job.companyId,
        sourcedById: params.sourcedById,
        status: "SOURCED",
      },
    });
    created++;
  }

  return {
    jobId: job.id,
    evaluatedCount: candidates.length,
    selectedForSafeSourcing: ranked.length,
    created,
    existing,
    invitationsSent: 0,
    applicationsCreated: 0,
    automaticRejections: 0,
    policy: "DISCOVERY_ONLY_EVIDENCE_FIRST",
  };
}
