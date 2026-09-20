import type { Metadata } from "next";

const titles: Record<string, string> = {
  home: "HireGo AI — Autonomous Hiring, Made Human",
  features: "HireGo AI Platform Features",
  pricing: "HireGo AI Pricing",
  enterprise: "HireGo AI for Employers",
  about: "About HireGo AI",
  company: "Company — HireGo AI",
  careers: "Careers at HireGo AI",
  blog: "HireGo AI Insights",
  contact: "Contact HireGo AI",
  terms: "Terms of Service — HireGo AI",
  privacy: "Privacy — HireGo AI",
};

const paths: Record<string, string> = {
  home: "/", features: "/features", pricing: "/pricing", enterprise: "/enterprise",
  about: "/about", company: "/company", careers: "/careers", blog: "/blog",
  contact: "/contact", terms: "/terms", privacy: "/privacy",
};

export function marketingMetadata({ path, title, description, image = "/marketing/og/home.webp" }: { path: string; title: string; description: string; image?: string }): Metadata {
  const url = `https://hiregoai.com${path === "/" ? "" : path}`;
  return {
    title, description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: "website", siteName: "HireGo AI", title, description, url, images: [{ url: image, width: 1200, height: 630, alt: `${title} — HireGo AI` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function createMarketingMetadata(kind: string): Metadata {
  const title = titles[kind] ?? "HireGo AI";
  const description = "HireGo AI connects candidate sourcing, screening, assessments and interviews in one hiring workflow, with people in control of hiring decisions.";
  return marketingMetadata({ title, description, path: paths[kind] ?? "/" });
}
