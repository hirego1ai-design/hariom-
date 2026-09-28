import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { enforceRateLimit, handleApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { computeMatchScore } from '@/lib/matching/JobMatchingEngine';

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "candidate_recommended_jobs", 60, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      include: {
        candidateSkills: {
          where: { isVisible: true },
        },
      },
    });
    
    if (!candidateProfile) {
      return NextResponse.json({ success: true, recommendations: [], message: 'Profile not found' });
    }
    
    const jobs = await prisma.jobListing.findMany({
      where: { status: 'ACTIVE' },
      take: 20,
      include: { company: true }
    });
    
    const recommendations = jobs.map(job => {
      const match = computeMatchScore(candidateProfile, job);
      return {
        jobId: job.id,
        title: job.title,
        company: job.company?.name || null,
        location: job.location,
        matchScore:
          match.breakdown.skillScore !== null || match.breakdown.experienceScore !== null
            ? match.matchScore
            : null,
        matchingSkills: match.matchingSkills,
        notEvidencedRequiredSkills: match.notEvidencedRequiredSkills,
        requiredSkillEvidenceCoverage: match.requiredSkillEvidenceCoverage,
        requiredSkillVerificationCoverage: match.requiredSkillVerificationCoverage,
        verificationCoverage: match.verificationCoverage,
        candidateSkillEvidenceAvailable: match.candidateSkillEvidenceAvailable,
        experienceEvidenceAvailable: match.experienceEvidenceAvailable,
        jobRequirementsAvailable: match.jobRequirementsAvailable
      };
    }).sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    
    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    return handleApiError(error);
  }
}
