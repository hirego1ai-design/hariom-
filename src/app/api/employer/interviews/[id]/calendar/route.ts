import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, " ")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) throw new ApiError("Unauthorized", 401);
    if (!["ADMIN", "EMPLOYER", "RECRUITER"].includes(session.role)) {
      throw new ApiError("Employer access required.", 403);
    }

    await enforceRateLimit(req, `employer_interview_calendar:${session.id}`, 30, 60_000);

    const { id } = await params;
    const interview = await prisma.interview.findUnique({
      include: { application: { include: { job: true } } },
      where: { id },
    });
    if (!interview) throw new ApiError("Interview not found.", 404);

    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
        select: { companyId: true },
      });
      if (!profile || profile.companyId !== interview.application.job.companyId) {
        throw new ApiError("You cannot access this interview.", 403);
      }
    }

    const end = new Date(interview.scheduledAt.getTime() + interview.durationMins * 60_000);
    const summary = escapeIcsText(`HireGo AI Interview - ${interview.application.job.title}`);
    const description = escapeIcsText("Managed hiring interview via HireGo AI");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HireGo AI//Managed Hiring//EN",
      "BEGIN:VEVENT",
      `UID:${interview.id}@hirego.ai`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(interview.scheduledAt)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename=hirego-interview-${interview.id}.ics`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
