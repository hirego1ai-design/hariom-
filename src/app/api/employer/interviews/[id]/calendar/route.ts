import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession(req.headers);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const interview = await prisma.interview.findUnique({ include: { application: { include: { job: true } } }, where: { id } });
  if (!interview) return NextResponse.json({ success: false, error: "Interview not found." }, { status: 404 });
  if (session.role !== "ADMIN") {
    const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
    if (!profile || profile.companyId !== interview.application.job.companyId) return NextResponse.json({ success: false, error: "You cannot access this interview." }, { status: 403 });
  }
  const end = new Date(interview.scheduledAt.getTime() + interview.durationMins * 60000);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HireGo AI//Managed Hiring//EN", "BEGIN:VEVENT", `UID:${interview.id}@hirego.ai`, `DTSTAMP:${format(new Date())}`, `DTSTART:${format(interview.scheduledAt)}`, `DTEND:${format(end)}`, `SUMMARY:HireGo AI Interview - ${interview.application.job.title}`, `DESCRIPTION:Managed hiring interview via HireGo AI`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename=hirego-interview-${interview.id}.ics` } });
}
