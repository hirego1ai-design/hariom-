import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/auth';
import { enforceRateLimit, handleApiError, jsonError } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Read-only capability inspection; never executes agents or hiring actions. */
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError('Unauthorized', 401);
    if (!['EMPLOYER', 'RECRUITER'].includes(session.role)) return jsonError('Employer access required.', 403);
    await enforceRateLimit(request, 'hiring_pipeline_readiness', 30);
    const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } });
    if (!profile?.companyId) return jsonError('Company membership required.', 403);

    const suppliedId = new URL(request.url).searchParams.get('applicationId');
    const parsedId = z.string().uuid().optional().safeParse(suppliedId ?? undefined);
    if (!parsedId.success) return jsonError('applicationId must be a UUID.', 422);
    if (parsedId.data) {
      const application = await prisma.application.findFirst({
        where: { id: parsedId.data, job: { companyId: profile.companyId } }, select: { id: true },
      });
      if (!application) return jsonError('Application not found.', 404);
    }

    return NextResponse.json({
      success: true,
      applicationId: parsedId.data ?? null,
      automaticHiringPipeline: { available: false, status: 'NOT_IMPLEMENTED' },
      supportedAgentDispatch: {
        endpoint: '/api/agents/dispatch',
        agentIds: ['jd-generator', 'resume-evaluator'],
        requires: ['active eligible subscription', 'AI credits', 'budget capacity', 'configured provider'],
        readiness: 'NOT_EXECUTION_TESTED',
      },
      stages: [
        { agentId: 'jd-generator', capability: 'Generate a job description draft' },
        { agentId: 'candidate-matchmaker', capability: 'List tenant-linked candidates; compatibility ranking is not measured' },
        { agentId: 'resume-evaluator', capability: 'Evaluate a tenant-linked application against a job' },
        { agentId: 'mock-interview-copilot', capability: 'Draft a generic interview question; answer-based assessment is not implemented' },
        { agentId: 'communication-coach', capability: 'Compute transcript pacing and filler-word metrics from supplied measurements' },
        { agentId: 'security-judge', capability: 'Produce advisory flags from supplied telemetry; not a verified integrity assessment' },
      ],
      blockers: [
        'No application workflow connects all six stages to a verified interview/evidence lifecycle.',
        'Candidate compatibility ranking and answer-based interview assessment are not implemented.',
        'Proctoring evidence must be linked to the actual interview and independently verified.',
        'Agent recommendations require human review before a hiring decision.',
      ],
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}
