import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { getLiveInterviewProctoringPolicy } from "@/lib/proctoringPolicy";

const schema = z.object({
  interviewId: z.string().uuid(),
  policyVersion: z.string().trim().min(1).max(64),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    await enforceRateLimit(request, "proctoring_consent", 10, 60_000);
    const body = await readValidatedJson(request, schema, 4 * 1024);
    const [interview, policy] = await Promise.all([
      prisma.interview.findUnique({
        where: { id: body.interviewId },
        select: { id: true, status: true, application: { select: { candidateProfile: { select: { userId: true } } } } },
      }),
      getLiveInterviewProctoringPolicy(),
    ]);
    if (!interview || interview.application.candidateProfile.userId !== session.id) throw new ApiError("Interview not found.", 404);
    if (!policy.enabled) throw new ApiError("Live interview proctoring is not enabled.", 409);
    if (body.policyVersion !== policy.policyVersion) throw new ApiError("Proctoring policy changed. Review the current disclosure before continuing.", 409);
    if (["COMPLETED", "CANCELLED"].includes(interview.status)) throw new ApiError("Interview room is closed.", 409);

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "LIVE_INTERVIEW_PROCTORING_CONSENT",
        resource: `Interview:${interview.id}`,
        details: JSON.stringify({
          policyVersion: policy.policyVersion,
          enabledSignals: {
            tabSwitch: policy.trackTabSwitch,
            clipboard: policy.trackClipboard,
            contextMenu: policy.trackContextMenu,
          },
          consentedAt: new Date().toISOString(),
        }),
      },
    });
    return NextResponse.json({ success: true, interviewId: interview.id, policyVersion: policy.policyVersion });
  } catch (error) {
    return handleApiError(error);
  }
}
