import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";
import { dispatchCommunication } from "@/lib/communications/dispatcher";

const schema = z.object({ action: z.enum(["PROCEED", "REJECT", "HOLD"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "interview_round_decision", 20, 60000);
    const session = await getCurrentSession(req.headers);
    if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params;
    const body = await readValidatedJson(req, schema);
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: { include: { job: { include: { company: true } }, candidateProfile: { include: { user: true } } } }, roundProgress: { include: { round: true, feedbacks: true } } },
    });
    if (!interview?.roundProgress) throw new ApiError("Configured interview round not found.", 404);
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== interview.application.job.companyId) throw new ApiError("Interview access denied.", 403);
    }
    if (interview.roundProgress.status === "TRANSFERRED" && body.action === "PROCEED") {
      const nextRound = await prisma.interviewRound.findUnique({ where: { processId_sequence: { processId: interview.roundProgress.round.processId, sequence: interview.roundProgress.round.sequence + 1 } }, include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } } });
      return NextResponse.json({ success: true, action: nextRound ? "PROCEED" : "FINAL_ROUND_COMPLETE", nextRound: nextRound ? { id: nextRound.id, name: nextRound.name, sequence: nextRound.sequence, department: nextRound.department, interviewers: nextRound.interviewers.map(i => ({ userId: i.userId, name: i.user.name, email: i.user.email })) } : null, applicationId: interview.applicationId, idempotent: true });
    }
    if (interview.roundProgress.status !== "ROUND_COMPLETE") throw new ApiError("All required interviewer feedback must be finalized before a round decision.", 409);
    const requiredFeedbackMissing = await prisma.interviewRoundInterviewer.count({
      where: { roundId: interview.roundProgress.roundId, required: true, user: { interviewFeedbacks: { none: { interviewId: id, finalizedAt: { not: null } } } } },
    });
    if (requiredFeedbackMissing > 0) throw new ApiError("Required panel feedback is incomplete.", 409);

    if (body.action === "HOLD") {
      await logAuditEvent({ userId: session.id, companyId: interview.application.job.companyId, action: "INTERVIEW_ROUND_DECISION", resource: `Interview:${id}`, details: "Round decision: HOLD" });
      return NextResponse.json({ success: true, action: "HOLD", message: "Candidate remains on hold after this round." });
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      if (body.action === "REJECT") {
        await tx.application.update({ where: { id: interview.applicationId }, data: { status: "REJECTED" } });
        return { action: "REJECT" as const, nextRound: null };
      }
      const nextRound = await tx.interviewRound.findUnique({
        where: { processId_sequence: { processId: interview.roundProgress!.round.processId, sequence: interview.roundProgress!.round.sequence + 1 } },
        include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      await tx.interviewRoundProgress.update({ where: { id: interview.roundProgress!.id }, data: { status: "TRANSFERRED", completedAt: interview.roundProgress!.completedAt || now } });
      if (!nextRound) {
        return { action: "FINAL_ROUND_COMPLETE" as const, nextRound: null };
      }
      await tx.interviewRoundProgress.upsert({
        where: { applicationId_roundId: { applicationId: interview.applicationId, roundId: nextRound.id } },
        update: {},
        create: { applicationId: interview.applicationId, roundId: nextRound.id, status: "PENDING" },
      });
      return { action: "PROCEED" as const, nextRound: { id: nextRound.id, name: nextRound.name, sequence: nextRound.sequence, department: nextRound.department, interviewers: nextRound.interviewers.map(i => ({ userId: i.userId, name: i.user.name, email: i.user.email })) } };
    });
    await logAuditEvent({ userId: session.id, companyId: interview.application.job.companyId, action: "INTERVIEW_ROUND_DECISION", resource: `Interview:${id}`, details: `Round decision: ${result.action}${result.nextRound ? `; next=${result.nextRound.name}` : ""}` });
    const candidate = interview.application.candidateProfile.user;
    const variables = { candidate_name: candidate.name || "Candidate", company_name: interview.application.job.company.name, job_title: interview.application.job.title };
    const eventKey = result.action === "REJECT" ? "APPLICATION_REJECTED" : result.action === "PROCEED" ? "APPLICATION_SHORTLISTED" : null;
    if (eventKey && candidate.email) await dispatchCommunication({ eventKey, channel: "EMAIL", audience: "CANDIDATE", recipient: candidate.email, variables: result.action === "PROCEED" ? { ...variables, next_step: result.nextRound?.name || "Next interview round" } : variables, idempotencyKey: `interview:${id}:decision:${result.action}:candidate:email`, correlationId: interview.applicationId, recipientRef: candidate.id }).catch(() => null);
    if (eventKey && candidate.phoneNumber) await dispatchCommunication({ eventKey, channel: "WHATSAPP", audience: "CANDIDATE", recipient: candidate.phoneNumber, variables: result.action === "PROCEED" ? { ...variables, next_step: result.nextRound?.name || "Next interview round" } : variables, idempotencyKey: `interview:${id}:decision:${result.action}:candidate:whatsapp`, correlationId: interview.applicationId, recipientRef: candidate.id }).catch(() => null);
    return NextResponse.json({ success: true, ...result, applicationId: interview.applicationId });
  } catch (e) { return handleApiError(e); }
}
