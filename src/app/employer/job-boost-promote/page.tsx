"use client";

import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

export default function JobBoostPromotePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Job Boost & Promotion"
        subtitle="Paid promotion is not enabled until payment settlement can be verified before activation."
      />
      <section className="mx-auto max-w-2xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">UNAVAILABLE</p>
        <h2 className="text-xl font-bold text-white">Verified payment fulfillment is required</h2>
        <p className="text-sm leading-6 text-text-secondary">
          HireGo will not activate a paid boost or record a payment as successful from a browser action.
          Job Boost will return only after Stripe/PayU payment orders and signed webhook settlement are connected to boost fulfillment.
        </p>
        <Link href="/employer/job-listings-management" className="inline-flex rounded-full border border-white/10 px-5 py-2.5 text-xs font-bold text-white">
          Back to job listings
        </Link>
      </section>
    </PageContainer>
  );
}
