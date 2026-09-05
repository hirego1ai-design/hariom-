import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("enterprise");

export default function EnterprisePage() {
  return <MarketingPage kind="enterprise" />;
}
