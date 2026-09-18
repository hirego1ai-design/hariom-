import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const roundSchema = z.object({
  name: z.string().trim().min(2).max(100),
  purpose: z.string().trim().max(500).optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  interviewType: z.enum(["VIDEO", "PHONE", "IN_PERSON"]).default("VIDEO"),
  durationMins: z.number().int().min(15).max(240),
  mandatory: z.boolean().default(true),
  mandatoryFeedback: z.boolean().default(true),
  candidateFeedbackPolicy: z.enum(["REQUIRED", "OPTIONAL", "NOT_SHARED"]).default("OPTIONAL"),
  previousFeedbackVisibility: z.enum(["FULL", "SUMMARY_ONLY", "HIDDEN_UNTIL_OWN_FEEDBACK", "HIDDEN"]).default("HIDDEN_UNTIL_OWN_FEEDBACK"),
  interviewerUserIds: z.array(z.string().min(1)).max(10).default([]),
});
const bodySchema = z.object({ rounds: z.array(roundSchema).min(1).max(12) });

async function context(req: NextRequest, jobId: string) {
  const session = await getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
  const job = await prisma.jobListing.findUnique({ where: { id: jobId }, select: { id: true, companyId: true, title: true } });
  if (!job) throw new ApiError("Job not found.", 404);
  if (session.role !== "ADMIN") {
    const company = await getSessionCompany(session);
    if (company.id !== job.companyId) throw new ApiError("You cannot manage another company's interview process.", 403);
  }
  return { session, job };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "interview_process_get", 60, 60000);
    const { id } = await params;
    const { job } = await context(req, id);
    const [process, team] = await Promise.all([
      prisma.jobInterviewProcess.findUnique({
        where: { jobId: job.id },
        include: { rounds: { orderBy: { sequence: "asc" }, include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
      }),
      prisma.employerProfile.findMany({
        where: { companyId: job.companyId },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return NextResponse.json({
      success: true,
      job: { id: job.id, title: job.title },
      process,
      team: team.filter((m) => m.user).map((m) => ({ userId: m.user!.id, name: m.user!.name, email: m.user!.email, role: m.user!.role, designation: m.designation })),
    });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "interview_process_put", 20, 60000);
    const { id } = await params;
    const { session, job } = await context(req, id);
    const body = await readValidatedJson(req, bodySchema);
    const requestedUsers = [...new Set(body.rounds.flatMap((r) => r.interviewerUserIds))];
    if (requestedUsers.length) {
      const count = await prisma.employerProfile.count({ where: { companyId: job.companyId, userId: { in: requestedUsers } } });
      if (count !== requestedUsers.length) throw new ApiError("One or more interviewers are not active members of this company.", 400);
    }
    const process = await prisma.$transaction(async (tx) => {
      const existing = await tx.jobInterviewProcess.findUnique({ where: { jobId: job.id }, include: { rounds: { select: { id: true } } } });
      if (existing?.rounds.length) {
        const inUse = await tx.interviewRoundProgress.count({ where: { roundId: { in: existing.rounds.map((r) => r.id) } } });
        if (inUse > 0) throw new ApiError("This interview process is already in use. Existing candidate history cannot be overwritten.", 409);
      }
      if (existing) await tx.jobInterviewProcess.delete({ where: { id: existing.id } });
      return tx.jobInterviewProcess.create({
        data: {
          jobId: job.id, companyId: job.companyId,
          rounds: { create: body.rounds.map((round, index) => ({
            sequence: index + 1, name: round.name, purpose: round.purpose || null, department: round.department || null,
            interviewType: round.interviewType, durationMins: round.durationMins, mandatory: round.mandatory,
            mandatoryFeedback: round.mandatoryFeedback, candidateFeedbackPolicy: round.candidateFeedbackPolicy,
            previousFeedbackVisibility: round.previousFeedbackVisibility,
            interviewers: { create: round.interviewerUserIds.map((userId) => ({ userId, required: true })) },
          })) },
        },
        include: { rounds: { orderBy: { sequence: "asc" }, include: { interviewers: true } } },
      });
    });
    await logAuditEvent({ userId: session.id, companyId: job.companyId, action: "INTERVIEW_PROCESS_SAVED", resource: `JobListing:${job.id}`, details: `Configured ${body.rounds.length} interview round(s) for ${job.title}` });
    return NextResponse.json({ success: true, process });
  } catch (error) { return handleApiError(error); }
}
