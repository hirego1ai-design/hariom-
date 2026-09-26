import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { dispatchCommunication } from "@/lib/communications/dispatcher";

const schema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().min(15).max(240).optional(),
  mode: z.enum(["ONLINE", "OFFLINE"]).optional(),
  roundId: z.string().min(1),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  instructions: z.string().max(2000).optional(),
  notifyEmail: z.boolean().default(true),
  notifyWhatsapp: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await request.json());
    if (session.role !== "CANDIDATE") {
      const blocking = await prisma.interviewRoundProgress.count({
        where: { status: "ENDED_PENDING_FEEDBACK", round: { mandatoryFeedback: true, interviewers: { some: { userId: session.id, required: true } } }, feedbacks: { none: { authorId: session.id, finalizedAt: { not: null } } } },
      });
      if (blocking > 0) return NextResponse.json({ success: false, error: "Complete your pending mandatory interview feedback before scheduling another interview." }, { status: 409 });
    }
    const application = await prisma.application.findUnique({ include: { candidateProfile: { include: { user: true } }, job: { include: { company: true } } }, where: { id: body.applicationId } });
    if (!application) return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    if (["HIRED", "REJECTED", "WITHDRAWN"].includes(application.status)) {
      return NextResponse.json({ success: false, error: "Interviews cannot be scheduled for an application in a terminal state." }, { status: 409 });
    }
    if (new Date(body.scheduledAt).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "Interview date and time must be in the future." }, { status: 400 });
    }
    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!profile || profile.companyId !== application.job.companyId) return NextResponse.json({ success: false, error: "You cannot schedule this candidate." }, { status: 403 });
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
    if (mode === "OFFLINE" && !body.address) return NextResponse.json({ success: false, error: "Address is required for this configured offline round." }, { status: 400 });
    if ((mode === "OFFLINE" || mode === "PHONE") && !body.contactNumber) return NextResponse.json({ success: false, error: `Contact number is required for this configured ${mode.toLowerCase()} round.` }, { status: 400 });
    if (!round.interviewers.some((interviewer) => interviewer.required)) return NextResponse.json({ success: false, error: "Assign at least one required interviewer before scheduling this round." }, { status: 400 });
    const existingProgress = await prisma.interviewRoundProgress.findUnique({ where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } } });
    if (existingProgress?.interviewId) return NextResponse.json({ success: false, error: "This round is already scheduled for the candidate." }, { status: 409 });
    if (round.sequence > 1) {
      const previous = await prisma.interviewRound.findUnique({ where: { processId_sequence: { processId: round.processId, sequence: round.sequence - 1 } } });
      if (previous) {
        const priorProgress = await prisma.interviewRoundProgress.findUnique({ where: { applicationId_roundId: { applicationId: application.id, roundId: previous.id } } });
        if (!priorProgress || !["ROUND_COMPLETE", "TRANSFERRED"].includes(priorProgress.status)) {
          return NextResponse.json({ success: false, error: "The previous interview round must be completed before scheduling this round." }, { status: 409 });
        }
      }
    }
    const scheduledAt = new Date(body.scheduledAt);
    const scheduledEnd = new Date(scheduledAt.getTime() + durationMins * 60_000);
    const roomId = mode === "ONLINE" ? `room-${crypto.randomUUID()}` : null;
    const roomUrl = mode === "ONLINE"
      ? `/employer/active-video-interview-interviewer-view?roomId=${roomId}`
      : mode === "PHONE"
        ? `PHONE:${JSON.stringify({ contactNumber: body.contactNumber || null })}`
        : `OFFLINE:${JSON.stringify({ address: body.address, contactNumber: body.contactNumber })}`;
    const metadata = JSON.stringify({ mode: mode, roundId: round.id, round: round.name, address: body.address || null, contactNumber: body.contactNumber || null, instructions: body.instructions || null, notifyWhatsapp: body.notifyWhatsapp, roomId });
    const interview = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${application.id} FOR UPDATE`;
      const lockedApplication = await tx.application.findUnique({ where: { id: application.id }, select: { status: true } });
      if (!lockedApplication || ["HIRED", "REJECTED", "WITHDRAWN"].includes(lockedApplication.status)) {
        throw new Error("APPLICATION_NOT_SCHEDULABLE");
      }
      const progress = await tx.interviewRoundProgress.findUnique({
        where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } },
        select: { interviewId: true, status: true },
      });

      const participantIds = [application.candidateProfile.userId, ...round.interviewers.map((item) => item.userId)].sort();
      for (const participantId of participantIds) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`hirego:interview-participant:${participantId}`}))`;
      }
      const possibleConflicts = await tx.interview.findMany({
        where: {
          status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] },
          scheduledAt: {
            gte: new Date(scheduledAt.getTime() - 4 * 60 * 60_000),
            lt: scheduledEnd,
          },
        },
        include: {
          application: { include: { candidateProfile: { select: { userId: true } } } },
          roundProgress: { include: { round: { include: { interviewers: { select: { userId: true } } } } } },
        },
      });
      const requestedParticipants = new Set(participantIds);
      const conflict = possibleConflicts.find((existing) => {
        const existingEnd = new Date(existing.scheduledAt.getTime() + existing.durationMins * 60_000);
        if (!(existing.scheduledAt < scheduledEnd && existingEnd > scheduledAt)) return false;
        const existingParticipants = [
          existing.application.candidateProfile.userId,
          ...(existing.roundProgress?.round.interviewers.map((item) => item.userId) || []),
        ];
        return existingParticipants.some((id) => requestedParticipants.has(id));
      });
      if (conflict) throw new Error("INTERVIEW_TIME_CONFLICT");
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
      if (progress?.interviewId) throw new Error("INTERVIEW_ROUND_ALREADY_SCHEDULED");
      const created = await tx.interview.create({ data: { applicationId: body.applicationId, scheduledAt, durationMins: durationMins, status: "SCHEDULED", roomUrl, aiFeedback: metadata } });
      await tx.interviewRoundProgress.upsert({
        where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } },
        update: { interviewId: created.id, status: "SCHEDULED" },
        create: { applicationId: application.id, roundId: round.id, interviewId: created.id, status: "SCHEDULED" },
      });
      return created;
    });
    const appNotification = await prisma.notification.create({
      data: {
        userId: application.candidateProfile.userId,
        title: `${round.name} interview scheduled`,
        message: `Your ${mode.toLowerCase()} interview is scheduled for ${scheduledAt.toISOString()}.`,
        type: "INTERVIEW",
      },
    }).then(() => ({ status: "CREATED" as const })).catch(() => ({ status: "FAILED" as const }));

    const interviewLink = roomId ? `/interviews/room/${encodeURIComponent(roomId)}` : "/interviews";
    const variables = {
      candidate_name: application.candidateProfile.user?.name || "Candidate",
      company_name: application.job.company.name,
      job_title: application.job.title,
      interview_date: scheduledAt.toISOString().slice(0, 10),
      interview_time: scheduledAt.toISOString().slice(11, 16),
      timezone: "UTC",
      interview_mode: mode,
      interview_link: interviewLink,
    };

    const email = !body.notifyEmail
      ? { status: "NOT_REQUESTED" as const }
      : !application.candidateProfile.user?.email
        ? { status: "MISSING_RECIPIENT" as const }
        : await dispatchCommunication({
            eventKey: "INTERVIEW_SCHEDULED",
            channel: "EMAIL",
            audience: "CANDIDATE",
            recipient: application.candidateProfile.user.email,
            variables,
            idempotencyKey: `interview:${interview.id}:scheduled:candidate:email`,
            correlationId: interview.id,
            recipientRef: application.candidateProfile.userId,
          }).then((delivery) => ({ status: delivery.status, deliveryId: delivery.id })).catch((error) => ({ status: "FAILED", error: error instanceof Error ? error.message : "Email dispatch failed." }));

    const whatsapp = !body.notifyWhatsapp
      ? { status: "NOT_REQUESTED" as const }
      : !application.candidateProfile.user?.phoneNumber
        ? { status: "MISSING_RECIPIENT" as const }
        : await dispatchCommunication({
            eventKey: "INTERVIEW_SCHEDULED",
            channel: "WHATSAPP",
            audience: "CANDIDATE",
            recipient: application.candidateProfile.user.phoneNumber,
            variables,
            idempotencyKey: `interview:${interview.id}:scheduled:candidate:whatsapp`,
            correlationId: interview.id,
            recipientRef: application.candidateProfile.userId,
          }).then((delivery) => ({ status: delivery.status, deliveryId: delivery.id })).catch((error) => ({ status: "FAILED", error: error instanceof Error ? error.message : "WhatsApp dispatch failed." }));

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      roomId,
      mode,
      scheduledAt: interview.scheduledAt,
      notifications: { app: appNotification, email, whatsapp },
      message: "Interview scheduled. Notification results are reported separately.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PREVIOUS_INTERVIEW_ROUND_INCOMPLETE") return NextResponse.json({ success: false, error: "The previous interview round must be completed before scheduling this round." }, { status: 409 });
    if (error instanceof Error && error.message === "INTERVIEW_ROUND_ALREADY_SCHEDULED") return NextResponse.json({ success: false, error: "This round is already scheduled for the candidate." }, { status: 409 });
    if (error instanceof Error && error.message === "APPLICATION_NOT_SCHEDULABLE") return NextResponse.json({ success: false, error: "The application entered a terminal state before the interview could be scheduled." }, { status: 409 });
    if (error instanceof Error && error.message === "INTERVIEW_TIME_CONFLICT") return NextResponse.json({ success: false, error: "The candidate or an assigned interviewer already has an overlapping interview." }, { status: 409 });
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid schedule." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Unable to schedule interview." }, { status: 500 });
  }
}
