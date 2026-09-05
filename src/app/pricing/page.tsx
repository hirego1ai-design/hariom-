import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("pricing");

export default function PricingPage() {
  return <MarketingPage kind="pricing" />;
}
