import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";

const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  website: z.string().trim().url().max(500).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  industry: z.string().trim().max(120).nullable().optional(),
  size: z.string().trim().max(80).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  logoUrl: z.string().trim().max(1000).nullable().optional(),
  designation: z.string().trim().max(100).optional(),
}).strict().refine((body) => Object.keys(body).length > 0, "At least one company field is required.");

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_company_get", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") throw new ApiError("Administrator access requires an explicitly scoped company endpoint.", 400);
    const company = await getSessionCompany(session);
    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { id: true, designation: true } });
    if (!employerProfile) throw new ApiError("Employer profile not found.", 404);
    const record = await prisma.company.findUnique({ where: { id: company.id } });
    if (!record) throw new ApiError("Company not found.", 404);
    return NextResponse.json({ success: true, company: record, employer: employerProfile });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_company_update", 20, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) throw new ApiError("Authentication required.", 401);
    // Company-wide settings are owner policy, not recruiter profile data.
    if (session.role !== "EMPLOYER") throw new ApiError("Only the company owner can update company settings.", 403);
    const body = await readValidatedJson(req, updateCompanySchema);
    const company = await getSessionCompany(session);
    const { designation, ...companyData } = body;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.company.update({ where: { id: company.id }, data: companyData });
      if (designation !== undefined) await tx.employerProfile.update({ where: { userId: session.id }, data: { designation } });
      return result;
    });
    return NextResponse.json({ success: true, message: "Company profile updated successfully", company: updated });
  } catch (error) { return handleApiError(error); }
}
