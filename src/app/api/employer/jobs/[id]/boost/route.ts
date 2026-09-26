import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export const JOB_BOOST_TIERS = [
  { id: "boost_7d", name: "Standard 7-Day Boost", days: 7, price: 1499, currency: "INR", description: "Top ranking in search & candidate recommendation feed for 7 days" },
  { id: "boost_14d", name: "High-Visibility 14-Day Boost", days: 14, price: 2499, currency: "INR", description: "Priority placement, email highlight, and feed pin for 14 days" },
  { id: "boost_30d", name: "Executive 30-Day Boost", days: 30, price: 4499, currency: "INR", description: "Maximum reach with sponsored badge and AI matching priority for 30 days" },
];

const boostSchema = z.object({
  tierId: z.string().trim().min(1).max(50),
}).strict();

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
      tiers: JOB_BOOST_TIERS,
      purchaseStatus: "PAYMENT_INTEGRATION_REQUIRED",
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
    await readValidatedJson(request, boostSchema);
    throw new ApiError(
      "Job Boost purchase is unavailable until a provider-backed payment order and verified webhook fulfillment are connected.",
      503,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
