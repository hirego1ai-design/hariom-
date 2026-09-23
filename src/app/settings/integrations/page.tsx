"use client";

import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export default function ApiIntegrationsHubPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <main className="min-h-screen p-gutter max-w-container-max mx-auto w-full">
        <section className="max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h1 className="text-2xl font-bold text-white">API & Integrations</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Third-party integration connection state is not displayed because no authoritative integrations registry API is connected.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            The previous hardcoded Greenhouse, Lever, Slack, Google Calendar, and Zoom connection states and browser-only Connect/Disconnect controls have been removed.
          </p>
        </section>
      </main>
    </div>
  );
}
