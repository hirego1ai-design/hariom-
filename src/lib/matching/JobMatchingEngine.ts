import { prisma } from '@/lib/prisma';

export interface MatchingConfig {
  weightExperience: number;
  weightEducation: number;
  weightSkills: number;
  autoArchiveScore: number;
  autoInterviewLimit: number;
}

const DEFAULT_CONFIG: MatchingConfig = {
  weightExperience: 40,
  weightEducation: 20,
  weightSkills: 40,
  autoArchiveScore: 70,
  autoInterviewLimit: 10
};

export function computeMatchScore(candidate: any, job: any) {
  const requestedConfig = (job.matchingConfig && typeof job.matchingConfig === 'object') ? job.matchingConfig : {};
  const config = {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(Object.entries(requestedConfig).filter(([, value]) => typeof value === 'number' && Number.isFinite(value))),
  };
  
  const rawRequirements = job.skillRequirements ?? job.requirements ?? [];
  const jobReqs = Array.isArray(rawRequirements) ? rawRequirements.filter((skill): skill is string => typeof skill === 'string') : [];
  const candidateSkillRecords = Array.isArray(candidate.candidateSkills) ? candidate.candidateSkills : [];
  const candSkills = candidateSkillRecords.length > 0
    ? candidateSkillRecords.filter((skill: any) => skill?.isVisible !== false).map((skill: any) => skill.name)
    : (candidate.skills || []);
  const now = Date.now();
  const verifiedSkillNames = new Set(
    candidateSkillRecords
      .filter((skill: any) =>
        skill?.isVisible !== false
        && ["ASSESSMENT_VALIDATED", "VERIFIED"].includes(skill?.verificationStatus)
        && (!skill?.validUntil || new Date(skill.validUntil).getTime() > now)
      )
      .map((skill: any) => String(skill.name).toLowerCase()),
  );
  
  let skillScore = 0;
  const matchingSkills: string[] = [];
  const verifiedMatchingSkills: string[] = [];
  const selfDeclaredMatchingSkills: string[] = [];
  const missingSkills: string[] = [];
  
  const candSkillsLower = candSkills.map((s: string) => s.toLowerCase());
  
  if (jobReqs.length > 0) {
    for (const req of jobReqs) {
      if (candSkillsLower.includes(req.toLowerCase())) {
        matchingSkills.push(req);
        if (verifiedSkillNames.has(req.toLowerCase())) verifiedMatchingSkills.push(req);
        else selfDeclaredMatchingSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }
    skillScore = (matchingSkills.length / jobReqs.length) * 100;
  } else {
    skillScore = 100;
  }
  
  let requiredExp = 0;
  const expMatch = job.description?.match(/(\d+)\s*(?:\+|-|to|years?)\s*(?:\d+)?\s*years?/i);
  if (expMatch) {
    requiredExp = parseInt(expMatch[1], 10);
  }
  
  let experienceScore = 0;
  if (requiredExp === 0) {
    experienceScore = 100;
  } else {
    const candExp = candidate.experienceYears || 0;
    if (candExp >= requiredExp) {
      experienceScore = 100;
    } else {
      experienceScore = (candExp / requiredExp) * 100;
    }
  }
  
  // No education requirement is stored for this job, so it is not scored.
  const educationScore = null;
  const weightedDimensions = [
    { score: skillScore, weight: Math.max(0, config.weightSkills) },
    { score: experienceScore, weight: Math.max(0, config.weightExperience) },
  ].filter((dimension) => dimension.weight > 0);
  const totalWeight = weightedDimensions.reduce((total, dimension) => total + dimension.weight, 0);
  const rawScore = (
    weightedDimensions.reduce((total, dimension) => total + dimension.score * dimension.weight, 0)
  ) / (totalWeight || 1);
  
  const matchScore = Math.round(rawScore);
  
  return {
    matchScore,
    matchingSkills,
    verifiedMatchingSkills,
    selfDeclaredMatchingSkills,
    missingSkills,
    verificationCoverage: jobReqs.length > 0
      ? Math.round((verifiedMatchingSkills.length / jobReqs.length) * 100)
      : 100,
    breakdown: {
      skillScore: Math.round(skillScore),
      experienceScore: Math.round(experienceScore),
      educationScore
    }
  };
}

export async function batchMatchCandidates(jobId: string, options?: any) {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    include: {
      applications: {
        include: {
          candidateProfile: {
            include: {
              candidateSkills: true,
            },
          }
        }
      }
    }
  });
  
  if (!job) throw new Error('Job not found');
  
  let statusUnchanged = 0;
  
  const results = [];
  let suppressedUnavailable = 0;
  let reconfirmationRequired = 0;
  
  for (const app of job.applications) {
    const candidate = app.candidateProfile;
    if (!candidate) continue;
    const availability = candidate.availabilityStatus;
    // An application is an explicit expression of interest in this specific job.
    // Global availability is informative here; it must not hide an organic applicant.
    if (availability === 'NOT_LOOKING' || availability === 'JOINED' || availability === 'TEMPORARILY_UNAVAILABLE') suppressedUnavailable++;
    if (availability === 'RECONFIRMATION_REQUIRED') reconfirmationRequired++;
    
    const match = computeMatchScore(candidate, job);
    
    const matchSummary = `Rules-based match score: ${match.matchScore}%. Matched ${match.matchingSkills.length} skills. Missing: ${match.missingSkills.length > 0 ? match.missingSkills.join(', ') : 'None'}.`;
    
    await prisma.application.update({
      where: { id: app.id },
      data: {
        matchScore: match.matchScore,
        aiSummary: matchSummary,
      }
    });
    statusUnchanged++;
    
    results.push({
      applicationId: app.id,
      candidateId: candidate.id,
      availabilityStatus: availability,
      availabilityConfirmedAt: candidate.lastAvailabilityConfirmedAt,
      ...match
    });
  }
  
  return {
    matchedCount: results.length,
    evaluatedApplications: job.applications.length,
    unavailableApplicantSignals: suppressedUnavailable,
    reconfirmationRequired,
    statusUnchanged,
    results
  };
}
