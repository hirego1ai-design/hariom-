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

export function createMarketingMetadata(kind: string): Metadata {
  const title = titles[kind] ?? "HireGo AI";
  const description = "HireGo AI helps candidates become job-ready and helps employers hire with confidence.";
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}
