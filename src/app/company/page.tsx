import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("company");

export default function CompanyPage() {
  return <MarketingPage kind="company" />;
}
