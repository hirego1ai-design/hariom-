import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

const feedbackSchema = z.object({
  overallRating: z.enum(["STRONG_HIRE", "HIRE", "NEUTRAL", "NO_HIRE", "STRONG_NO"]),
  communication: z.number().int().min(1).max(10),
  technical: z.number().int().min(1).max(10),
  cultureFit: z.number().int().min(1).max(10),
  problemSolving: z.number().int().min(1).max(10),
  enthusiasm: z.number().int().min(1).max(10),
  strengths: z.string().min(50),
  improvement: z.string().min(50),
  recommendation: z.enum(["PROCEED", "ON_HOLD", "REJECT"]),
  redFlags: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = feedbackSchema.parse(await request.json());
    const interview = await prisma.interview.findUnique({ include: { application: { include: { job: true } } }, where: { id } });
    if (!interview) return NextResponse.json({ success: false, error: "Interview not found." }, { status: 404 });
    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!profile || profile.companyId !== interview.application.job.companyId) return NextResponse.json({ success: false, error: "You cannot submit feedback for this interview." }, { status: 403 });
    }
    const currentMeta = (() => {
      try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; }
      catch { return {}; }
    })();
    const submittedAt = new Date().toISOString();
    const nextApplicationStatus = body.recommendation === "REJECT" ? "REJECTED" : body.recommendation === "PROCEED" ? "SHORTLISTED" : null;
    const [saved] = await prisma.$transaction([
      prisma.interview.update({
        where: { id },
        data: {
          status: "FEEDBACK_SUBMITTED",
          aiFeedback: JSON.stringify({
            ...currentMeta,
            finalFeedback: { ...body, submittedBy: session.id, submittedAt },
          }),
        },
      }),
      ...(nextApplicationStatus
        ? [prisma.application.update({ where: { id: interview.applicationId }, data: { status: nextApplicationStatus } })]
        : []),
    ]);
    return NextResponse.json({ success: true, interviewId: saved.id, message: "Final-round feedback submitted successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid feedback." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Unable to save feedback." }, { status: 500 });
  }
}
