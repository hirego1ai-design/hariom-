import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getVideoAnalysisConfig } from "@/lib/env";
import { handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  jobId: z.string().uuid(), videoResumeId: z.string().uuid(),
  status: z.enum(["COMPLETED","FAILED","BLOCKED_INFRA"]), error: z.string().nullable().optional(),
  result: z.object({ transcript: z.string().max(30000).optional() }).passthrough().optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  try {
    const config = getVideoAnalysisConfig();
    if (request.headers.get("Authorization") !== `Bearer ${config.internalToken}`) return jsonError("Unauthorized internal callback token", 401);
    const body = await readValidatedJson(request, schema);
    const job = await prisma.recordedAssessmentAnalysisJob.findUnique({ where: { id: body.jobId } });
    if (!job) return jsonError("Job not found", 404);
    if (job.responseId !== body.videoResumeId) return jsonError("Response does not match analysis job", 403);
    if (["COMPLETED","FAILED","BLOCKED_INFRA"].includes(job.status)) return NextResponse.json({ success: true, status: job.status });
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const claim = await tx.recordedAssessmentAnalysisJob.updateMany({
        where: { id: job.id, status: { in: ["PENDING","PROCESSING"] } },
        data: { status: body.status, error: body.error || null, result: body.result ? body.result as Prisma.InputJsonValue : undefined, completedAt: now },
      });
      if (claim.count !== 1) return;
      await tx.recordedAssessmentResponse.update({
        where: { id: job.responseId },
        data: { analysisStatus: body.status, transcript: body.result?.transcript || null, analysisResult: body.result ? body.result as Prisma.InputJsonValue : undefined },
      });
    });
    return NextResponse.json({ success: true, status: body.status });
  } catch (error) { return handleApiError(error); }
}
