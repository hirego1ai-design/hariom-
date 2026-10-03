import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/ai-features",
  title: "AI Hiring Features for Employers | HireGo AI",
  description: "Explore HireGo AI features for candidate screening, assessments, interview coordination, video resumes and hiring workflows with human decision control.",
});

export default function AIFeaturesPage() {
  return <MarketingPage kind="ai-features" />;
}
