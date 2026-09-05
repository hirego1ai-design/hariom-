import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("contact");

export default function ContactPage() {
  return <MarketingPage kind="contact" />;
}
