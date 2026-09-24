import type { MetadataRoute } from "next";

const base = "https://hiregoai.com";
// Only public, indexable pages belong in the sitemap. Account, employer,
// candidate, admin and API routes are intentionally excluded.
const publicPaths = [
  "/", "/features", "/services", "/solutions", "/video-resume",
  "/pricing", "/about", "/company", "/enterprise", "/contact",
  "/careers", "/blog", "/find-jobs", "/career-resources",
  "/ai-features", "/certifications", "/post-job-public",
  "/legal", "/privacy", "/terms", "/refund-cancellation", "/service-delivery",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map(path => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : ["/services", "/solutions", "/video-resume", "/about", "/legal"].includes(path) ? .8 : .6,
  }));
}
