import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { createOrResumeRecordedAssessmentAttempt } from "@/lib/recordedAssessment";

const schema = z.object({ jobId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "recorded_assessment_attempt_start");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { jobId } = await readValidatedJson(request, schema);
    const attempt = await createOrResumeRecordedAssessmentAttempt(session.id, jobId);
    return NextResponse.json({ success: true, attempt });
  } catch (error) { return handleApiError(error); }
}
