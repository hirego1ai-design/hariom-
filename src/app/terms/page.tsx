import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("terms");

export default function TermsPage() {
  return <MarketingPage kind="terms" />;
}
