import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getCurrentSession } from "@/lib/auth";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";

const activateSchema = z.object({ jobId: z.string().uuid() }).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "employer_copilot_read", 60, 60_000);
    const company = await getSessionCompany(session);
    const now = new Date();
    const [jobs, credits, config] = await Promise.all([
      prisma.jobListing.findMany({
        where: { companyId: company.id, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        select: {
          id: true, title: true, publishedAt: true, expiresAt: true,
          copilotEnabled: true, copilotActivatedAt: true,
          _count: { select: { applications: true } },
        },
        orderBy: [{ copilotEnabled: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.companyCredits.findUnique({ where: { companyId: company.id }, select: { copilotJobsLeft: true } }),
      prisma.hiringCopilotConfig.findUnique({ where: { id: "default" } }),
    ]);
    return NextResponse.json({
      success: true,
      jobs,
      copilotJobsLeft: credits?.copilotJobsLeft ?? 0,
      config,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "employer_copilot_activate", 20, 60_000);
    const company = await getSessionCompany(session);
    const { jobId } = await readValidatedJson(request, activateSchema);

    const result = await prisma.$transaction(async tx => {
      const job = await tx.jobListing.findFirst({
        where: { id: jobId, companyId: company.id },
        select: { id: true, title: true, status: true, expiresAt: true, copilotEnabled: true },
      });
      if (!job) throw new ApiError("Job not found.", 404);
      if (job.status !== "ACTIVE" || (job.expiresAt && job.expiresAt <= new Date())) {
        throw new ApiError("Co-Pilot can be activated only on an active job.", 409);
      }
      if (job.copilotEnabled) return { idempotent: true, job };

      const debit = await tx.companyCredits.updateMany({
        where: { companyId: company.id, copilotJobsLeft: { gt: 0 } },
        data: { copilotJobsLeft: { decrement: 1 } },
      });
      if (debit.count !== 1) {
        throw new ApiError("No Co-Pilot job entitlement is available. Add Co-Pilot or choose a Co-Pilot plan.", 402);
      }
      const activated = await tx.jobListing.update({
        where: { id: job.id },
        data: { copilotEnabled: true, copilotActivatedAt: new Date() },
        select: {
          id: true, title: true, publishedAt: true, expiresAt: true,
          copilotEnabled: true, copilotActivatedAt: true,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: company.id,
          action: "COPILOT_JOB_ACTIVATED",
          resource: `JobListing:${job.id}`,
          details: `HireGo Co-Pilot activated for ${job.title}.`,
        },
      });
      return { idempotent: false, job: activated };
    });

    return NextResponse.json({ success: true, ...result }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
