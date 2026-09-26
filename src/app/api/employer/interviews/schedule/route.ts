import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const schema = z.object({
  applicationId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().min(15).max(240).optional(),
  mode: z.enum(["ONLINE", "OFFLINE"]).optional(),
  roundId: z.string().uuid(),
  address: z.string().trim().max(500).optional(),
  contactNumber: z.string().trim().max(60).optional(),
  instructions: z.string().trim().max(2000).optional(),
  notifyEmail: z.boolean().default(true),
  notifyWhatsapp: z.boolean().default(false),
}).strict();

const CLOSED_INTERVIEW_STATES = ["CANCELLED", "COMPLETED", "FEEDBACK_SUBMITTED"];

function overlaps(startA: Date, durationA: number, startB: Date, durationB: number) {
  const endA = startA.getTime() + durationA * 60_000;
  const endB = startB.getTime() + durationB * 60_000;
  return startA.getTime() < endB && startB.getTime() < endA;
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());

    const blocking = await prisma.interviewRoundProgress.count({
      where: {
        status: "ENDED_PENDING_FEEDBACK",
        round: {
          mandatoryFeedback: true,
          interviewers: { some: { userId: session.id, required: true } },
        },
        feedbacks: { none: { authorId: session.id, finalizedAt: { not: null } } },
      },
    });
    if (blocking > 0) {
      return NextResponse.json(
        { success: false, error: "Complete your pending mandatory interview feedback before scheduling another interview." },
        { status: 409 },
      );
    }

    const application = await prisma.application.findUnique({
      include: { candidateProfile: { include: { user: true } }, job: true },
      where: { id: body.applicationId },
    });
    if (!application) return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    if (["HIRED", "REJECTED", "WITHDRAWN"].includes(application.status)) {
      return NextResponse.json({ success: false, error: "Interviews cannot be scheduled for an application in a terminal state." }, { status: 409 });
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "Interview date and time must be in the future." }, { status: 400 });
    }

    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!profile || profile.companyId !== application.job.companyId) {
        return NextResponse.json({ success: false, error: "You cannot schedule this candidate." }, { status: 403 });
      }
    }

    const round = await prisma.interviewRound.findFirst({
      where: { id: body.roundId, process: { jobId: application.jobId, companyId: application.job.companyId, isActive: true } },
      include: { interviewers: true },
    });
    if (!round) return NextResponse.json({ success: false, error: "Interview round is not configured for this job." }, { status: 400 });

    const configuredType = round.interviewType.toUpperCase();
    const mode = configuredType === "IN_PERSON" || configuredType === "OFFLINE"
      ? "OFFLINE"
      : configuredType === "PHONE"
        ? "PHONE"
        : "ONLINE";
    const durationMins = round.durationMins;

    if (mode === "OFFLINE" && !body.address) {
      return NextResponse.json({ success: false, error: "Address is required for this configured offline round." }, { status: 400 });
    }
    if ((mode === "OFFLINE" || mode === "PHONE") && !body.contactNumber) {
      return NextResponse.json({ success: false, error: `Contact number is required for this configured ${mode.toLowerCase()} round.` }, { status: 400 });
    }

    const requiredInterviewerIds = round.interviewers.filter((item) => item.required).map((item) => item.userId);
    if (!requiredInterviewerIds.length) {
      return NextResponse.json({ success: false, error: "Assign at least one required interviewer before scheduling this round." }, { status: 400 });
    }

    if (round.sequence > 1) {
      const previous = await prisma.interviewRound.findUnique({
        where: { processId_sequence: { processId: round.processId, sequence: round.sequence - 1 } },
      });
      if (previous) {
        const priorProgress = await prisma.interviewRoundProgress.findUnique({
          where: { applicationId_roundId: { applicationId: application.id, roundId: previous.id } },
        });
        if (!priorProgress || !["ROUND_COMPLETE", "TRANSFERRED", "FINAL_ROUND_COMPLETE"].includes(priorProgress.status)) {
          return NextResponse.json({ success: false, error: "The previous interview round must be completed before scheduling this round." }, { status: 409 });
        }
      }
    }

    const roomId = mode === "ONLINE" ? `room-${crypto.randomUUID()}` : null;
    const roomUrl = mode === "ONLINE"
      ? `/employer/active-video-interview-interviewer-view?roomId=${roomId}`
      : mode === "PHONE"
        ? `PHONE:${JSON.stringify({ contactNumber: body.contactNumber || null })}`
        : `OFFLINE:${JSON.stringify({ address: body.address, contactNumber: body.contactNumber })}`;
    const metadata = JSON.stringify({
      mode,
      roundId: round.id,
      round: round.name,
      address: body.address || null,
      contactNumber: body.contactNumber || null,
      instructions: body.instructions || null,
      notifyWhatsapp: body.notifyWhatsapp,
      roomId,
    });

    const interview = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${application.id} FOR UPDATE`;
      const lockedApplication = await tx.application.findUnique({
        where: { id: application.id },
        select: { status: true },
      });
      if (!lockedApplication || ["HIRED", "REJECTED", "WITHDRAWN"].includes(lockedApplication.status)) {
        throw new Error("APPLICATION_NOT_SCHEDULABLE");
      }

      const lockKeys = [
        `candidate:${application.candidateProfileId}`,
        ...requiredInterviewerIds.map((id) => `interviewer:${id}`),
      ].sort();
      for (const key of lockKeys) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`hirego:interview:${key}`}))`;
      }

      const progress = await tx.interviewRoundProgress.findUnique({
        where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } },
        select: { interviewId: true, status: true },
      });
      if (progress?.interviewId && progress.status !== "CANCELLED") throw new Error("INTERVIEW_ROUND_ALREADY_SCHEDULED");

      const requestedEnd = new Date(scheduledAt.getTime() + durationMins * 60_000);
      const searchStart = new Date(scheduledAt.getTime() - 240 * 60_000);
      const searchEnd = new Date(requestedEnd.getTime() + 240 * 60_000);

      const candidateInterviews = await tx.interview.findMany({
        where: {
          application: { candidateProfileId: application.candidateProfileId },
          scheduledAt: { gte: searchStart, lte: searchEnd },
          status: { notIn: CLOSED_INTERVIEW_STATES },
        },
        select: { id: true, scheduledAt: true, durationMins: true },
      });
      if (candidateInterviews.some((item) => overlaps(scheduledAt, durationMins, item.scheduledAt, item.durationMins))) {
        throw new Error("CANDIDATE_SCHEDULE_CONFLICT");
      }

      const interviewerInterviews = await tx.interview.findMany({
        where: {
          scheduledAt: { gte: searchStart, lte: searchEnd },
          status: { notIn: CLOSED_INTERVIEW_STATES },
          roundProgress: {
            round: { interviewers: { some: { userId: { in: requiredInterviewerIds }, required: true } } },
          },
        },
        select: { id: true, scheduledAt: true, durationMins: true },
      });
      if (interviewerInterviews.some((item) => overlaps(scheduledAt, durationMins, item.scheduledAt, item.durationMins))) {
        throw new Error("INTERVIEWER_SCHEDULE_CONFLICT");
      }

      if (round.sequence > 1) {
        const previous = await tx.interviewRound.findUnique({
          where: { processId_sequence: { processId: round.processId, sequence: round.sequence - 1 } },
          select: { id: true },
        });
        if (previous) {
          const priorProgress = await tx.interviewRoundProgress.findUnique({
            where: { applicationId_roundId: { applicationId: application.id, roundId: previous.id } },
            select: { status: true },
          });
          if (!priorProgress || !["ROUND_COMPLETE", "TRANSFERRED", "FINAL_ROUND_COMPLETE"].includes(priorProgress.status)) {
            throw new Error("PREVIOUS_INTERVIEW_ROUND_INCOMPLETE");
          }
        }
      }

      const created = await tx.interview.create({
        data: {
          applicationId: body.applicationId,
          scheduledAt,
          durationMins,
          status: "SCHEDULED",
          roomUrl,
          aiFeedback: metadata,
        },
      });

      await tx.interviewRoundProgress.upsert({
        where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } },
        update: { interviewId: created.id, status: "SCHEDULED", completedAt: null },
        create: { applicationId: application.id, roundId: round.id, interviewId: created.id, status: "SCHEDULED" },
      });
      return created;
    });

    let appNotification = { requested: true, persisted: false, reason: null as string | null };
    try {
      await prisma.notification.create({
        data: {
          userId: application.candidateProfile.userId,
          title: `${round.name} interview scheduled`,
          message: `Your ${mode.toLowerCase()} interview is scheduled for ${scheduledAt.toLocaleString()}.`,
          type: "INTERVIEW",
        },
      });
      appNotification.persisted = true;
    } catch {
      appNotification.reason = "Notification could not be persisted.";
    }

    const emailStatus = {
      requested: body.notifyEmail,
      accepted: false,
      provider: null as string | null,
      messageId: null as string | null,
      reason: body.notifyEmail ? null as string | null : "Not selected.",
    };
    if (body.notifyEmail && application.candidateProfile.user?.email) {
      const result = await sendEmail({
        to: application.candidateProfile.user.email,
        subject: "HireGo AI interview scheduled",
        html: `<p>Your ${round.name} interview is scheduled for <strong>${scheduledAt.toLocaleString()}</strong>.</p><p>Mode: ${mode}</p>${mode === "OFFLINE" ? `<p>Address: ${body.address}<br/>Contact: ${body.contactNumber}</p>` : "<p>Join from your HireGo interview portal.</p>"}`,
      }).catch(() => ({ success: false, messageId: "", reason: "Email dispatch failed." }));
      emailStatus.accepted = Boolean(result.success);
      emailStatus.messageId = result.messageId || null;
      emailStatus.provider = "provider" in result && result.provider ? String(result.provider) : null;
      emailStatus.reason = result.success ? null : ("reason" in result && result.reason ? String(result.reason) : "Email provider did not accept the message.");
    } else if (body.notifyEmail) {
      emailStatus.reason = "Candidate email address is missing.";
    }

    const whatsapp = body.notifyWhatsapp && application.candidateProfile.user?.phoneNumber
      ? await sendWhatsAppMessage(
          application.candidateProfile.user.phoneNumber,
          `HireGo AI ${round.name} interview scheduled for ${scheduledAt.toLocaleString()}.`,
        ).catch(() => ({ sent: false, reason: "WhatsApp dispatch failed." }))
      : { sent: false, reason: body.notifyWhatsapp ? "Candidate phone number is missing." : "Not selected." };

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      roomId,
      mode,
      scheduledAt: interview.scheduledAt,
      notifications: {
        app: appNotification,
        email: emailStatus,
        whatsapp: { requested: body.notifyWhatsapp, ...whatsapp },
      },
      message: "Interview scheduled. Notification status reflects persistence/provider acceptance, not final delivery.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PREVIOUS_INTERVIEW_ROUND_INCOMPLETE") {
      return NextResponse.json({ success: false, error: "The previous interview round must be completed before scheduling this round." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INTERVIEW_ROUND_ALREADY_SCHEDULED") {
      return NextResponse.json({ success: false, error: "This round is already scheduled for the candidate." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "APPLICATION_NOT_SCHEDULABLE") {
      return NextResponse.json({ success: false, error: "The application entered a terminal state before the interview could be scheduled." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "CANDIDATE_SCHEDULE_CONFLICT") {
      return NextResponse.json({ success: false, error: "The candidate already has an overlapping interview." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INTERVIEWER_SCHEDULE_CONFLICT") {
      return NextResponse.json({ success: false, error: "A required interviewer already has an overlapping interview." }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid schedule." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Unable to schedule interview." }, { status: 500 });
  }
}
