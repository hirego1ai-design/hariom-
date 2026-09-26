"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Policy = {
  passingPercentage: number;
  validityDays: number;
  retakeCooldownHours: number;
};

export default function AdminJobSpecificAssessmentPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [configured, setConfigured] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/job-specific-assessment-policy", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load job-specific assessment policy.");
      setConfigured(Boolean(data.configured));
      setPolicy(data.policy ?? {
        passingPercentage: 70,
        validityDays: 180,
        retakeCooldownHours: 24,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load job-specific assessment policy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!policy || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/job-specific-assessment-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy, reason: reason.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not save job-specific assessment policy.");
      setPolicy(data.policy);
      setConfigured(true);
      setReason("");
      setNotice("Job-specific assessment policy saved and audited.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save job-specific assessment policy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Job-Specific Assessment" />
        <main className="flex-1 p-gutter pt-24 pb-12 max-w-[1100px] w-full mx-auto space-y-8">
          <header className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Assessment governance</p>
            <h1 className="text-3xl font-extrabold text-white">Job-Specific Assessment Policy</h1>
            <p className="max-w-3xl text-sm text-text-muted">
              Employers only choose Yes or No when creating a job. HireGo controls question count, generation, scoring policy and runtime validation. A required assessment is generated before the job can be published.
            </p>
          </header>

          {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
          {notice && <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">{notice}</div>}
          {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading policy…</div>}

          {!loading && policy && (
            <>
              {!configured && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
                  This policy is not configured yet. Jobs that require an additional assessment stay as drafts until a valid policy is saved.
                </div>
              )}

              <section className="rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-xs text-text-muted">
                    Passing percentage
                    <input type="number" min={0} max={100} value={policy.passingPercentage}
                      onChange={(event) => setPolicy({ ...policy, passingPercentage: Number(event.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                  <label className="text-xs text-text-muted">
                    Result validity (days)
                    <input type="number" min={1} max={3650} value={policy.validityDays}
                      onChange={(event) => setPolicy({ ...policy, validityDays: Number(event.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                  <label className="text-xs text-text-muted">
                    Retake cooldown (hours)
                    <input type="number" min={0} max={8760} value={policy.retakeCooldownHours}
                      onChange={(event) => setPolicy({ ...policy, retakeCooldownHours: Number(event.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-5 text-sm text-text-secondary space-y-2">
                  <p><strong className="text-white">Question count:</strong> automatically selected from HireGo role policy.</p>
                  <p><strong className="text-white">Authoring:</strong> generated by the configured Assessment Authoring model route and validated server-side.</p>
                  <p><strong className="text-white">Evidence:</strong> job-specific results remain scoped to the application and do not overwrite Universal Skill Validation evidence.</p>
                  <p><strong className="text-white">Entitlement:</strong> generation remains protected by the JOB_SPECIFIC_ASSESSMENT subscription feature.</p>
                </div>

                <label className="block text-xs text-text-muted">
                  Change reason (optional)
                  <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                    placeholder="Why are you changing this policy?" />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => void save()} disabled={saving}
                    className="rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-black disabled:opacity-50">
                    {saving ? "Saving…" : "Save policy"}
                  </button>
                  <Link href="/admin/models/registry" className="rounded-xl border border-white/15 px-5 py-3 text-xs font-bold text-white">
                    Configure authoring models
                  </Link>
                  <Link href="/admin/assessment/skill-validation" className="rounded-xl border border-white/15 px-5 py-3 text-xs font-bold text-white">
                    Universal Skill Validation
                  </Link>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
