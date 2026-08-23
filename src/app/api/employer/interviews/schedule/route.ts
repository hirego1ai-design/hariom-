import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const schema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().min(15).max(240).default(60),
  mode: z.enum(["ONLINE", "OFFLINE"]),
  round: z.enum(["HR_SCREENING", "TECHNICAL", "OPERATIONS", "SYSTEM_DESIGN", "FINAL"]),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  instructions: z.string().max(2000).optional(),
  notifyEmail: z.boolean().default(true),
  notifyWhatsapp: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.mode === "OFFLINE" && !data.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Address is required for an offline interview." });
  if (data.mode === "OFFLINE" && !data.contactNumber) ctx.addIssue({ code: "custom", path: ["contactNumber"], message: "Contact number is required for an offline interview." });
});

export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await request.json());
    const application = await prisma.application.findUnique({ include: { candidateProfile: { include: { user: true } }, job: true }, where: { id: body.applicationId } });
    if (!application) return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!profile || profile.companyId !== application.job.companyId) return NextResponse.json({ success: false, error: "You cannot schedule this candidate." }, { status: 403 });
    }
    const roomId = `room-${crypto.randomUUID()}`;
    const roomUrl = body.mode === "ONLINE" ? `/employer/active-video-interview-interviewer-view?roomId=${roomId}` : `OFFLINE:${JSON.stringify({ address: body.address, contactNumber: body.contactNumber })}`;
    const metadata = JSON.stringify({ mode: body.mode, round: body.round, address: body.address || null, contactNumber: body.contactNumber || null, instructions: body.instructions || null, notifyWhatsapp: body.notifyWhatsapp, roomId });
    const interview = await prisma.interview.create({ data: { applicationId: body.applicationId, scheduledAt: new Date(body.scheduledAt), durationMins: body.durationMins, status: "SCHEDULED", roomUrl, aiFeedback: metadata } });
    await prisma.notification.create({ data: { userId: application.candidateProfile.userId, title: `${body.round.replaceAll("_", " ")} interview scheduled`, message: `Your ${body.mode.toLowerCase()} interview is scheduled for ${new Date(body.scheduledAt).toLocaleString()}.`, type: "INTERVIEW" } }).catch(() => undefined);
    if (body.notifyEmail && application.candidateProfile.user?.email) {
      await sendEmail({ to: application.candidateProfile.user.email, subject: "HireGo AI interview scheduled", html: `<p>Your ${body.round.replaceAll("_", " ")} interview is scheduled for <strong>${new Date(body.scheduledAt).toLocaleString()}</strong>.</p><p>Mode: ${body.mode}</p>${body.mode === "OFFLINE" ? `<p>Address: ${body.address}<br/>Contact: ${body.contactNumber}</p>` : `<p>Join from your HireGo interview portal.</p>`}` }).catch(() => undefined);
    }
    const whatsapp = body.notifyWhatsapp && application.candidateProfile.user?.phoneNumber ? await sendWhatsAppMessage(application.candidateProfile.user.phoneNumber, `HireGo AI ${body.round.replaceAll("_", " ")} interview scheduled for ${new Date(body.scheduledAt).toLocaleString()}.`) : { sent: false, reason: body.notifyWhatsapp ? "Candidate phone number is missing." : "Not selected." };
    return NextResponse.json({ success: true, interviewId: interview.id, roomId, mode: body.mode, scheduledAt: interview.scheduledAt, notifications: { app: true, email: body.notifyEmail, whatsapp }, message: "Interview scheduled and candidate notification queued." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid schedule." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Unable to schedule interview." }, { status: 500 });
  }
}
