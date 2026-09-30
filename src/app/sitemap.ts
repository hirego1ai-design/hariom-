import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { effectivePublishedWhere, editorialPublicPath } from "@/lib/contentCms";
import { SEO_JOB_CITIES, matchesSeoCity } from "@/lib/seoJobCities";
import { categoriesForCity, matchesSeoCategory } from "@/lib/seoJobCategories";

const base = "https://hiregoai.com";
export const revalidate = 3600;

// Only public, indexable pages belong in the sitemap. Account, employer,
// candidate, admin and API routes are intentionally excluded.
const publicPaths = [
  "/", "/features", "/services", "/solutions", "/video-resume",
  "/pricing", "/about", "/company", "/enterprise", "/contact",
  "/careers", "/blog", "/press-releases", "/resources", "/find-jobs", "/career-resources",
  "/ai-features", "/certifications", "/post-job-public", "/jobs", "/jobs-in", "/free-job-posting",
  "/legal", "/privacy", "/terms", "/refund-cancellation", "/service-delivery",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : path === "/jobs" ? "daily" : "monthly",
    priority: path === "/" ? 1 : ["/services", "/solutions", "/video-resume", "/about", "/resources", "/jobs", "/free-job-posting"].includes(path) ? .8 : .6,
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

    const cityEntries: MetadataRoute.Sitemap = SEO_JOB_CITIES
      .filter((city) => jobs.filter((job) => matchesSeoCity(job.location, city)).length >= 3)
      .map((city) => ({
        url: `${base}/jobs-in/${city.slug}`,
        changeFrequency: "daily",
        priority: .7,
      }));

    const categoryEntries: MetadataRoute.Sitemap = SEO_JOB_CITIES.flatMap((city) => {
      const cityJobs = jobs.filter((job) => matchesSeoCity(job.location, city));
      return categoriesForCity(city.slug)
        .filter((category) => cityJobs.filter((job) => matchesSeoCategory(job, category)).length >= 3)
        .map((category) => ({
          url: `${base}/jobs-in/${city.slug}/${category.slug}`,
          changeFrequency: "daily" as const,
          priority: .68,
        }));
    });

    return [
      ...staticEntries,
      ...freePostingCityEntries,
      ...cityEntries,
      ...categoryEntries,
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
    return [...staticEntries, ...freePostingCityEntries];
  }
}
