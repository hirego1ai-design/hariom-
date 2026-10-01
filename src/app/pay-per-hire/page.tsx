import type { Metadata } from "next";
import RevenueLandingPage from "@/components/marketing/RevenueLandingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { REVENUE_SEO_PAGES } from "@/lib/revenueSeo";

const page = REVENUE_SEO_PAGES["pay-per-hire"];

export const metadata: Metadata = marketingMetadata({
  path: "/pay-per-hire",
  title: page.metadataTitle,
  description: page.description
});

export default function Page() {
  return <RevenueLandingPage page={page} />;
}
