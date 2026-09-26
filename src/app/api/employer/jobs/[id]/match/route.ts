import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerOrAdminSession, getSessionCompany } from '@/lib/routeAuthorization';
import { enforceRateLimit, handleApiError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { batchMatchCandidates } from '@/lib/matching/JobMatchingEngine';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireCompanyPlanFeature } from '@/lib/subscriptionAccess';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, 'employer_match_job');
    
    const { id: jobId } = await params;
    
    if (session.role === 'EMPLOYER' || session.role === 'RECRUITER') {
      const company = await getSessionCompany(session);
      const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
      if (!job || job.companyId !== company.id) {
        return NextResponse.json({ success: false, error: 'Job not found or access denied' }, { status: 403 });
      }
      await prisma.$transaction(tx =>
        requireCompanyPlanFeature(tx, company.id, ["MATCHING_SCORE"], "Your current plan does not include candidate matching.")
      );
    }
    
    const result = await batchMatchCandidates(jobId);
    
    await logAuditEvent({
      userId: session.id,
      action: 'JOB_MATCHING_TRIGGERED',
      resource: `job_${jobId}`,
      details: `Matched ${result.matchedCount} candidates`
    });
    
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
