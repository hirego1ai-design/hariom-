import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const changeSchema = z.object({ action: z.enum(["CANCEL", "RESCHEDULE"]), scheduledAt: z.string().datetime().optional(), reason: z.string().max(500).optional() });

async function authorizedInterview(id: string, session: { id: string; role: string }) {
  const interview = await prisma.interview.findUnique({ include: { application: { include: { job: true, candidateProfile: { include: { user: true } } } } }, where: { id } });
  if (!interview) return null;
  if (session.role === "ADMIN") return interview;
  const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = changeSchema.parse(await req.json());
    const interview = await authorizedInterview(id, session);
    if (!interview) return NextResponse.json({ success: false, error: "Interview not found or not accessible." }, { status: 404 });
    if (body.action === "RESCHEDULE" && !body.scheduledAt) return NextResponse.json({ success: false, error: "New date and time are required." }, { status: 400 });
    const currentMeta = (() => { try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; } catch { return {}; } })();
    const nextStatus = body.action === "CANCEL" ? "CANCELLED" : "RESCHEDULED";
    const updated = await prisma.interview.update({ where: { id }, data: { status: nextStatus, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : interview.scheduledAt, aiFeedback: JSON.stringify({ ...currentMeta, changeReason: body.reason || null, changedAt: new Date().toISOString() }) } });
    const candidateEmail = interview.application.candidateProfile.user?.email;
    if (candidateEmail) await sendEmail({ to: candidateEmail, subject: `HireGo AI interview ${body.action.toLowerCase()}`, html: `<p>Your interview has been <strong>${body.action.toLowerCase()}</strong>.</p>${body.scheduledAt ? `<p>New time: ${new Date(body.scheduledAt).toLocaleString()}</p>` : ""}${body.reason ? `<p>Reason: ${body.reason}</p>` : ""}` }).catch(() => undefined);
    return NextResponse.json({ success: true, interview: { id: updated.id, status: updated.status, scheduledAt: updated.scheduledAt }, message: `Interview ${body.action.toLowerCase()}d successfully.` });
  } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 }); return NextResponse.json({ success: false, error: "Unable to update interview." }, { status: 500 }); }
}
