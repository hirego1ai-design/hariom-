import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("features");

export default function FeaturesPage() {
  return <MarketingPage kind="features" />;
}
