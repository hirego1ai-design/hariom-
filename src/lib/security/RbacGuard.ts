import { prisma } from '@/lib/prisma';
import { TenantContext, TenantAccessError, validateTenantAccess, isGlobalScope } from './TenantContext';
import { Role, MemoryScopeLevel } from '@prisma/client';

export class RbacAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RbacAccessDeniedError';
  }
}

export class RbacGuard {
  /**
   * Asserts that the context has ownership or access to the resource based on company ID.
   * @param context The user's tenant context.
   * @param resource An object containing the resource's companyId.
   * @throws {RbacAccessDeniedError} If access is denied due to tenant mismatch.
   */
  static assertOwnership(context: TenantContext, resource: { companyId?: string | null }): void {
    try {
      validateTenantAccess(context, resource.companyId ?? null);
    } catch (error) {
      if (error instanceof TenantAccessError) {
        throw new RbacAccessDeniedError(`Ownership assertion failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Asserts that the context's role is within the allowed roles.
   * @param context The user's tenant context.
   * @param allowedRoles The list of roles allowed to perform the action.
   * @throws {RbacAccessDeniedError} If the user's role is not in the allowed list.
   */
  static assertRole(context: TenantContext, allowedRoles: Role[]): void {
    if (!allowedRoles.includes(context.userRole)) {
      throw new RbacAccessDeniedError(
        `Role ${context.userRole} is not permitted. Allowed roles: ${allowedRoles.join(', ')}`
      );
    }
  }

  /**
   * Asserts that the context has access to a specific scope level and ID.
   * Uses Prisma to verify ownership chains through the actual business schema.
   * @param context The user's tenant context.
   * @param scopeLevel The memory scope level of the resource.
   * @param scopeId The ID of the specific resource scope.
   * @throws {RbacAccessDeniedError} If access to the scope is denied.
   */
  static async assertScopeAccess(
    context: TenantContext,
    scopeLevel: MemoryScopeLevel,
    scopeId: string
  ): Promise<void> {
    if (isGlobalScope(context)) {
      return; // Admins with global scope have access to all scopes
    }

    switch (scopeLevel) {
      case MemoryScopeLevel.COMPANY: {
        // User must belong to the company
        if (context.companyId !== scopeId) {
          throw new RbacAccessDeniedError(`User does not belong to company ${scopeId}`);
        }
        break;
      }

      case MemoryScopeLevel.JOB: {
        // Job must belong to user's company
        const job = await prisma.jobListing.findUnique({
          where: { id: scopeId },
          select: { companyId: true },
        });
        if (!job || job.companyId !== context.companyId) {
          throw new RbacAccessDeniedError(
            `Job ${scopeId} not found or does not belong to user's company`
          );
        }
        break;
      }

      case MemoryScopeLevel.CANDIDATE: {
        // Only the candidate themselves, or employers with an application from this candidate
        if (context.userRole === Role.CANDIDATE) {
          // scopeId is a CandidateProfile.id — verify it belongs to this user
          const profile = await prisma.candidateProfile.findUnique({
            where: { id: scopeId },
            select: { userId: true },
          });
          if (!profile || profile.userId !== context.userId) {
            throw new RbacAccessDeniedError(
              `Candidate ${context.userId} cannot access candidate profile ${scopeId}`
            );
          }
        } else {
          // Employer/Recruiter: must have an application from this candidate for a job in their company
          const hasApplication = await prisma.application.findFirst({
            where: {
              candidateProfileId: scopeId,
              job: {
                companyId: context.companyId!,
              },
            },
          });
          if (!hasApplication) {
            throw new RbacAccessDeniedError(
              `Company does not have any application from candidate ${scopeId}`
            );
          }
        }
        break;
      }

      case MemoryScopeLevel.APPLICATION: {
        const application = await prisma.application.findUnique({
          where: { id: scopeId },
          select: {
            candidateProfileId: true,
            candidateProfile: { select: { userId: true } },
            job: { select: { companyId: true } },
          },
        });

        if (!application) {
          throw new RbacAccessDeniedError(`Application ${scopeId} not found`);
        }

        if (context.userRole === Role.CANDIDATE) {
          if (application.candidateProfile.userId !== context.userId) {
            throw new RbacAccessDeniedError(
              `Candidate ${context.userId} cannot access application ${scopeId}`
            );
          }
        } else {
          if (application.job.companyId !== context.companyId) {
            throw new RbacAccessDeniedError(
              `Application ${scopeId} does not belong to user's company`
            );
          }
        }
        break;
      }

      case MemoryScopeLevel.INTERVIEW: {
        const interview = await prisma.interview.findUnique({
          where: { id: scopeId },
          select: {
            application: {
              select: {
                candidateProfile: { select: { userId: true } },
                job: { select: { companyId: true } },
              },
            },
          },
        });

        if (!interview) {
          throw new RbacAccessDeniedError(`Interview ${scopeId} not found`);
        }

        if (context.userRole === Role.CANDIDATE) {
          if (interview.application.candidateProfile.userId !== context.userId) {
            throw new RbacAccessDeniedError(
              `Candidate cannot access interview ${scopeId}`
            );
          }
        } else {
          if (interview.application.job.companyId !== context.companyId) {
            throw new RbacAccessDeniedError(
              `Interview ${scopeId} does not belong to user's company`
            );
          }
        }
        break;
      }

      case MemoryScopeLevel.WORKFLOW: {
        const workflow = await prisma.workflowInstance.findUnique({
          where: { id: scopeId },
          select: { companyId: true },
        });
        if (!workflow) {
          throw new RbacAccessDeniedError(`Workflow ${scopeId} not found`);
        }
        if (workflow.companyId !== context.companyId) {
          throw new RbacAccessDeniedError(
            `Workflow ${scopeId} does not belong to user's company`
          );
        }
        break;
      }

      default:
        throw new RbacAccessDeniedError(`Unsupported scope level: ${scopeLevel}`);
    }
  }
}
