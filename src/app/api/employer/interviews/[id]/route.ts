import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const MAX_INTERVIEW_DURATION_MS = 4 * 60 * 60 * 1000;
const changeSchema = z.object({ action: z.enum(["CANCEL", "RESCHEDULE"]), scheduledAt: z.string().datetime().optional(), reason: z.string().max(500).optional() });

function overlaps(startA: Date, durationMinsA: number, startB: Date, durationMinsB: number) {
  const endA = startA.getTime() + durationMinsA * 60_000;
  const endB = startB.getTime() + durationMinsB * 60_000;
  return startA.getTime() < endB && startB.getTime() < endA;
}

async function authorizedInterview(id: string, session: { id: string; role: string }) {
  const interview = await prisma.interview.findFirst({
    where: {
      id
    },
    include: {
      application: {
        include: {
          job: true,
          candidateProfile: {
            include: {
              user: true
            }
          }
        }
      },
      roundProgress: {
        include: {
          round: {
            include: { interviewers: true }
          }
        }
      }
    }
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
    const meta = (() => { try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; } catch { return {}; } })();

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
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unable to retrieve interview." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = changeSchema.parse(await req.json());
    const interview = await authorizedInterview(id, session);
    if (!interview) return NextResponse.json({ success: false, error: "Interview not found or not accessible." }, { status: 404 });
    if (body.action === "RESCHEDULE" && !body.scheduledAt) return NextResponse.json({ success: false, error: "New date and time are required." }, { status: 400 });
    if (body.action === "RESCHEDULE" && body.scheduledAt && new Date(body.scheduledAt).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "Rescheduled interview time must be in the future." }, { status: 400 });
    }
    if (["COMPLETED", "FEEDBACK_SUBMITTED"].includes(interview.status)) {
      return NextResponse.json({ success: false, error: "A completed interview cannot be cancelled or rescheduled." }, { status: 409 });
    }
    if (interview.status === "CANCELLED" && body.action === "CANCEL") {
      return NextResponse.json({ success: true, interview: { id: interview.id, status: interview.status, scheduledAt: interview.scheduledAt }, idempotent: true });
    }
    if (interview.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "A cancelled interview must be scheduled as a new interview." }, { status: 409 });
    }
    const currentMeta = (() => { try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; } catch { return {}; } })();
    const nextStatus = body.action === "CANCEL" ? "CANCELLED" : "RESCHEDULED";

    if (body.action === "RESCHEDULE" && body.scheduledAt) {
      const scheduledAt = new Date(body.scheduledAt);
      const scheduledEnd = new Date(scheduledAt.getTime() + interview.durationMins * 60_000);
      const interviewerIds = interview.roundProgress?.round.interviewers.map((item) => item.userId) || [];
      const lockSubjects = [interview.application.candidateProfile.userId, ...interviewerIds].sort();

      await prisma.$transaction(async (tx) => {
        for (const subject of lockSubjects) {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`interview-schedule:${subject}`}))`;
        }
        const windowStart = new Date(scheduledAt.getTime() - MAX_INTERVIEW_DURATION_MS);
        const windowEnd = new Date(scheduledEnd.getTime() + MAX_INTERVIEW_DURATION_MS);
        const candidateConflicts = await tx.interview.findMany({
          where: {
            id: { not: interview.id },
            application: { candidateProfileId: interview.application.candidateProfileId },
            status: { notIn: ["CANCELLED", "COMPLETED", "FEEDBACK_SUBMITTED"] },
            scheduledAt: { gte: windowStart, lte: windowEnd },
          },
          select: { scheduledAt: true, durationMins: true },
        });
        if (candidateConflicts.some((item) => overlaps(scheduledAt, interview.durationMins, item.scheduledAt, item.durationMins))) {
          throw new ApiError("The candidate already has an overlapping interview.", 409);
        }

        const panelProgress = interviewerIds.length ? await tx.interviewRoundProgress.findMany({
          where: {
            interviewId: { not: interview.id },
            round: { interviewers: { some: { userId: { in: interviewerIds } } } },
            interview: {
              scheduledAt: { gte: windowStart, lte: windowEnd },
              status: { notIn: ["CANCELLED", "COMPLETED", "FEEDBACK_SUBMITTED"] },
            },
          },
          include: { interview: true },
        }) : [];
        if (panelProgress.some((item) => item.interview && overlaps(scheduledAt, interview.durationMins, item.interview.scheduledAt, item.interview.durationMins))) {
          throw new ApiError("An assigned interviewer already has an overlapping interview.", 409);
        }

        await tx.interview.update({
          where: { id: interview.id },
          data: {
            status: nextStatus,
            scheduledAt,
            aiFeedback: JSON.stringify({ ...currentMeta, changeReason: body.reason || null, changedAt: new Date().toISOString() }),
          },
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.interview.update({
          where: { id: interview.id },
          data: {
            status: nextStatus,
            aiFeedback: JSON.stringify({ ...currentMeta, changeReason: body.reason || null, changedAt: new Date().toISOString() }),
          },
        });
        if (interview.roundProgress) {
          await tx.interviewRoundProgress.update({
            where: { id: interview.roundProgress.id },
            data: { status: "CANCELLED", interviewId: null },
          });
        }
      });
    }

    const updated = await prisma.interview.findUniqueOrThrow({ where: { id: interview.id } });
    const candidateEmail = interview.application.candidateProfile.user?.email;
    if (candidateEmail) await sendEmail({ to: candidateEmail, subject: `HireGo AI interview ${body.action.toLowerCase()}`, html: `<p>Your interview has been <strong>${body.action.toLowerCase()}</strong>.</p>${body.scheduledAt ? `<p>New time: ${new Date(body.scheduledAt).toLocaleString()}</p>` : ""}${body.reason ? `<p>Reason: ${body.reason}</p>` : ""}` }).catch(() => undefined);
    return NextResponse.json({ success: true, interview: { id: updated.id, status: updated.status, scheduledAt: updated.scheduledAt }, message: `Interview ${body.action.toLowerCase()}d successfully.` });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ success: false, error: "Unable to update interview." }, { status: 500 });
  }
}
