"use client";

import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

const modules = [
  {
    title: "Assigned Assessments",
    description:
      "Open active job-specific assessments assigned through your applications. Question ownership, timing, answer keys, and scoring are enforced on the server.",
    href: "/assessment/mcq",
    action: "View assigned assessments",
    icon: "fact_check",
  },
  {
    title: "Job-Ready Skill Validation",
    description:
      "Review your current role-based validation status and start or continue an assessment backed by HireGo's persisted readiness record.",
    href: "/assessment/readiness",
    action: "View Skill Validation",
    icon: "verified",
  },
  {
    title: "Typing Practice",
    description:
      "Practice against an active server-configured prompt. Typing results are clearly labeled as self-reported practice and are not a verified hiring assessment.",
    href: "/assessment/typing/active",
    action: "Start typing practice",
    icon: "keyboard",
  },
];

export default function PracticeHubPage() {
  return (
    <div className="min-h-screen flex bg-bg-page text-text-primary">
      <CandidateSidebar />

      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 min-h-20 backdrop-blur-xl border-b border-outline bg-bg-page/95 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Candidate practice</p>
            <h1 className="mt-1 text-2xl font-bold">Practice Hub</h1>
            <p className="mt-1 text-xs text-text-muted">
              Only production-connected practice and assessment tools are shown here.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="min-h-11 inline-flex items-center justify-center rounded-full border border-outline bg-surface-container-high px-5 text-xs font-bold"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
          <section className="rounded-3xl border border-outline bg-bg-card p-6 sm:p-8">
            <h2 className="text-xl font-bold">Choose a practice activity</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              HireGo keeps practice separate from hiring evidence. Where a score or assessment result is shown, the corresponding screen explains whether it is private practice or verified assessment evidence.
            </p>
          </section>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {modules.map((module) => (
              <article
                key={module.href}
                className="rounded-3xl border border-outline bg-bg-card p-6 flex flex-col justify-between gap-6 shadow-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">{module.icon}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-bold">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{module.description}</p>
                </div>
                <Link
                  href={module.href}
                  className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary px-5 text-xs font-bold text-white"
                >
                  {module.action} →
                </Link>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
