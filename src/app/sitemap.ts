import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { effectivePublishedWhere, editorialPublicPath } from "@/lib/contentCms";

const base = "https://hiregoai.com";
export const revalidate = 3600;

// Only public, indexable pages belong in the sitemap. Account, employer,
// candidate, admin and API routes are intentionally excluded.
const publicPaths = [
  "/", "/features", "/services", "/solutions", "/video-resume",
  "/pricing", "/about", "/company", "/enterprise", "/contact",
  "/careers", "/blog", "/press-releases", "/resources", "/find-jobs", "/career-resources",
  "/ai-features", "/certifications", "/post-job-public",
  "/legal", "/privacy", "/terms", "/refund-cancellation", "/service-delivery",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : ["/services", "/solutions", "/video-resume", "/about", "/resources"].includes(path) ? .8 : .6,
  }));

  try {
    const editorial = await prisma.editorialContent.findMany({
      where: effectivePublishedWhere(),
      select: { type: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    return [
      ...staticEntries,
      ...editorial.map((item) => ({
        url: `${base}${editorialPublicPath(item.type, item.slug)}`,
        lastModified: item.updatedAt,
        changeFrequency: "monthly" as const,
        priority: item.type === "PRESS_RELEASE" ? .7 : .65,
      })),
    ];
  } catch {
    // Keep the sitemap available even during a temporary database outage.
    return staticEntries;
  }
}
