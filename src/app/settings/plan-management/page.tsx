"use client";

import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export default function PlanManagementPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <main className="min-h-screen p-gutter max-w-container-max mx-auto w-full">
        <section className="max-w-3xl rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <h1 className="text-2xl font-bold text-white">Plan & Pricing Management</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Subscription plans are managed by the authoritative Admin Subscriptions service. This legacy local plan editor no longer maintains duplicate browser-only plan data.
          </p>
          <Link href="/admin/subscriptions" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">
            Open authoritative subscription manager
          </Link>
        </section>
      </main>
    </div>
  );
}
