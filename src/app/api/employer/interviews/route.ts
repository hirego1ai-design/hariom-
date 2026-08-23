import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function metadata(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const employer = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!employer) return NextResponse.json({ success: false, error: "Employer profile not found." }, { status: 404 });
      companyId = employer.companyId;
    }

    const interviews = await prisma.interview.findMany({
      where: companyId ? { application: { job: { companyId } } } : undefined,
      include: {
        application: {
          include: {
            job: { select: { title: true, company: { select: { name: true } } } },
            candidateProfile: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      interviews: interviews.map((interview) => {
        const meta = metadata(interview.aiFeedback) as Record<string, unknown>;
        return {
          id: interview.id,
          applicationId: interview.applicationId,
          scheduledAt: interview.scheduledAt.toISOString(),
          durationMins: interview.durationMins,
          status: interview.status,
          roomUrl: interview.roomUrl,
          round: typeof meta.round === "string" ? meta.round : "Interview",
          mode: typeof meta.mode === "string" ? meta.mode : interview.roomUrl ? "ONLINE" : "OFFLINE",
          candidateName: interview.application.candidateProfile.user?.name || "Candidate",
          candidateEmail: interview.application.candidateProfile.user?.email || null,
          jobTitle: interview.application.job.title,
          companyName: interview.application.job.company.name,
        };
      }),
    });
  } catch (error) {
    console.error("Employer interviews list error:", error);
    return NextResponse.json({ success: false, error: "Unable to load interviews." }, { status: 500 });
  }
}
