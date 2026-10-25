import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activePublicJobWhere } from "@/lib/publicJobs";
import JobsClient, { type Job } from "./JobsClient";

const PAGE_SIZE = 20;

const getInitialJobs = unstable_cache(
  async (): Promise<{ jobs: Job[]; totalPages: number }> => {
    try {
      const where = activePublicJobWhere(new Date());

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
    } catch (err) {
      console.warn("[getInitialJobs] Database unreachable during prerender:", err instanceof Error ? err.message : err);
      return { jobs: [], totalPages: 1 };
    }
  },
  ["public-jobs-initial-v2"],
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
