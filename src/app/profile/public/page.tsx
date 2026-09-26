"use client";

import Link from "next/link";

export default function PublicCandidateProfileUnavailablePage() {
  return (
    <main className="min-h-screen bg-bg-page text-text-primary flex items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-3xl border border-outline bg-bg-card p-8 md:p-12 text-center shadow-2xl space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-yellow/10 border border-yellow/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-yellow text-3xl">shield_person</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Secure profile sharing is being completed</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            HireGo does not display sample identities, fixed scores, rankings, or placeholder interview actions on public candidate URLs.
            Candidate-specific sharing will appear here only when a real profile has been explicitly shared with a revocable access link.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard" className="px-6 py-3 rounded-full bg-primary text-white text-xs font-bold">
            Candidate dashboard
          </Link>
          <Link href="/jobs" className="px-6 py-3 rounded-full border border-outline bg-surface-container text-xs font-bold">
            Browse jobs
          </Link>
        </div>
      </section>
    </main>
  );
}
