import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("features");

const featureSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "HireGo AI Platform Features",
  url: "https://www.hiregoai.com/features",
  description: "Explore HireGo AI's Agentic Hiring Operating System for sourcing, screening, assessments, interviews, candidate intelligence, communication and managed hiring workflows.",
  isPartOf: {
    "@type": "WebSite",
    name: "HireGo AI",
    url: "https://www.hiregoai.com",
  },
  about: {
    "@type": "SoftwareApplication",
    name: "HireGo AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(featureSchema) }} />
      <MarketingPage kind="features" />
    </>
  );
}
