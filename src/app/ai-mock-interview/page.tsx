import type { Metadata } from "next";
import RevenueLandingPage from "@/components/marketing/RevenueLandingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { REVENUE_SEO_PAGES } from "@/lib/revenueSeo";

const page = REVENUE_SEO_PAGES["ai-mock-interview"];

export const metadata: Metadata = marketingMetadata({
  path: "/ai-mock-interview",
  title: page.metadataTitle,
  description: page.description
});

export default function Page() {
  return <RevenueLandingPage page={page} />;
}
