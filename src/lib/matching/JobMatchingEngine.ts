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
  const candSkills = candidate.skills || [];
  
  let skillScore = 0;
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  
  const candSkillsLower = candSkills.map((s: string) => s.toLowerCase());
  
  if (jobReqs.length > 0) {
    for (const req of jobReqs) {
      if (candSkillsLower.includes(req.toLowerCase())) {
        matchingSkills.push(req);
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
    missingSkills,
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
          candidateProfile: true
        }
      }
    }
  });
  
  if (!job) throw new Error('Job not found');
  
  let statusUnchanged = 0;
  
  const results = [];
  
  for (const app of job.applications) {
    const candidate = app.candidateProfile;
    if (!candidate) continue;
    
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
      ...match
    });
  }
  
  return {
    matchedCount: job.applications.length,
    statusUnchanged,
    results
  };
}
