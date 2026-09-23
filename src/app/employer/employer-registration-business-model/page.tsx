"use client";

import { useRouter } from "next/navigation";

export default function EmployerRegistrationBusinessModelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Commercial model</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Choose how you want to hire</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-secondary">
            Select a workflow. Current subscription pricing, quotas, trials, managed-hiring fees, taxes, and commercial terms are loaded from authoritative server records later in the relevant flow and are not hardcoded on this screen.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
            <h2 className="text-xl font-bold text-white">Managed Hiring</h2>
            <p className="mt-3 text-sm text-text-secondary">
              Submit a hiring requirement for HireGo’s managed workflow. Commercial terms are defined in the generated agreement and become authoritative only after review/signature.
            </p>
            <button
              type="button"
              onClick={() => router.push("/employer/employer-registration-document-verification?model=managed")}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              Continue with Managed Hiring
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
            <h2 className="text-xl font-bold text-white">Subscription</h2>
            <p className="mt-3 text-sm text-text-secondary">
              Choose from subscription plans stored by the HireGo subscription service. The next step loads the current plans and quotas from the backend.
            </p>
            <button
              type="button"
              onClick={() => router.push("/employer/employer-registration-plan-selection?model=subscription")}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              View Current Plans
            </button>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          No certification, payment-security, pricing, trial, or service-level claim is inferred by this selection screen.
        </p>
      </main>
    </div>
  );
}
