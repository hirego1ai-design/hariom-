import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getVideoAnalysisConfig } from "@/lib/env";
import { handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  jobId: z.string().uuid(), videoResumeId: z.string().uuid(),
  status: z.enum(["COMPLETED","FAILED","BLOCKED_INFRA"]), error: z.string().nullable().optional(),
  modelName: z.string().trim().min(1).max(160).optional(),
  modelVersion: z.string().trim().min(1).max(160).optional(),
  workerVersion: z.string().trim().min(1).max(160).optional(),
  analysisVersion: z.string().trim().min(1).max(160).optional(),
  result: z.object({ transcript: z.string().max(30000).optional(), signals: z.array(z.object({ type: z.string().max(80), confidence: z.number().min(0).max(1).optional(), detail: z.string().max(1000).optional() }).strict()).max(100).optional(), metrics: z.record(z.string().max(80), z.number().finite()).optional() }).strict().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status !== "COMPLETED") return;
  for (const field of ["modelName", "modelVersion", "workerVersion", "analysisVersion"] as const) {
    if (!value[field]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required for completed analysis.` });
    }
  }
});

export async function POST(request: NextRequest) {
  try {
    const config = getVideoAnalysisConfig();
    if (!config.enabled || !config.internalToken) return jsonError("Assessment analysis callback is not configured", 503);
    if (request.headers.get("Authorization") !== `Bearer ${config.internalToken}`) return jsonError("Unauthorized internal callback token", 401);
    const body = await readValidatedJson(request, schema);
    const job = await prisma.recordedAssessmentAnalysisJob.findUnique({ where: { id: body.jobId } });
    if (!job) return jsonError("Job not found", 404);
    if (job.responseId !== body.videoResumeId) return jsonError("Response does not match analysis job", 403);
    if (["COMPLETED","FAILED","BLOCKED_INFRA"].includes(job.status)) return NextResponse.json({ success: true, status: job.status });
    const now = new Date();
    const retainedResult = body.result
      ? {
          ...body.result,
          provenance: body.status === "COMPLETED"
            ? {
                modelName: body.modelName!,
                modelVersion: body.modelVersion!,
                workerVersion: body.workerVersion!,
                analysisVersion: body.analysisVersion!,
              }
            : undefined,
        }
      : undefined;
    await prisma.$transaction(async (tx) => {
      const claim = await tx.recordedAssessmentAnalysisJob.updateMany({
        where: { id: job.id, status: { in: ["PENDING","PROCESSING"] } },
        data: { status: body.status, error: body.error || null, result: retainedResult ? retainedResult as Prisma.InputJsonValue : undefined, completedAt: now },
      });
      if (claim.count !== 1) return;
      await tx.recordedAssessmentResponse.update({
        where: { id: job.responseId },
        data: { analysisStatus: body.status, transcript: body.result?.transcript || null, analysisResult: retainedResult ? retainedResult as Prisma.InputJsonValue : undefined },
      });
    });
    return NextResponse.json({ success: true, status: body.status });
  } catch (error) { return handleApiError(error); }
}
