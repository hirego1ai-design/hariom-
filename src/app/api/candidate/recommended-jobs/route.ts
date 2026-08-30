import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { handleApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { computeMatchScore } from '@/lib/matching/JobMatchingEngine';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id }
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
        company: job.company?.name || 'Unknown',
        location: job.location,
        matchScore: match.matchScore,
        matchingSkills: match.matchingSkills,
        missingSkills: match.missingSkills
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
    
    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    return handleApiError(error);
  }
}
