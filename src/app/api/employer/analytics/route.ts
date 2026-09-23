import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  range: z.enum(["7", "30", "90"]).default("30"),
  jobId: z.string().uuid().optional(),
});

const STAGES = ["APPLIED", "SCREENING", "AI_INTERVIEW", "ASSESSMENT", "SHORTLISTED", "HIRED", "REJECTED", "WITHDRAWN"] as const;

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_analytics", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") {
      throw new ApiError("Administrator analytics require an explicitly scoped administration endpoint.", 400);
    }

    const company = await getSessionCompany(session);
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const rangeDays = Number(query.range);
    const end = new Date();
    const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const previousStart = new Date(start.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    if (query.jobId) {
      const ownedJob = await prisma.jobListing.findFirst({
        where: { id: query.jobId, companyId: company.id },
        select: { id: true },
      });
      if (!ownedJob) throw new ApiError("Job listing not found.", 404);
    }

    const applicationWhere = {
      job: { companyId: company.id },
      createdAt: { gte: start, lte: end },
      ...(query.jobId ? { jobId: query.jobId } : {}),
    } as const;

    const previousWhere = {
      job: { companyId: company.id },
      createdAt: { gte: previousStart, lt: start },
      ...(query.jobId ? { jobId: query.jobId } : {}),
    } as const;

    const [applications, previousApplications, activeJobs, completedInterviews] = await Promise.all([
      prisma.application.findMany({
        where: applicationWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          job: { select: { id: true, title: true, department: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.application.count({ where: previousWhere }),
      prisma.jobListing.count({
        where: {
          companyId: company.id,
          status: "ACTIVE",
          ...(query.jobId ? { id: query.jobId } : {}),
        },
      }),
      prisma.interview.count({
        where: {
          application: {
            job: {
              companyId: company.id,
              ...(query.jobId ? { id: query.jobId } : {}),
            },
          },
          status: "COMPLETED",
          scheduledAt: { gte: start, lte: end },
        },
      }),
    ]);

    const stageCounts = Object.fromEntries(
      STAGES.map((stage) => [stage, applications.filter((application) => application.status === stage).length]),
    ) as Record<(typeof STAGES)[number], number>;

    const hired = applications.filter((application) => application.status === "HIRED");
    const averageTimeToHireDays = hired.length
      ? Number(
          (
            hired.reduce(
              (total, application) => total + Math.max(0, application.updatedAt.getTime() - application.createdAt.getTime()),
              0,
            ) /
            hired.length /
            86_400_000
          ).toFixed(1),
        )
      : null;

    const departmentMap = new Map<string, { applications: number; hires: number }>();
    for (const application of applications) {
      const department = application.job.department?.trim() || "Unspecified";
      const current = departmentMap.get(department) || { applications: 0, hires: 0 };
      current.applications += 1;
      if (application.status === "HIRED") current.hires += 1;
      departmentMap.set(department, current);
    }

    const applicationGrowthPercent =
      previousApplications === 0
        ? null
        : Number((((applications.length - previousApplications) / previousApplications) * 100).toFixed(1));

    return NextResponse.json({
      success: true,
      data: {
        rangeDays,
        selectedJobId: query.jobId || null,
        metrics: {
          applications: applications.length,
          previousApplications,
          applicationGrowthPercent,
          activeJobs,
          completedInterviews,
          hires: hired.length,
          averageTimeToHireDays,
        },
        funnel: stageCounts,
        departments: [...departmentMap.entries()]
          .map(([name, values]) => ({
            name,
            applications: values.applications,
            hires: values.hires,
            conversionPercent: values.applications
              ? Number(((values.hires / values.applications) * 100).toFixed(1))
              : 0,
          }))
          .sort((a, b) => b.applications - a.applications),
        recentApplications: applications.slice(0, 20).map((application) => ({
          id: application.id,
          status: application.status,
          jobId: application.job.id,
          jobTitle: application.job.title,
          department: application.job.department,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        })),
        unavailableMetrics: [
          "Cost per hire is not shown because no authoritative hiring-cost ledger is attached to applications.",
          "Source attribution is not shown because application source is not currently persisted on the Application record.",
          "Offer acceptance is not shown because the current application status model has no authoritative OFFER state.",
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
