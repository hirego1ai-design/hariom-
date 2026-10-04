import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/publicDiscovery";

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

const descriptions: Record<string, string> = {
  features: "Explore HireGo AI hiring features for sourcing, screening, assessments, interviews and workflow coordination, with people making hiring decisions.",
  enterprise: "Explore HireGo AI workflows for employers that need structured screening, interview coordination and hiring operations with human decision control.",
  company: "Learn how HireGo AI approaches AI-assisted hiring, connected recruitment workflows and human-controlled hiring decisions from Noida, India.",
  careers: "Learn about careers and opportunities with HireGo AI, an AI-assisted hiring platform based in Noida, India.",
  contact: "Contact HireGo AI in Noida, India about Managed Hiring, Pay Per Hire, Employer Co-Pilot, candidate screening and hiring workflows.",
};

const paths: Record<string, string> = {
  home: "/", features: "/features", pricing: "/pricing", enterprise: "/enterprise",
  about: "/about", company: "/company", careers: "/careers", blog: "/blog",
  contact: "/contact", terms: "/terms", privacy: "/privacy",
};

export function marketingMetadata({
  path,
  title,
  description,
  image = "/marketing/og/home.webp",
}: {
  path: string;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  return buildPublicMetadata({ path, title, description, image });
}

export function createMarketingMetadata(kind: string): Metadata {
  const title = titles[kind] ?? "HireGo AI";
  const description = descriptions[kind] ?? "HireGo AI supports AI-assisted hiring workflows while people remain responsible for hiring decisions.";
  return marketingMetadata({ title, description, path: paths[kind] ?? "/" });
}
