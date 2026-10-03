import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/post-job-public",
  title: "Post a Job in India | HireGo AI",
  description: "Create a clear employer job post in India with HireGo AI and manage screening, assessments and interview workflow while people make hiring decisions.",
});

export default function PublicJobPage() {
  return <MarketingPage kind="post-job-public" />;
}
