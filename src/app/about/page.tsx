import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("about");

export default function AboutPage() {
  return <MarketingPage kind="about" />;
}
