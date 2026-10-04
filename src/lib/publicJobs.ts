import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SeoJobCity } from "@/lib/seoJobCities";
import type { SeoJobCategory } from "@/lib/seoJobCategories";
import { categoryPrismaOr } from "@/lib/seoJobCategories";

export function activePublicJobWhere(now = new Date()): Prisma.JobListingWhereInput {
  return {
    status: "ACTIVE",
    publishedAt: { not: null },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    NOT: { aiFocusAreas: "QA_TEST_PUBLIC_JOB" },
  };
}

export const getPublicJobById = cache(async (id: string) => {
  const job = await prisma.jobListing.findFirst({
    where: {
      id,
      ...activePublicJobWhere(),
    },
    include: {
      company: {
        select: {
          name: true,
          logoUrl: true,
          website: true,
          description: true,
          location: true,
        },
      },
    },
  });
  if (!job?.publishedAt) return null;
  return { ...job, publishedAt: job.publishedAt };
});

export async function getPublicJobsForCity(
  city: SeoJobCity,
  category?: SeoJobCategory,
  limit = 60,
) {
  const cityFilter: Prisma.JobListingWhereInput = {
    OR: city.dbTerms.map((term) => ({
      location: { contains: term, mode: "insensitive" as const },
    })),
  };
  const categoryFilters = category ? categoryPrismaOr(category) : [];

  return prisma.jobListing.findMany({
    where: {
      AND: [
        activePublicJobWhere(),
        cityFilter,
        ...(category ? [{ OR: categoryFilters }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      location: true,
      type: true,
      workMode: true,
      experienceLevel: true,
      salaryRange: true,
      publishedAt: true,
      company: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: Math.max(1, Math.min(limit, 100)),
  });
}
