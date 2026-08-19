import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

const schema = z.object({ stage: z.enum(["SCREENING", "ASSESSMENT", "AI_INTERVIEW", "SHORTLISTED", "HIRED", "REJECTED"]) });
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const { stage } = schema.parse(await req.json());
    const application = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!application) return NextResponse.json({ success: false, error: "Candidate application not found." }, { status: 404 });
    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!profile || profile.companyId !== application.job.companyId) {
        return NextResponse.json({ success: false, error: "Candidate is not in your company pipeline." }, { status: 403 });
      }
    }
    await prisma.application.update({ where: { id }, data: { status: stage as any } });
    return NextResponse.json({ success: true, applicationId: id, stage });
  } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 }); return NextResponse.json({ success: false, error: "Unable to update candidate stage." }, { status: 500 }); }
}
