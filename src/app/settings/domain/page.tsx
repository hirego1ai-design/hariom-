"use client";

import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export default function DomainSslSettingsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <main className="min-h-screen p-gutter max-w-container-max mx-auto w-full">
        <section className="max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h1 className="text-2xl font-bold text-white">Domain & SSL Settings</h1>
          <p className="mt-3 text-sm text-text-secondary">
            No authoritative domain-management or certificate-status API is connected to this application screen.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Hardcoded domain names, certificate state, renewal dates, and simulated bind/save actions have been removed. Manage DNS and TLS through the deployment/provider control plane until an audited API is available.
          </p>
        </section>
      </main>
    </div>
  );
}
