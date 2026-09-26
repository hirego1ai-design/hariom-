import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const changeSchema = z.object({
  action: z.enum(["CANCEL", "RESCHEDULE"]),
  scheduledAt: z.string().datetime().optional(),
  reason: z.string().trim().max(500).optional(),
}).strict();

const CLOSED_INTERVIEW_STATES = ["CANCELLED", "COMPLETED", "FEEDBACK_SUBMITTED"];

function overlaps(startA: Date, durationA: number, startB: Date, durationB: number) {
  const endA = startA.getTime() + durationA * 60_000;
  const endB = startB.getTime() + durationB * 60_000;
  return startA.getTime() < endB && startB.getTime() < endA;
}

async function authorizedInterview(id: string, session: { id: string; role: string }) {
  const interview = await prisma.interview.findFirst({
    where: { id },
    include: {
      application: {
        include: {
          job: true,
          candidateProfile: { include: { user: true } },
        },
      },
      roundProgress: {
        include: {
          round: { include: { interviewers: true } },
        },
      },
    },
  });
  if (!interview) return null;
  if (session.role === "ADMIN") return interview;
  const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const interview = await authorizedInterview(id, session);
    if (!interview) {
      return NextResponse.json({ success: false, error: "Interview not found or access denied." }, { status: 404 });
    }
    const meta = (() => {
      try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; }
      catch { return {}; }
    })();

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        applicationId: interview.applicationId,
        scheduledAt: interview.scheduledAt.toISOString(),
        durationMins: interview.durationMins,
        status: interview.status,
        roomUrl: interview.roomUrl,
        round: typeof meta.round === "string" ? meta.round : "Technical Interview",
        mode: typeof meta.mode === "string" ? meta.mode : interview.roomUrl ? "ONLINE" : "OFFLINE",
        candidateName: interview.application.candidateProfile.user?.name || "Candidate",
        jobTitle: interview.application.job.title,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to retrieve interview." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = changeSchema.parse(await req.json());
    const interview = await authorizedInterview(id, session);
    if (!interview) {
      return NextResponse.json({ success: false, error: "Interview not found or not accessible." }, { status: 404 });
    }

    if (body.action === "RESCHEDULE" && !body.scheduledAt) {
      return NextResponse.json({ success: false, error: "New date and time are required." }, { status: 400 });
    }
    if (body.action === "RESCHEDULE" && new Date(body.scheduledAt!).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "Rescheduled interview time must be in the future." }, { status: 400 });
    }
    if (["COMPLETED", "FEEDBACK_SUBMITTED"].includes(interview.status)) {
      return NextResponse.json({ success: false, error: "A completed interview cannot be cancelled or rescheduled." }, { status: 409 });
    }
    if (interview.status === "CANCELLED" && body.action === "CANCEL") {
      return NextResponse.json({
        success: true,
        interview: { id: interview.id, status: interview.status, scheduledAt: interview.scheduledAt },
        idempotent: true,
      });
    }
    if (interview.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "A cancelled interview must be scheduled as a new interview." }, { status: 409 });
    }

    const nextScheduledAt = body.action === "RESCHEDULE" ? new Date(body.scheduledAt!) : interview.scheduledAt;
    const currentMeta = (() => {
      try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; }
      catch { return {}; }
    })();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Interview" WHERE id = ${interview.id} FOR UPDATE`;

      const interviewerIds = interview.roundProgress?.round.interviewers
        .filter((item) => item.required)
        .map((item) => item.userId) ?? [];
      const lockKeys = [
        `candidate:${interview.application.candidateProfileId}`,
        ...interviewerIds.map((userId) => `interviewer:${userId}`),
      ].sort();
      for (const key of lockKeys) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`hirego:interview:${key}`}))`;
      }

      if (body.action === "RESCHEDULE") {
        const requestedEnd = new Date(nextScheduledAt.getTime() + interview.durationMins * 60_000);
        const searchStart = new Date(nextScheduledAt.getTime() - 240 * 60_000);
        const searchEnd = new Date(requestedEnd.getTime() + 240 * 60_000);

        const candidateConflicts = await tx.interview.findMany({
          where: {
            id: { not: interview.id },
            application: { candidateProfileId: interview.application.candidateProfileId },
            scheduledAt: { gte: searchStart, lte: searchEnd },
            status: { notIn: CLOSED_INTERVIEW_STATES },
          },
          select: { scheduledAt: true, durationMins: true },
        });
        if (candidateConflicts.some((item) => overlaps(nextScheduledAt, interview.durationMins, item.scheduledAt, item.durationMins))) {
          throw new Error("CANDIDATE_SCHEDULE_CONFLICT");
        }

        if (interviewerIds.length) {
          const interviewerConflicts = await tx.interview.findMany({
            where: {
              id: { not: interview.id },
              scheduledAt: { gte: searchStart, lte: searchEnd },
              status: { notIn: CLOSED_INTERVIEW_STATES },
              roundProgress: {
                round: { interviewers: { some: { userId: { in: interviewerIds }, required: true } } },
              },
            },
            select: { scheduledAt: true, durationMins: true },
          });
          if (interviewerConflicts.some((item) => overlaps(nextScheduledAt, interview.durationMins, item.scheduledAt, item.durationMins))) {
            throw new Error("INTERVIEWER_SCHEDULE_CONFLICT");
          }
        }
      }

      const nextStatus = body.action === "CANCEL" ? "CANCELLED" : "RESCHEDULED";
      const changed = await tx.interview.update({
        where: { id: interview.id },
        data: {
          status: nextStatus,
          scheduledAt: nextScheduledAt,
          aiFeedback: JSON.stringify({
            ...currentMeta,
            changeReason: body.reason || null,
            changedAt: new Date().toISOString(),
            changeType: body.action,
          }),
        },
      });

      if (interview.roundProgress) {
        await tx.interviewRoundProgress.update({
          where: { id: interview.roundProgress.id },
          data: {
            status: body.action === "CANCEL" ? "CANCELLED" : "SCHEDULED",
            completedAt: null,
          },
        });
      }
      return changed;
    });

    const notification = {
      requested: true,
      persisted: false,
      emailAccepted: false,
      emailReason: null as string | null,
    };
    try {
      await prisma.notification.create({
        data: {
          userId: interview.application.candidateProfile.userId,
          title: body.action === "CANCEL" ? "Interview cancelled" : "Interview rescheduled",
          message: body.action === "CANCEL"
            ? "Your interview has been cancelled."
            : `Your interview has been rescheduled to ${nextScheduledAt.toLocaleString()}.`,
          type: "INTERVIEW",
        },
      });
      notification.persisted = true;
    } catch {
      // Scheduling state is authoritative; notification failure is reported below.
    }

    const candidateEmail = interview.application.candidateProfile.user?.email;
    if (candidateEmail) {
      const emailResult = await sendEmail({
        to: candidateEmail,
        subject: `HireGo AI interview ${body.action.toLowerCase()}`,
        html: `<p>Your interview has been <strong>${body.action.toLowerCase()}</strong>.</p>${body.scheduledAt ? `<p>New time: ${nextScheduledAt.toLocaleString()}</p>` : ""}${body.reason ? `<p>Reason: ${body.reason}</p>` : ""}`,
      }).catch(() => ({ success: false, messageId: "", reason: "Email dispatch failed." }));
      notification.emailAccepted = Boolean(emailResult.success);
      notification.emailReason = emailResult.success ? null : ("reason" in emailResult && emailResult.reason ? String(emailResult.reason) : "Email provider did not accept the message.");
    } else {
      notification.emailReason = "Candidate email address is missing.";
    }

    return NextResponse.json({
      success: true,
      interview: { id: updated.id, status: updated.status, scheduledAt: updated.scheduledAt },
      notification,
      message: body.action === "CANCEL"
        ? "Interview cancelled. The same configured round can now be scheduled again."
        : "Interview rescheduled successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CANDIDATE_SCHEDULE_CONFLICT") {
      return NextResponse.json({ success: false, error: "The candidate already has an overlapping interview." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INTERVIEWER_SCHEDULE_CONFLICT") {
      return NextResponse.json({ success: false, error: "A required interviewer already has an overlapping interview." }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid interview change." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Unable to update interview." }, { status: 500 });
  }
}
