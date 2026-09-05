import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("careers");

export default function CareersPage() {
  return <MarketingPage kind="careers" />;
}
