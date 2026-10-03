import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { effectivePublishedWhere, editorialPublicPath } from "@/lib/contentCms";
import { SEO_JOB_CITIES } from "@/lib/seoJobCities";
import { MOCK_INTERVIEW_ROLES } from "@/lib/revenueSeo";

const base = "https://www.hiregoai.com";
export const revalidate = 300;

// Keep the launch announcement discoverable even if the dynamic editorial query
// temporarily fails; the canonical article itself remains CMS-managed.
const launchPressReleasePath = "/press-releases/hirego-ai-launch-october-13-2026";

// Only public, indexable pages belong in the sitemap. Account, employer,
// candidate, admin and API routes are intentionally excluded.
const publicPaths = [
  "/", "/features", "/services", "/solutions", "/video-resume",
  "/pay-per-hire", "/ai-hiring-copilot", "/candidate-screening-software", "/interview-proctoring-software", "/ai-mock-interview", "/hire-talent-in-india",
  "/pricing", "/about", "/company", "/enterprise", "/contact",
  "/careers", "/blog", "/press-releases", "/press-kit", "/resources", "/find-jobs", "/career-resources",
  "/ai-features", "/certifications", "/post-job-public", "/jobs", "/free-job-posting",
  "/free-job-posting-sites-in-india", "/how-to-post-a-job-for-free", "/where-to-post-jobs-for-free", "/free-job-posting-for-employers",
  "/legal", "/privacy", "/terms", "/refund-cancellation", "/service-delivery",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : path === "/jobs" ? "daily" : "monthly",
    priority: path === "/" ? 1 : ["/services", "/solutions", "/video-resume", "/hire-talent-in-india", "/about", "/resources", "/jobs", "/free-job-posting"].includes(path) ? .8 : .6,
  }));

  const launchPressReleaseEntry: MetadataRoute.Sitemap = [{
    url: `${base}${launchPressReleasePath}`,
    changeFrequency: "weekly",
    priority: .8,
  }];

  const mockInterviewRoleEntries: MetadataRoute.Sitemap = MOCK_INTERVIEW_ROLES.map((role) => ({
    url: `${base}/ai-mock-interview/${role.slug}`,
    changeFrequency: "monthly",
    priority: .7,
  }));

  const freePostingCityEntries: MetadataRoute.Sitemap = SEO_JOB_CITIES.map((city) => ({
    url: `${base}/free-job-posting/${city.slug}`,
    changeFrequency: "monthly",
    priority: .72,
  }));

  try {
    const now = new Date();
    const [editorial, jobs] = await Promise.all([
      prisma.editorialContent.findMany({
        where: effectivePublishedWhere(),
        select: { type: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      prisma.jobListing.findMany({
        where: {
          status: "ACTIVE",
          publishedAt: { not: null },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          NOT: { aiFocusAreas: "QA_TEST_PUBLIC_JOB" },
        },
        select: {
          id: true,
          updatedAt: true,
          location: true,
          title: true,
          department: true,
          requirements: true,
          experienceLevel: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
    ]);

    const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
      url: `${base}/jobs/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily",
      priority: .78,
    }));

    return [
      ...staticEntries,
      ...mockInterviewRoleEntries,
      ...freePostingCityEntries,
      ...launchPressReleaseEntry,
      ...jobEntries,
      ...editorial.map((item) => ({
        url: `${base}${editorialPublicPath(item.type, item.slug)}`,
        lastModified: item.updatedAt,
        changeFrequency: "monthly" as const,
        priority: item.type === "PRESS_RELEASE" ? .7 : .65,
      })),
    ];
  } catch {
    // Keep the sitemap available even during a temporary database outage.
    return [...staticEntries, ...mockInterviewRoleEntries, ...freePostingCityEntries, ...launchPressReleaseEntry];
  }
}
