import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/certifications",
  title: "Skills Assessments & Candidate Evidence | HireGo AI",
  description: "Use structured practice and assessments to build candidate skill evidence on HireGo AI. Employers review the evidence and make hiring decisions.",
});

export default function CertificationsPage() {
  return <MarketingPage kind="certifications" />;
}
