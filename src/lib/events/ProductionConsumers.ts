import { createHash } from 'crypto';
import { z } from 'zod';
import type { SystemEvent } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ConsumerRegistry } from './ConsumerRegistry';
import { sourceManagedJobCandidates } from '@/lib/managedHiring/SourcingOrchestrator';

const id = z.string().min(1).max(128);
const company = (event: SystemEvent) => id.parse(event.companyId);

// UUIDv5 keys are accepted by the existing notification read/mark-read API.
// A retry never resets isRead or changes the original notification content.
export function eventNotificationId(eventKey: string, userId: string): string {
  const bytes = createHash('sha1')
    .update(Buffer.from('bcb3fbc853df5e4f9482d281e48c5af2', 'hex'))
    .update(JSON.stringify(['hirego-event-notification-v1', eventKey, userId])).digest();
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function applicationSubmitted(event: SystemEvent) {
  const payload = z.object({ applicationId: id, jobId: id }).parse(event.payload);
  await prisma.$transaction(async tx => {
    const application = await tx.application.findFirst({
      where: { id: payload.applicationId, jobId: payload.jobId, job: { companyId: company(event) } },
      select: { candidateProfile: { select: { userId: true } }, job: { select: { title: true } } },
    });
    if (!application) throw new Error('Application event has no matching tenant-owned record.');
    const userId = application.candidateProfile.userId;
    await tx.notification.upsert({
      where: { id: eventNotificationId(event.idempotencyKey, userId) }, update: {},
      create: { id: eventNotificationId(event.idempotencyKey, userId), userId, type: 'APPLICATION',
        title: 'Application received', message: `Your application for ${application.job.title} was received. This is not a selection or assessment result.` },
    });
  });
}

export async function applicationAssessmentCompleted(event: SystemEvent) {
  const payload = z.object({
    applicationId: id,
    jobId: id,
    assessmentId: id,
    attemptId: id,
    score: z.number().int().min(0).max(100),
    passed: z.boolean(),
    assessmentScope: z.literal('EMPLOYER_JOB'),
  }).parse(event.payload);

  await prisma.$transaction(async tx => {
    const companyId = company(event);
    const application = await tx.application.findFirst({
      where: {
        id: payload.applicationId,
        jobId: payload.jobId,
        job: { companyId },
      },
      select: {
        status: true,
        candidateProfile: { select: { user: { select: { name: true } } } },
        job: { select: { title: true } },
      },
    });
    if (!application) {
      throw new Error('Assessment event has no matching tenant-owned application.');
    }

    const recipients = await tx.employerProfile.findMany({
      where: {
        companyId,
        user: { role: { in: ['EMPLOYER', 'RECRUITER'] } },
      },
      select: { userId: true },
      take: 101,
      orderBy: { userId: 'asc' },
    });
    if (!recipients.length || recipients.length > 100) {
      throw new Error('Assessment notification recipient set requires operator review.');
    }

    const candidateName = application.candidateProfile.user.name || 'Candidate';
    const message =
      `${candidateName} completed the job-specific assessment for ${application.job.title} with a recorded score of ${payload.score}/100. Review the evidence before the next hiring action; this result did not automatically select or reject the candidate.`;

    await tx.notification.createMany({
      skipDuplicates: true,
      data: recipients.map(({ userId }) => ({
        id: eventNotificationId(event.idempotencyKey, userId),
        userId,
        type: 'ASSESSMENT',
        title: 'Candidate assessment completed',
        message,
      })),
    });
  });
}

export async function jobListingCreated(event: SystemEvent) {
  const payload = z.object({ jobId: id }).parse(event.payload);
  await prisma.$transaction(async tx => {
    const companyId = company(event);
    const job = await tx.jobListing.findFirst({ where: { id: payload.jobId, companyId }, select: { title: true } });
    if (!job) throw new Error('Job event has no matching tenant-owned record.');
    const recipients = await tx.employerProfile.findMany({
      where: { companyId, user: { role: { in: ['EMPLOYER', 'RECRUITER'] } } },
      select: { userId: true }, take: 101, orderBy: { userId: 'asc' },
    });
    // Bound fan-out without silently acknowledging incomplete delivery.
    if (!recipients.length || recipients.length > 100) throw new Error('Job notification recipient set requires operator review.');
    await tx.notification.createMany({ skipDuplicates: true, data: recipients.map(({ userId }) => ({
      id: eventNotificationId(event.idempotencyKey, userId), userId, type: 'JOB',
      title: 'Job listing created', message: `${job.title} was created for your company. Review the listing before sharing it.`,
    })) });
  });
}

export async function managedJobActivated(event: SystemEvent) {
  const payload = z.object({
    jobId: id,
    managedRequirementId: id,
    managedAgreementId: id,
    activatedById: id,
  }).parse(event.payload);
  const companyId = company(event);

  const job = await prisma.jobListing.findFirst({
    where: {
      id: payload.jobId,
      companyId,
      managedRequirementId: payload.managedRequirementId,
      managedAgreementId: payload.managedAgreementId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  if (!job) {
    throw new Error('Managed job activation event has no matching active tenant-owned job.');
  }

  await sourceManagedJobCandidates({
    jobId: payload.jobId,
    companyId,
    sourcedById: payload.activatedById,
  });
}

export async function hiringPipelineCompleted(event: SystemEvent) {
  const payload = z.object({ workflowId: id }).parse(event.payload);
  await prisma.$transaction(async tx => {
    const companyId = company(event);
    const workflow = await tx.workflowInstance.findFirst({
      where: { id: payload.workflowId, companyId, correlationId: event.correlationId, status: 'COMPLETED', workflowType: 'CANDIDATE_SCREENING' },
      select: { initiatedBy: true, checkpointState: true },
    });
    if (!workflow) throw new Error('Workflow event has no matching completed tenant-owned record.');
    const checkpoint = workflow.checkpointState && typeof workflow.checkpointState === 'object' && !Array.isArray(workflow.checkpointState)
      ? workflow.checkpointState as Record<string, unknown> : {};
    if (checkpoint.mode !== 'ADVISORY_ONLY') throw new Error('Completed pipeline event is not an advisory workflow.');
    const actor = await tx.user.findFirst({
      where: { id: workflow.initiatedBy, OR: [{ role: 'ADMIN' }, { role: { in: ['EMPLOYER', 'RECRUITER'] }, employerProfile: { companyId } }] },
      select: { id: true },
    });
    if (!actor) throw new Error('Workflow initiator is no longer authorized for this company.');
    await tx.notification.upsert({
      where: { id: eventNotificationId(event.idempotencyKey, actor.id) }, update: {},
      create: { id: eventNotificationId(event.idempotencyKey, actor.id), userId: actor.id, type: 'WORKFLOW',
        title: 'Advisory workflow completed', message: 'The advisory workflow finished. Review its evidence and limitations; no hiring decision has been made.' },
    });
  });
}

export function registerProductionConsumers() {
  ConsumerRegistry.register('APPLICATION_SUBMITTED', 'application-receipt-v1', applicationSubmitted);
  ConsumerRegistry.register('APPLICATION_ASSESSMENT_COMPLETED', 'assessment-completed-employer-notification-v1', applicationAssessmentCompleted);
  ConsumerRegistry.register('JOB_LISTING_CREATED', 'job-created-notification-v1', jobListingCreated);
  ConsumerRegistry.register('MANAGED_JOB_ACTIVATED', 'managed-job-safe-sourcing-v1', managedJobActivated);
  ConsumerRegistry.register('HIRING_PIPELINE_COMPLETED', 'advisory-completed-notification-v1', hiringPipelineCompleted);
}
