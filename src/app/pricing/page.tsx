import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/pricing",
  title: "HireGo AI Pricing | Employer Plans, AI Co-Pilot & Managed Hiring",
  description: "Explore HireGo AI employer plans, AI Hiring Co-Pilot and Managed Hiring options. Employer plan pricing is loaded from the live Admin-managed subscription catalog.",
});

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "HireGo AI Pricing",
  url: "https://www.hiregoai.com/pricing",
  description: "Employer pricing options for HireGo AI employer plans, AI Hiring Co-Pilot and Managed Hiring.",
  isPartOf: { "@type": "WebSite", name: "HireGo AI", url: "https://www.hiregoai.com" },
};

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
      <MarketingPage kind="pricing" />
    </>
  );
}
