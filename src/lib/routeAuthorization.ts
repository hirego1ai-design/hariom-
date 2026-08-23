import { prisma } from "@/lib/prisma";
import { getCurrentSession, type UserSession } from "@/lib/auth";
import { ApiError } from "@/lib/apiSecurity";

type EmployerRole = "EMPLOYER" | "RECRUITER";

export async function requireAuthenticatedSession(request: Request): Promise<UserSession> {
  const session = await getCurrentSession(request.headers);
  if (!session) throw new ApiError("Authentication required.", 401);
  return session;
}

export async function requireAdminSession(request: Request): Promise<UserSession> {
  const session = await requireAuthenticatedSession(request);
  if (session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
  return session;
}

export async function requireEmployerOrAdminSession(request: Request): Promise<UserSession> {
  const session = await requireAuthenticatedSession(request);
  if (session.role !== "ADMIN" && session.role !== "EMPLOYER" && session.role !== "RECRUITER") {
    throw new ApiError("Employer, recruiter, or administrator access required.", 403);
  }
  return session;
}

export async function getSessionCompany(session: UserSession): Promise<{ id: string; name: string }> {
  if (session.role === "ADMIN") throw new ApiError("A tenant-scoped company is required.", 400);
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.id },
    include: { company: true },
  });
  if (!profile?.company) throw new ApiError("Employer profile or company not found.", 403);
  return { id: profile.company.id, name: profile.company.name };
}

export async function assertCompanyIdAccess(session: UserSession, companyId?: string): Promise<void> {
  if (session.role === "ADMIN") return;
  if (!companyId) throw new ApiError("This legacy record requires administrator assignment before employer access.", 403);
  const company = await getSessionCompany(session);
  if (company.id !== companyId) throw new ApiError("Forbidden: record does not belong to your company.", 403);
}

export function isEmployerRole(role: UserSession["role"]): role is EmployerRole {
  return role === "EMPLOYER" || role === "RECRUITER";
}
