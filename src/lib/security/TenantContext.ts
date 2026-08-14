import { Role } from '@prisma/client';
import { z } from 'zod';

export class TenantAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantAccessError';
  }
}

export const tenantContextSchema = z.object({
  companyId: z.string().nullable(),
  userId: z.string().min(1, 'userId cannot be empty'),
  userRole: z.nativeEnum(Role),
});

export type TenantContext = z.infer<typeof tenantContextSchema>;

/**
 * Creates a validated TenantContext.
 * @param companyId The ID of the company, or null for global scope.
 * @param userId The ID of the user.
 * @param userRole The role of the user.
 * @returns A validated TenantContext object.
 * @throws {TenantAccessError} If the context is invalid or a non-admin requests global scope.
 */
export function createTenantContext(
  companyId: string | null,
  userId: string,
  userRole: Role
): TenantContext {
  if (companyId === null && userRole !== Role.ADMIN) {
    throw new TenantAccessError('Only ADMIN role can have a global scope (companyId = null)');
  }

  const context = { companyId, userId, userRole };
  const result = tenantContextSchema.safeParse(context);

  if (!result.success) {
    throw new TenantAccessError(`Invalid TenantContext: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Validates that the provided context has access to the resource's company ID.
 * @param context The tenant context to check.
 * @param resourceCompanyId The company ID of the resource being accessed.
 * @throws {TenantAccessError} If cross-tenant access is attempted.
 */
export function validateTenantAccess(context: TenantContext, resourceCompanyId: string | null): void {
  if (isGlobalScope(context)) {
    return;
  }

  if (context.companyId !== resourceCompanyId) {
    throw new TenantAccessError(`Cross-tenant access denied: context company ${context.companyId} cannot access resource company ${resourceCompanyId}`);
  }
}

/**
 * Checks if the context represents a global scope.
 * @param context The tenant context to check.
 * @returns True if the context has a null companyId, meaning global scope.
 */
export function isGlobalScope(context: TenantContext): boolean {
  return context.companyId === null;
}
