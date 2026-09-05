import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("privacy");

export default function PrivacyPage() {
  return <MarketingPage kind="privacy" />;
}
