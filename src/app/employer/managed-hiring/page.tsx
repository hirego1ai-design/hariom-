"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Requirement = {
  id: string;
  referenceCode?: string;
  status: string;
  jobTitles?: string[];
  numberOfPositions?: number;
  location?: string;
};

type Agreement = {
  id: string;
  agreementNumber?: string;
  status: string;
  feeValue?: number;
  replacementDays?: number;
};

export default function EmployerManagedHiringDashboard() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/agreements/requirements", { cache: "no-store", signal: controller.signal }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load managed-hiring requirements.");
        return payload.requirements || [];
      }),
      fetch("/api/agreements/contracts", { cache: "no-store", signal: controller.signal }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load managed-hiring agreements.");
        return payload.agreements || [];
      }),
    ])
      .then(([requirementRows, agreementRows]) => {
        setRequirements(requirementRows);
        setAgreements(agreementRows);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Unable to load managed hiring.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Managed Hiring"
        subtitle="Authoritative hiring requirements and agreements only. Candidate sourcing and interview actions are shown in their persisted workflow screens."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/employer/managed-hiring/request" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">New requirement</Link>
        <Link href="/employer/managed-hiring/candidate-tracking" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white">Candidate tracking</Link>
      </div>

      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading managed-hiring records…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Hiring Requirements</h2>
                <p className="mt-1 text-xs text-text-muted">Persisted company mandates.</p>
              </div>
              <span className="text-sm font-bold text-white">{requirements.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {requirements.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-text-muted">No managed-hiring requirements have been submitted.</p>
              ) : requirements.map((requirement) => (
                <article key={requirement.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-primary">{requirement.referenceCode || requirement.id}</p>
                      <h3 className="mt-1 font-bold text-white">{requirement.jobTitles?.join(" · ") || "Hiring requirement"}</h3>
                      <p className="mt-2 text-xs text-text-muted">
                        {requirement.numberOfPositions ?? "—"} position(s){requirement.location ? ` · ${requirement.location}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-text-secondary">{requirement.status.replaceAll("_", " ")}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Agreements</h2>
                <p className="mt-1 text-xs text-text-muted">Persisted commercial agreements for this company.</p>
              </div>
              <span className="text-sm font-bold text-white">{agreements.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {agreements.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-text-muted">No managed-hiring agreements are available yet.</p>
              ) : agreements.map((agreement) => (
                <article key={agreement.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-yellow">{agreement.agreementNumber || agreement.id}</p>
                      <p className="mt-2 text-xs text-text-muted">
                        Placement fee: {typeof agreement.feeValue === "number" ? `${agreement.feeValue}% of CTC` : "See agreement"}
                        {typeof agreement.replacementDays === "number" ? ` · Replacement: ${agreement.replacementDays} days` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-text-secondary">{agreement.status.replaceAll("_", " ")}</span>
                  </div>
                  {agreement.status === "SENT_TO_EMPLOYER" && (
                    <Link href={`/employer/managed-hiring/agreements/${encodeURIComponent(agreement.id)}`} className="mt-4 inline-flex text-xs font-bold text-primary hover:underline">
                      Review agreement
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#121215] p-5">
        <h2 className="text-sm font-bold text-white">Candidate sourcing and interviews</h2>
        <p className="mt-2 text-xs text-text-muted">
          This dashboard does not synthesize candidate pools, match scores, assessment results, or dispatched invitations. Use Candidate Tracking and Interview Scheduling for recorded workflow evidence and real actions.
        </p>
      </section>
    </PageContainer>
  );
}
