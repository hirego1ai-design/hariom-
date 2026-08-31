import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const selectReadinessSchema = z.object({
  roleTitle: z.string().trim().min(1).max(120),
  seniority: z.string().trim().min(1).max(80),
}).strict();

async function candidateProfile(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return profile;
}

export async function GET(request: NextRequest) {
  try {
    const profile = await candidateProfile(request);
    const [templates, records] = await Promise.all([
      prisma.mcqAssessment.findMany({
        where: { scope: "PLATFORM_READINESS", isActive: true },
        select: { id: true, title: true, description: true, roleTitle: true, seniority: true, durationMinutes: true, passingPercentage: true },
        orderBy: [{ roleTitle: "asc" }, { seniority: "asc" }],
      }),
      prisma.candidateReadiness.findMany({
        where: { candidateProfileId: profile.id },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    return NextResponse.json({ success: true, templates, records });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await candidateProfile(request);
    const { roleTitle, seniority } = await readValidatedJson(request, selectReadinessSchema);
    const template = await prisma.mcqAssessment.findFirst({
      where: { scope: "PLATFORM_READINESS", isActive: true, roleTitle, seniority },
      select: { id: true },
    });
    if (!template) throw new ApiError("No active Job-Ready assessment is configured for this role and seniority.", 409);
    const record = await prisma.candidateReadiness.upsert({
      where: { candidateProfileId_roleTitle_seniority: { candidateProfileId: profile.id, roleTitle, seniority } },
      create: { candidateProfileId: profile.id, roleTitle, seniority, assessmentId: template.id },
      update: { assessmentId: template.id },
    });
    return NextResponse.json({ success: true, readiness: record, assessmentId: template.id });
  } catch (error) {
    return handleApiError(error);
  }
}
