import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  recommendation: z.enum(["PROCEED", "ON_HOLD", "REJECT"]),
  strengths: z.string().trim().min(10).max(4000),
  concerns: z.string().trim().max(4000).default(""),
  notes: z.string().trim().max(8000).default(""),
  candidateFeedback: z.string().trim().max(4000).optional().nullable(),
});

async function authorized(req: NextRequest, id: string) {
  const session = await getCurrentSession(req.headers);
  if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { application: { include: { job: true } }, roundProgress: { include: { round: { include: { interviewers: true } }, feedbacks: true } } },
  });
  if (!interview) throw new ApiError("Interview not found.", 404);
  if (session.role !== "ADMIN") {
    const company = await getSessionCompany(session);
    if (company.id !== interview.application.job.companyId) throw new ApiError("Interview access denied.", 403);
  }
  if (!interview.roundProgress?.round.interviewers.some((i) => i.userId === session.id)) throw new ApiError("Only an assigned interviewer can access feedback for this round.", 403);
  return { session, interview };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const { session, interview } = await authorized(req, id);
    const own = await prisma.interviewFeedback.findUnique({ where: { interviewId_authorId: { interviewId: id, authorId: session.id } } });
    const requiredIds = interview.roundProgress?.round.interviewers.filter((i) => i.required).map((i) => i.userId) || [];
    const finalizedIds = interview.roundProgress?.feedbacks.filter((f) => f.finalizedAt && requiredIds.includes(f.authorId)).map((f) => f.authorId) || [];
    const roundComplete = Boolean(interview.roundProgress) && requiredIds.length > 0 && requiredIds.every((uid) => finalizedIds.includes(uid));
    return NextResponse.json({ success: true, feedback: own, roundComplete, pendingFeedbackCount: Math.max(0, requiredIds.length - new Set(finalizedIds).size), roundStatus: interview.roundProgress?.status || null, policy: interview.roundProgress ? {
      roundName: interview.roundProgress.round.name,
      mandatoryFeedback: interview.roundProgress.round.mandatoryFeedback,
      candidateFeedbackPolicy: interview.roundProgress.round.candidateFeedbackPolicy,
    } : null });
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "interview_feedback_submit", 20, 60000);
    const { id } = await params; const { session, interview } = await authorized(req, id);
    if (!interview.roundProgress) throw new ApiError("This interview is not connected to a configured interview round.", 409);
    if (!["COMPLETED","FEEDBACK_SUBMITTED"].includes(interview.status)) throw new ApiError("Feedback can be finalized only after the interview has ended.", 409);
    const body = await readValidatedJson(req, schema);
    const policy = interview.roundProgress.round.candidateFeedbackPolicy;
    if (policy === "REQUIRED" && !body.candidateFeedback?.trim()) throw new ApiError("Candidate-facing feedback is required for this round.", 400);
    if (policy === "NOT_SHARED" && body.candidateFeedback?.trim()) throw new ApiError("Candidate-facing feedback is disabled for this round.", 400);
    const existing = await prisma.interviewFeedback.findUnique({ where: { interviewId_authorId: { interviewId: id, authorId: session.id } } });
    if (existing?.finalizedAt) throw new ApiError("Finalized feedback cannot be edited. Use an audited amendment workflow for corrections.", 409);
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const feedback = await tx.interviewFeedback.upsert({
        where: { interviewId_authorId: { interviewId: id, authorId: session.id } },
        update: { recommendation: body.recommendation, internalFeedback: { strengths: body.strengths, concerns: body.concerns, notes: body.notes }, candidateFeedback: policy === "NOT_SHARED" ? null : body.candidateFeedback || null, candidateVisible: false, finalizedAt: now },
        create: { interviewId: id, roundProgressId: interview.roundProgress!.id, authorId: session.id, recommendation: body.recommendation, internalFeedback: { strengths: body.strengths, concerns: body.concerns, notes: body.notes }, candidateFeedback: policy === "NOT_SHARED" ? null : body.candidateFeedback || null, candidateVisible: false, finalizedAt: now },
      });
      const requiredIds = interview.roundProgress!.round.interviewers.filter((i) => i.required).map((i) => i.userId);
      const finalized = await tx.interviewFeedback.findMany({ where: { interviewId: id, authorId: { in: requiredIds }, finalizedAt: { not: null } }, select: { authorId: true } });
      if (requiredIds.length === 0) throw new ApiError("At least one required interviewer must be assigned before this round can complete.", 409);
      const complete = requiredIds.every((uid) => finalized.some((f) => f.authorId === uid));
      if (complete) {
        await tx.interviewRoundProgress.update({ where: { id: interview.roundProgress!.id }, data: { status: "ROUND_COMPLETE", completedAt: now } });
        await tx.interview.update({ where: { id }, data: { status: "FEEDBACK_SUBMITTED" } });
      }
      return { feedback, roundComplete: complete, pendingFeedbackCount: Math.max(0, requiredIds.length - finalized.length) };
    });
    await logAuditEvent({ userId: session.id, companyId: interview.application.job.companyId, action: "INTERVIEW_FEEDBACK_FINALIZED", resource: `Interview:${id}`, details: `Finalized assigned-interviewer feedback; roundComplete=${result.roundComplete}` });
    return NextResponse.json({ success: true, ...result });
  } catch (e) { return handleApiError(e); }
}
