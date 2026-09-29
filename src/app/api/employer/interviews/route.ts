import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/apiSecurity";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
  await enforceRateLimit(request, "employer_interviews_list", 60, 60_000);
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

    const { searchParams } = new URL(request.url);
    const requestedLimit = searchParams.get("limit");
    const requestedCursor = searchParams.get("cursor");
    const scope = searchParams.get("scope") || "all";
    const limit = requestedLimit === null ? DEFAULT_LIMIT : Number(requestedLimit);

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return NextResponse.json(
        { success: false, error: `limit must be an integer between 1 and ${MAX_LIMIT}.` },
        { status: 400 },
      );
    }
    if (!["all", "upcoming"].includes(scope)) {
      return NextResponse.json({ success: false, error: "Invalid interview list scope." }, { status: 400 });
    }
    if (
      requestedCursor &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedCursor)
    ) {
      return NextResponse.json({ success: false, error: "Invalid interview cursor." }, { status: 400 });
    }

    const now = new Date();
    const interviews = await prisma.interview.findMany({
      where: {
        ...(companyId ? { application: { job: { companyId } } } : {}),
        ...(scope === "upcoming"
          ? {
              OR: [
                { status: "LIVE" },
                {
                  status: { in: ["SCHEDULED", "RESCHEDULED"] },
                  scheduledAt: { gte: now },
                },
              ],
            }
          : {}),
      },
      include: {
        application: {
          include: {
            job: { select: { title: true, company: { select: { name: true } } } },
            candidateProfile: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      cursor: requestedCursor ? { id: requestedCursor } : undefined,
      skip: requestedCursor ? 1 : 0,
      take: limit + 1,
    });

    const page = interviews.slice(0, limit);
    const nextCursor = interviews.length > limit ? page[page.length - 1]?.id || null : null;

    return NextResponse.json({
      success: true,
      interviews: page.map((interview) => {
        const meta = metadata(interview.aiFeedback) as Record<string, unknown>;
        return {
          id: interview.id,
          applicationId: interview.applicationId,
          scheduledAt: interview.scheduledAt.toISOString(),
          durationMins: interview.durationMins,
          status: interview.status,
          roomUrl:
            (typeof meta.mode === "string" ? meta.mode : interview.roomUrl ? "ONLINE" : "OFFLINE") === "ONLINE"
              ? interview.roomUrl
              : null,
          round: typeof meta.round === "string" ? meta.round : "Interview",
          mode: typeof meta.mode === "string" ? meta.mode : interview.roomUrl ? "ONLINE" : "OFFLINE",
          address: typeof meta.address === "string" ? meta.address : null,
          contactNumber: typeof meta.contactNumber === "string" ? meta.contactNumber : null,
          candidateName: interview.application.candidateProfile.user?.name || "Candidate",
          candidateEmail: interview.application.candidateProfile.user?.email || null,
          jobTitle: interview.application.job.title,
          companyName: interview.application.job.company.name,
        };
      }),
      pagination: {
        limit,
        nextCursor,
        hasMore: nextCursor !== null,
      },
    });
  } catch (error) {
    console.error("Employer interviews list error:", error);
    return NextResponse.json({ success: false, error: "Unable to load interviews." }, { status: 500 });
  }
}
