import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
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
    const { session, job } = await resolveEmployerJob(request, id);
    const body = await readValidatedJson(request, boostSchema);

    const tier = JOB_BOOST_TIERS.find((t) => t.id === body.tierId);
    if (!tier) {
      throw new ApiError("Invalid job boost tier selected", 400);
    }

    const boostExpiresAt = new Date(Date.now() + tier.days * 24 * 60 * 60 * 1000);
    const currentConfig = (job.matchingConfig && typeof job.matchingConfig === "object" && !Array.isArray(job.matchingConfig))
      ? (job.matchingConfig as Record<string, unknown>)
      : {};

    const updatedConfig = {
      ...currentConfig,
      isBoosted: true,
      boostTier: tier.id,
      boostName: tier.name,
      boostedAt: new Date().toISOString(),
      boostExpiresAt: boostExpiresAt.toISOString(),
    };

    const txId = `boost_tx_${crypto.randomUUID()}`;

    await prisma.$transaction(async (tx) => {
      await tx.jobListing.update({
        where: { id: job.id },
        data: { matchingConfig: updatedConfig },
      });

      await tx.paymentTransaction.create({
        data: {
          gatewayTxId: txId,
          companyId: job.companyId,
          planId: tier.id,
          amount: tier.price,
          currency: tier.currency,
          status: "SUCCESS",
          provider: "STRIPE",
          rawPayload: {
            revenueSource: "Job Boost",
            planName: tier.name,
            customerName: job.company?.name || session.email || "Employer",
            customerType: "Employer",
            jobId: job.id,
            jobTitle: job.title,
            durationDays: tier.days,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `"${job.title}" has been successfully boosted with ${tier.name}!`,
      boost: {
        jobId: job.id,
        tier: tier.name,
        expiresAt: boostExpiresAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
