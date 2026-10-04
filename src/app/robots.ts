import type { MetadataRoute } from "next";

const privatePaths = [
  "/api/",
  "/admin/",
  "/employer/",
  "/candidate/",
  "/dashboard/",
  "/settings/",
  "/onboarding/",
  "/profile/",
  "/applications/",
  "/billing/",
  "/messages/",
  "/payment/",
  "/checkout/",
  "/login",
  "/register",
  "/signin",
  "/signup",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "Google-Extended"],
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: "https://www.hiregoai.com/sitemap.xml",
    host: "https://www.hiregoai.com",
  };
}
