import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/find-jobs",
  title: "Find Jobs | Explore Opportunities on HireGo AI",
  description: "Explore available jobs on HireGo AI, build your candidate profile, prepare for interviews and apply to relevant opportunities with useful context.",
});

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Find Jobs on HireGo AI",
  url: "https://www.hiregoai.com/find-jobs",
  description: "Explore available jobs on HireGo AI and connect job discovery with candidate preparation, profiles and applications.",
  isPartOf: { "@type": "WebSite", name: "HireGo AI", url: "https://www.hiregoai.com" },
};

export default function FindJobsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <MarketingPage kind="find-jobs" />
    </>
  );
}
