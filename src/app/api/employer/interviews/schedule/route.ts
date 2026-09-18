import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

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
    const application = await prisma.application.findUnique({ include: { candidateProfile: { include: { user: true } }, job: true }, where: { id: body.applicationId } });
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
    const mode = round.interviewType === "IN_PERSON" || round.interviewType === "OFFLINE" ? "OFFLINE" : "ONLINE";
    const durationMins = round.durationMins;
    if (mode === "OFFLINE" && !body.address) return NextResponse.json({ success: false, error: "Address is required for this configured offline round." }, { status: 400 });
    if (mode === "OFFLINE" && !body.contactNumber) return NextResponse.json({ success: false, error: "Contact number is required for this configured offline round." }, { status: 400 });
    if (round.interviewers.length === 0) return NextResponse.json({ success: false, error: "Assign at least one interviewer before scheduling this round." }, { status: 400 });
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
    const roomId = `room-${crypto.randomUUID()}`;
    const roomUrl = mode === "ONLINE" ? `/employer/active-video-interview-interviewer-view?roomId=${roomId}` : `OFFLINE:${JSON.stringify({ address: body.address, contactNumber: body.contactNumber })}`;
    const metadata = JSON.stringify({ mode: mode, roundId: round.id, round: round.name, address: body.address || null, contactNumber: body.contactNumber || null, instructions: body.instructions || null, notifyWhatsapp: body.notifyWhatsapp, roomId });
    const interview = await prisma.$transaction(async (tx) => {
      // Serialize scheduling for this application. The preflight read above is
      // only for a friendly error; this lock + re-read is the authoritative
      // duplicate-scheduling guard across concurrent requests/replicas.
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${application.id} FOR UPDATE`;
      const lockedApplication = await tx.application.findUnique({ where: { id: application.id }, select: { status: true } });
      if (!lockedApplication || ["HIRED", "REJECTED", "WITHDRAWN"].includes(lockedApplication.status)) {
        throw new Error("APPLICATION_NOT_SCHEDULABLE");
      }
      const progress = await tx.interviewRoundProgress.findUnique({
        where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } },
        select: { interviewId: true, status: true },
      });
      if (progress?.interviewId) {
        throw new Error("INTERVIEW_ROUND_ALREADY_SCHEDULED");
      }
      const created = await tx.interview.create({ data: { applicationId: body.applicationId, scheduledAt: new Date(body.scheduledAt), durationMins: durationMins, status: "SCHEDULED", roomUrl, aiFeedback: metadata } });
      await tx.interviewRoundProgress.upsert({
        where: { applicationId_roundId: { applicationId: application.id, roundId: round.id } },
        update: { interviewId: created.id, status: "SCHEDULED" },
        create: { applicationId: application.id, roundId: round.id, interviewId: created.id, status: "SCHEDULED" },
      });
      return created;
    });
    await prisma.notification.create({ data: { userId: application.candidateProfile.userId, title: `${round.name} interview scheduled`, message: `Your ${mode.toLowerCase()} interview is scheduled for ${new Date(body.scheduledAt).toLocaleString()}.`, type: "INTERVIEW" } }).catch(() => undefined);
    if (body.notifyEmail && application.candidateProfile.user?.email) {
      await sendEmail({ to: application.candidateProfile.user.email, subject: "HireGo AI interview scheduled", html: `<p>Your ${round.name} interview is scheduled for <strong>${new Date(body.scheduledAt).toLocaleString()}</strong>.</p><p>Mode: ${mode}</p>${mode === "OFFLINE" ? `<p>Address: ${body.address}<br/>Contact: ${body.contactNumber}</p>` : `<p>Join from your HireGo interview portal.</p>`}` }).catch(() => undefined);
    }
    const whatsapp = body.notifyWhatsapp && application.candidateProfile.user?.phoneNumber ? await sendWhatsAppMessage(application.candidateProfile.user.phoneNumber, `HireGo AI ${round.name} interview scheduled for ${new Date(body.scheduledAt).toLocaleString()}.`) : { sent: false, reason: body.notifyWhatsapp ? "Candidate phone number is missing." : "Not selected." };
    return NextResponse.json({ success: true, interviewId: interview.id, roomId, mode: mode, scheduledAt: interview.scheduledAt, notifications: { app: true, email: body.notifyEmail, whatsapp }, message: "Interview scheduled and candidate notification queued." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INTERVIEW_ROUND_ALREADY_SCHEDULED") return NextResponse.json({ success: false, error: "This round is already scheduled for the candidate." }, { status: 409 });
    if (error instanceof Error && error.message === "APPLICATION_NOT_SCHEDULABLE") return NextResponse.json({ success: false, error: "The application entered a terminal state before the interview could be scheduled." }, { status: 409 });
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid schedule." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Unable to schedule interview." }, { status: 500 });
  }
}
