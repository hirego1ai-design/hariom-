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
      automaticHiringPipeline: {
        available: false,
        status: 'HUMAN_GATED_BY_DESIGN',
        note: 'HireGo intentionally does not run selection, rejection, offer, financial, or joining confirmation without an authorized human boundary.',
      },
      managedHiringAutomation: {
        available: true,
        status: 'HUMAN_GATED_AUTOMATION_AVAILABLE',
        requirementActivation: 'CREATES_TRACEABLE_ACTIVE_JOBS',
        internalTalentPoolSourcing: 'AUTOMATIC_DISCOVERY_ONLY',
        candidateScreening: 'EVIDENCE_FIRST',
        interviewEvaluation: 'ANSWER_BASED_ADVISORY_AVAILABLE',
        consequentialActions: 'HUMAN_APPROVAL_REQUIRED',
        automaticRejection: false,
      },
      safeStateOrchestration: {
        available: true,
        status: 'STATE_ORCHESTRATION_AVAILABLE',
        mode: 'SAFE_NEXT_ACTION',
        endpoint: '/api/employer/candidates/:applicationId/orchestration',
        automaticRejection: false,
        note: 'The orchestrator resolves the next safe application step without executing consequential selection, rejection, offer, or joining actions.',
      },
      supportedAgentDispatch: {
        endpoint: '/api/agents/dispatch',
        agentIds: ['jd-generator', 'resume-evaluator'],
        requires: ['active eligible subscription', 'AI credits', 'budget capacity', 'configured provider'],
        readiness: 'NOT_EXECUTION_TESTED',
      },
      stages: [
        { agentId: 'jd-generator', capability: 'Generate a job description draft' },
        { agentId: 'candidate-matchmaker', capability: 'Rank tenant-authorized applicants with deterministic evidence-first compatibility and screening recommendations; no automatic rejection' },
        { agentId: 'resume-evaluator', capability: 'Evaluate a tenant-linked application against a job' },
        { agentId: 'mock-interview-copilot', capability: 'Run text-only candidate practice interview turns; practice scores are not hiring decisions' },
        { agentId: 'live-interview-evaluator', capability: 'Evaluate a provenance-tagged completed live-interview transcript against the tenant-owned job; advisory only' },
        { agentId: 'communication-coach', capability: 'Compute transcript pacing and filler-word metrics from supplied measurements' },
        { agentId: 'security-judge', capability: 'Produce advisory flags from supplied telemetry; not a verified integrity assessment' },
      ],
      blockers: [
        'External job-board/ATS sourcing requires approved provider APIs and credentials; HireGo talent-pool and inbound application sourcing are available without those providers.',
        'Live email, WhatsApp, transcription, TURN and external AI-provider delivery still require configured production credentials and provider-side runtime proof.',
        'Browser proctoring telemetry remains client-reported advisory evidence and requires human interpretation; it never auto-rejects a candidate.',
        'A production-like end-to-end runtime proof is still required after deployment before claiming live-provider production readiness.',
      ],
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}
