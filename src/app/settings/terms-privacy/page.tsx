"use client";

import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export default function TermsPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <main className="min-h-screen p-gutter max-w-container-max mx-auto w-full">
        <section className="max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h1 className="text-2xl font-bold text-white">Terms & Privacy Administration</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Legal-document publishing is disabled here because no versioned, audited legal-content persistence API is connected.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            The previous local textarea and simulated “published successfully” action have been removed. Published legal content must come from a versioned source with audit history and controlled release.
          </p>
        </section>
      </main>
    </div>
  );
}
