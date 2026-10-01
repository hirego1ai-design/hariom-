import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/employer/", "/candidate/", "/dashboard/", "/settings/", "/onboarding/", "/profile/", "/applications/", "/billing/", "/messages/", "/payment/", "/checkout/", "/login", "/register", "/signin", "/signup"] },
    sitemap: "https://www.hiregoai.com/sitemap.xml",
    host: "https://www.hiregoai.com",
  };
}
