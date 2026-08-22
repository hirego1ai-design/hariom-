import { prisma } from "@/lib/prisma";
import { getCurrentSession, type UserSession } from "@/lib/auth";
import { ApiError } from "@/lib/apiSecurity";

type EmployerRole = "EMPLOYER" | "RECRUITER";

export function requireAuthenticatedSession(request: Request): UserSession {
  const session = getCurrentSession(request.headers);
  if (!session) throw new ApiError("Authentication required.", 401);
  return session;
}

export function requireAdminSession(request: Request): UserSession {
  const session = requireAuthenticatedSession(request);
  if (session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
  return session;
}

export function requireEmployerOrAdminSession(request: Request): UserSession {
  const session = requireAuthenticatedSession(request);
  if (session.role !== "ADMIN" && session.role !== "EMPLOYER" && session.role !== "RECRUITER") {
    throw new ApiError("Employer, recruiter, or administrator access required.", 403);
  }
  return session;
}

export async function assertCompanyNameAccess(
  session: UserSession,
  companyName: string,
): Promise<void> {
  if (session.role === "ADMIN") return;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.id },
    include: { company: true },
  });
  if (!profile?.company) throw new ApiError("Employer profile or company not found.", 403);

  if (profile.company.name.trim().toLowerCase() !== companyName.trim().toLowerCase()) {
    throw new ApiError("Forbidden: record does not belong to your company.", 403);
  }
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
