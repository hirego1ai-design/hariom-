import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  enforceInternalApiKey,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { recordCopilotUsageAfterExecutionIfActive } from "@/lib/copilot/capacity";

const schema = z.object({
  interviewId: z.string().uuid(),
  transcript: z.string().trim().min(40).max(50_000),
  provider: z.string().trim().min(1).max(160),
  model: z.string().trim().min(1).max(160),
  version: z.string().trim().min(1).max(160),
  confidence: z.number().finite().min(0).max(1),
}).strict();

export const dynamic = "force-dynamic";

async function meterTranscript(interview: {
  id: string;
  applicationId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMins: number;
  application: { job: { companyId: string } };
}, body: z.infer<typeof schema>) {
  const minutes = interview.startedAt && interview.completedAt
    ? Math.max(1, Math.ceil((interview.completedAt.getTime() - interview.startedAt.getTime()) / 60_000))
    : Math.max(1, interview.durationMins);

  await recordCopilotUsageAfterExecutionIfActive({
    companyId: interview.application.job.companyId,
    actionKey: "TRANSCRIPTION_MINUTE",
    quantity: minutes,
    idempotencyKey: `live-interview:${interview.id}:transcription`,
    provider: body.provider,
    model: body.model,
    reference: {
      interviewId: interview.id,
      applicationId: interview.applicationId,
    },
    metadata: {
      version: body.version,
      confidence: body.confidence,
      actualMinutes: minutes,
      characterCount: body.transcript.length,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    enforceInternalApiKey(request);
    const body = await readValidatedJson(request, schema, 96 * 1024);

    const interview = await prisma.interview.findUnique({
      where: { id: body.interviewId },
      include: {
        application: { select: { job: { select: { companyId: true } } } },
      },
    });
    if (!interview) throw new ApiError("Interview not found.", 404);
    if (!["COMPLETED", "FEEDBACK_SUBMITTED"].includes(interview.status)) {
      throw new ApiError(
        "Transcript finalization is allowed only after the live interview has ended.",
        409,
      );
    }

    if (interview.transcript) {
      const same =
        interview.transcript === body.transcript &&
        interview.transcriptProvider === body.provider &&
        interview.transcriptModel === body.model &&
        interview.transcriptVersion === body.version &&
        interview.transcriptConfidence === body.confidence;
      if (!same) {
        throw new ApiError(
          "A finalized transcript already exists. Use an audited correction workflow instead of overwriting interview evidence.",
          409,
        );
      }
      await meterTranscript(interview, body);
      return NextResponse.json({
        success: true,
        interviewId: interview.id,
        idempotent: true,
      });
    }

    const claim = await prisma.interview.updateMany({
      where: { id: interview.id, transcript: null },
      data: {
        transcript: body.transcript,
        transcriptProvider: body.provider,
        transcriptModel: body.model,
        transcriptVersion: body.version,
        transcriptConfidence: body.confidence,
      },
    });
    if (claim.count !== 1) {
      throw new ApiError(
        "Interview transcript changed while this callback was being processed.",
        409,
      );
    }

    await prisma.auditLog.create({
      data: {
        companyId: interview.application.job.companyId,
        action: "LIVE_INTERVIEW_TRANSCRIPT_FINALIZED",
        resource: `Interview:${interview.id}`,
        details: JSON.stringify({
          provider: body.provider,
          model: body.model,
          version: body.version,
          confidence: body.confidence,
          characterCount: body.transcript.length,
        }),
      },
    });

    await meterTranscript(interview, body);

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      idempotent: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
