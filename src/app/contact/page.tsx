import { Suspense } from "react";
import MarketingShell from "@/components/marketing/MarketingShell";
import ContactFormView from "@/components/marketing/ContactFormView";
import { createMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata = createMarketingMetadata("contact");

export default function ContactPage() {
  return (
    <MarketingShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-[#01050b]" />}>
        <ContactFormView />
      </Suspense>
    </MarketingShell>
  );
}
