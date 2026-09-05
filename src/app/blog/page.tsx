import MarketingPage from "@/components/marketing/MarketingPage";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("blog");

export default function BlogPage() {
  return <MarketingPage kind="blog" />;
}
