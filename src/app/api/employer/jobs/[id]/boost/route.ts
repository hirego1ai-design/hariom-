import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";


async function resolveEmployerJob(request: NextRequest, jobId: string) {
  const session = await getCurrentSession(request.headers);
  if (!session || (session.role !== "EMPLOYER" && session.role !== "ADMIN")) {
    throw new ApiError("Employer access required", 403);
  }

  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) {
    throw new ApiError("Job listing not found", 404);
  }

  if (session.role !== "ADMIN") {
    const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
    if (!profile?.companyId || job.companyId !== profile.companyId) {
      throw new ApiError("Unauthorized to manage this job listing", 403);
    }
  }

  return { session, job };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_job_boost_get", 60, 60_000);
    const { id } = await params;
    const { job } = await resolveEmployerJob(request, id);

    const config = (job.matchingConfig && typeof job.matchingConfig === "object" && !Array.isArray(job.matchingConfig))
      ? (job.matchingConfig as Record<string, unknown>)
      : {};

    const isBoosted = Boolean(config.isBoosted);
    const boostExpiresAt = typeof config.boostExpiresAt === "string" ? config.boostExpiresAt : null;
    const isExpired = boostExpiresAt ? new Date(boostExpiresAt).getTime() < Date.now() : true;

    return NextResponse.json({
      success: true,
      tiers: [],
      purchaseStatus: "UNAVAILABLE",
      boostStatus: {
        isBoosted: isBoosted && !isExpired,
        boostTier: config.boostTier || null,
        boostName: config.boostName || null,
        boostedAt: config.boostedAt || null,
        boostExpiresAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_job_boost_post", 10, 60_000);
    const { id } = await params;
    await resolveEmployerJob(request, id);
    throw new ApiError(
      "Job Boost purchase is unavailable until boost products are admin-managed and provider-backed payment fulfillment is enabled.",
      503,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
