import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import JobsClient, { type Job } from "./JobsClient";

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

export default async function JobsPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<{ location?: string | string[] }>;
} = {}) {
  const [initial, params] = await Promise.all([getInitialJobs(), searchParams]);
  const initialLocation = typeof params.location === "string" ? params.location : "";

  return (
    <JobsClient
      initialJobs={initial.jobs}
      initialTotalPages={initial.totalPages}
      initialLocation={initialLocation}
    />
  );
}
