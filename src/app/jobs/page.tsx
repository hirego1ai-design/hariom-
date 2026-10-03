import Link from "next/link";
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

export default async function JobsPage() {
  const initial = await getInitialJobs();
  return (
    <JobsClient
      initialJobs={initial.jobs}
      initialTotalPages={initial.totalPages}
      seoIntro={
        <header className="mb-7 rounded-2xl border border-outline bg-bg-card p-6">
          <h1 className="text-3xl font-bold">Find Jobs and Career Opportunities on HireGo AI</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
            Browse current job listings published on HireGo AI. Review the role, location, requirements and employer information, then open the listing for full details and the available application path.
          </p>
          <nav className="mt-4 flex flex-wrap gap-4 text-sm font-semibold" aria-label="Job seeker resources">
            <Link href="/career-resources" className="text-primary">Career resources</Link>
            <Link href="/ai-mock-interview" className="text-primary">Mock interview practice</Link>
            <Link href="/video-resume" className="text-primary">Video resume</Link>
          </nav>
        </header>
      }
    />
  );
}
