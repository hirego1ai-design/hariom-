/**
 * P1.1 RBAC: 2-Role Model Enforcement
 * 
 * Defines the 2-role RBAC system with role validation utilities
 * VALID_ROLES: ['RECRUITER', 'EMPLOYER']
 */

/**
 * Represents the two valid roles in the HireGo platform
 * - RECRUITER: Team member who can manage candidates and jobs
 * - EMPLOYER: Company owner/administrator with full control
 */
export type Role = 'RECRUITER' | 'EMPLOYER';

/**
 * The definitive list of valid roles in the system
 * Used for validation of role assignments
 */
export const VALID_ROLES: Role[] = ['RECRUITER', 'EMPLOYER'];

/**
 * Represents a user with role-based access control
 */
export interface User {
  id: string;
  role: Role;
  companyId?: string;
  name?: string;
  email?: string;
}

/**
 * Check if a user has a specific role
 * @param user - The user to check (can be null)
 * @param requiredRole - The role to verify
 * @returns true if user exists and has the required role, false otherwise
 */
export function hasRole(user: User | null, requiredRole: Role): boolean {
  return user?.role === requiredRole;
}

/**
 * Check if a user has any of the specified roles
 * @param user - The user to check (can be null)
 * @param roles - Array of allowed roles
 * @returns true if user exists and has one of the roles, false otherwise
 */
export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Require a user to have a specific role, throw if not
 * @param user - The user to check (can be null)
 * @param requiredRole - The required role
 * @throws Error if user is null or role doesn't match
 */
export function requireRole(user: User | null, requiredRole: Role): void {
  if (!user) throw new Error('Unauthorized: No user session');
  if (user.role !== requiredRole) {
    throw new Error(`Forbidden: User role '${user.role}' does not match required '${requiredRole}'`);
  }
}

/**
 * Require a user to have one of the specified roles, throw if not
 * @param user - The user to check (can be null)
 * @param roles - Array of allowed roles
 * @throws Error if user is null or role is not in allowed list
 */
export function requireAnyRole(user: User | null, roles: Role[]): boolean {
  if (!user) throw new Error('Unauthorized: No user session');
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden: User role '${user.role}' not in allowed roles: ${roles.join(', ')}`);
  }
  return true;
}

/**
 * Check if a user can access a company resource
 * @param user - The user to check (can be null)
 * @param resourceCompanyId - The company ID of the resource
 * @returns true if user belongs to the company, false otherwise
 */
export function canAccessCompanyResource(
  user: User | null,
  resourceCompanyId: string
): boolean {
  if (!user || !resourceCompanyId) return false;
  return user.companyId === resourceCompanyId;
}

/**
 * Require a user to have access to a company resource, throw if not
 * @param user - The user to check (can be null)
 * @param resourceCompanyId - The company ID of the resource
 * @throws Error if user doesn't have access
 */
export function requireCompanyAccess(
  user: User | null,
  resourceCompanyId: string
): void {
  if (!canAccessCompanyResource(user, resourceCompanyId)) {
    throw new Error('Forbidden');
  }
}

/**
 * Validate that a role string is in the valid roles list
 * @param role - The role to validate
 * @returns true if role is valid, false otherwise
 */
export function isValidRole(role: string): role is Role {
  return VALID_ROLES.includes(role as Role);
}
