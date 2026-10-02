import type { Metadata } from "next";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import JobsClient, { type Job } from "./JobsClient";

export const metadata: Metadata = marketingMetadata({
  path: "/jobs",
  title: "HireGo Jobs | Find Jobs & Career Opportunities",
  description: "Explore HireGo jobs and career opportunities. Build a job-ready profile, discover relevant roles and move through a connected candidate hiring workflow.",
});

const PAGE_SIZE = 20;

const getInitialJobs = unstable_cache(
  async (): Promise<{ jobs: Job[]; totalPages: number }> => {
    const now = new Date();
    const where = {
      status: "ACTIVE" as const,
      publishedAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        take: PAGE_SIZE,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          location: true,
          type: true,
          salaryRange: true,
          description: true,
          requirements: true,
          company: {
            select: {
              name: true,
              logoUrl: true,
              location: true,
            },
          },
        },
      }),
      prisma.jobListing.count({ where }),
    ]);

    return {
      jobs,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  },
  ["public-jobs-initial-v1"],
  { revalidate: 15 },
);

export default async function JobsPage() {
  const initial = await getInitialJobs();
  return (
    <JobsClient
      initialJobs={initial.jobs}
      initialTotalPages={initial.totalPages}
    />
  );
}
