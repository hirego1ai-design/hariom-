import { MemoryScopeLevel, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type IntelligenceActor = { userId: string; role: Role; companyId?: string | null };
export type IntelligenceScope = { scopeLevel: MemoryScopeLevel; scopeId: string };

export class IntelligenceScopeAccessError extends Error {
  constructor(message = "The requested intelligence context is not authorized for this actor.") {
    super(message);
    this.name = "IntelligenceScopeAccessError";
  }
}

export async function assertIntelligenceScopeAccess(actor: IntelligenceActor, scope: IntelligenceScope): Promise<void> {
  if (actor.role === Role.ADMIN) return;

  if (scope.scopeLevel === MemoryScopeLevel.COMPANY) {
    if (!actor.companyId || actor.companyId !== scope.scopeId) throw new IntelligenceScopeAccessError();
    return;
  }

  if (scope.scopeLevel === MemoryScopeLevel.CANDIDATE) {
    if (actor.role === Role.CANDIDATE) {
      const owned = await prisma.candidateProfile.findFirst({ where: { id: scope.scopeId, userId: actor.userId }, select: { id: true } });
      if (!owned) throw new IntelligenceScopeAccessError();
      return;
    }
    if (!actor.companyId) throw new IntelligenceScopeAccessError();
    const related = await prisma.candidateProfile.findFirst({
      where: { id: scope.scopeId, OR: [
        { applications: { some: { job: { companyId: actor.companyId } } } },
        { sourcingRelationships: { some: { companyId: actor.companyId } } },
      ] },
      select: { id: true },
    });
    if (!related) throw new IntelligenceScopeAccessError();
    return;
  }

  if (scope.scopeLevel === MemoryScopeLevel.JOB) {
    const job = await prisma.jobListing.findUnique({ where: { id: scope.scopeId }, select: { companyId: true } });
    if (!job) throw new IntelligenceScopeAccessError();
    if (actor.role === Role.CANDIDATE) {
      const ownedApplication = await prisma.application.findFirst({ where: { jobId: scope.scopeId, candidateProfile: { userId: actor.userId } }, select: { id: true } });
      if (!ownedApplication) throw new IntelligenceScopeAccessError();
      return;
    }
    if (!actor.companyId || job.companyId !== actor.companyId) throw new IntelligenceScopeAccessError();
    return;
  }

  if (scope.scopeLevel === MemoryScopeLevel.APPLICATION) {
    const app = await prisma.application.findUnique({ where: { id: scope.scopeId }, select: { candidateProfile: { select: { userId: true } }, job: { select: { companyId: true } } } });
    if (!app) throw new IntelligenceScopeAccessError();
    if (actor.role === Role.CANDIDATE) {
      if (app.candidateProfile.userId !== actor.userId) throw new IntelligenceScopeAccessError();
      return;
    }
    if (!actor.companyId || app.job.companyId !== actor.companyId) throw new IntelligenceScopeAccessError();
    return;
  }

  if (scope.scopeLevel === MemoryScopeLevel.INTERVIEW) {
    const interview = await prisma.interview.findUnique({
      where: { id: scope.scopeId },
      select: { application: { select: { candidateProfile: { select: { userId: true } }, job: { select: { companyId: true } } } } },
    });
    if (!interview) throw new IntelligenceScopeAccessError();
    if (actor.role === Role.CANDIDATE) {
      if (interview.application.candidateProfile.userId !== actor.userId) throw new IntelligenceScopeAccessError();
      return;
    }
    if (!actor.companyId || interview.application.job.companyId !== actor.companyId) throw new IntelligenceScopeAccessError();
    return;
  }

  if (scope.scopeLevel === MemoryScopeLevel.WORKFLOW) {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: scope.scopeId }, select: { companyId: true } });
    if (!workflow || actor.role === Role.CANDIDATE || !actor.companyId || workflow.companyId !== actor.companyId) throw new IntelligenceScopeAccessError();
    return;
  }

  throw new IntelligenceScopeAccessError();
}
