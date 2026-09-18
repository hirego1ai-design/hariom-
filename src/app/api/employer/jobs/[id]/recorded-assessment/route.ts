import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { assertEmployerOwnsJob, RECORDED_ASSESSMENT_READING_SECONDS } from "@/lib/recordedAssessment";

const schema = z.object({
  mediaType: z.enum(["AUDIO", "VIDEO"]),
  defaultAnswerSeconds: z.union([z.literal(30), z.literal(60)]),
  questionCount: z.number().int().min(1).max(20),
  proctoringEnabled: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params;
    await assertEmployerOwnsJob(session.id, session.role, id);
    const config = await prisma.recordedAssessmentConfig.findUnique({ where: { jobListingId: id } });
    return NextResponse.json({ success: true, config });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_config");
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params;
    await assertEmployerOwnsJob(session.id, session.role, id);
    const body = await readValidatedJson(request, schema);
    const config = await prisma.recordedAssessmentConfig.upsert({
      where: { jobListingId: id },
      update: { ...body, defaultReadingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS },
      create: { jobListingId: id, ...body, defaultReadingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS },
    });
    return NextResponse.json({ success: true, config });
  } catch (error) { return handleApiError(error); }
}
