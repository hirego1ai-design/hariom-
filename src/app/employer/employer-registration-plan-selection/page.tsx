"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  name: string;
  description?: string;
  price: number;
  validityMonths?: number;
  jobPostsQuota?: number;
  resumeUnlocksQuota?: number;
  aiInterviewsQuota?: number;
  isArchived?: boolean;
};

export default function EmployerPlanSelectionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employer/subscribe", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load subscription plans.");
        setPlans((payload.plans || []).filter((plan: Plan) => !plan.isArchived));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load subscription plans."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Current subscription catalog</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Review backend-configured plans</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-secondary">
            Prices and quotas below come from the subscription service. This onboarding step does not activate a plan or bypass payment; purchase and activation occur through the protected subscription checkout after onboarding.
          </p>
        </div>

        {loading && <div role="status" className="mt-8 rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading current plans…</div>}
        {error && <div role="alert" className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

        {!loading && !error && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">
                No active subscription plans are currently published.
              </div>
            ) : plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                <p className="mt-2 text-2xl font-extrabold text-white">₹{plan.price.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-xs text-text-muted">{plan.validityMonths || 1} month(s)</p>
                {plan.description && <p className="mt-3 text-xs leading-relaxed text-text-secondary">{plan.description}</p>}
                <dl className="mt-4 space-y-2 text-xs text-text-muted">
                  <div className="flex justify-between gap-3"><dt>Job posts</dt><dd>{plan.jobPostsQuota ?? 0}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Resume unlocks</dt><dd>{plan.resumeUnlocksQuota ?? 0}</dd></div>
                  <div className="flex justify-between gap-3"><dt>AI interviews</dt><dd>{plan.aiInterviewsQuota ?? 0}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/employer/employer-registration-document-verification?model=subscription")}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
          >
            Continue to Verification
          </button>
        </div>
      </main>
    </div>
  );
}
