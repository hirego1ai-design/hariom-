"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Policy = {
  passingPercentage: number;
  validityDays: number;
  retakeCooldownHours: number;
  feedbackEnabled: boolean;
  mockInterviewRecommendationEnabled: boolean;
};

type Template = {
  id: string;
  title: string;
  roleTitle: string | null;
  isActive: boolean;
  productionValid: boolean;
  validationReasons: string[];
  questionCount: number;
  updatedAt: string;
  _count: { attempts: number };
};

export default function AdminSkillValidationPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
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
      const response = await fetch("/api/admin/skill-validation-policy", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load Skill Validation policy.");
      setConfigured(Boolean(data.configured));
      setPolicy(data.policy ?? {
        passingPercentage: 70,
        validityDays: 180,
        retakeCooldownHours: 24,
        feedbackEnabled: true,
        mockInterviewRecommendationEnabled: true,
      });
      setTemplates(data.templates ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Skill Validation policy.");
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
      const response = await fetch("/api/admin/skill-validation-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy, reason: reason.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not save Skill Validation policy.");
      setPolicy(data.policy);
      setConfigured(true);
      setReason("");
      setNotice("Skill Validation policy saved and audited.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save Skill Validation policy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Universal Skill Validation" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-8 max-w-[1400px] w-full mx-auto">
          <header className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Assessment governance</p>
            <h1 className="text-3xl font-extrabold text-white">Universal Skill Validation</h1>
            <p className="max-w-4xl text-sm text-text-muted">
              Control the server-authoritative validation policy. Question counts and per-skill evidence remain enforced by the centralized role policy. AI only authors compliant content; it never controls raw scoring or evidence thresholds.
            </p>
          </header>

          {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
          {notice && <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">{notice}</div>}
          {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading policy…</div>}

          {!loading && policy && (
            <>
              {!configured && (
                <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
                  Production policy is not configured yet. Auto-authoring fails closed until you save these settings.
                </section>
              )}

              <section className="rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Validation policy</h2>
                    <p className="mt-1 text-xs text-text-muted">Changes are applied to newly created universal assessments. Historical attempts remain immutable.</p>
                  </div>
                  <Link href="/admin/models/registry" className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/5">
                    Configure authoring/feedback models
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-xs text-text-muted">
                    Passing percentage
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={policy.passingPercentage}
                      onChange={(event) => setPolicy({ ...policy, passingPercentage: Number(event.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                    />
                  </label>
                  <label className="text-xs text-text-muted">
                    Evidence validity (days)
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={policy.validityDays}
                      onChange={(event) => setPolicy({ ...policy, validityDays: Number(event.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                    />
                  </label>
                  <label className="text-xs text-text-muted">
                    Retake cooldown (hours)
                    <input
                      type="number"
                      min={0}
                      max={8760}
                      value={policy.retakeCooldownHours}
                      onChange={(event) => setPolicy({ ...policy, retakeCooldownHours: Number(event.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                    />
                  </label>
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/15 p-4">
                    <label className="flex items-center gap-3 text-xs font-semibold text-text-secondary">
                      <input
                        type="checkbox"
                        checked={policy.feedbackEnabled}
                        onChange={(event) => setPolicy({ ...policy, feedbackEnabled: event.target.checked })}
                      />
                      Private feedback enabled
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-text-secondary">
                      <input
                        type="checkbox"
                        checked={policy.mockInterviewRecommendationEnabled}
                        onChange={(event) => setPolicy({ ...policy, mockInterviewRecommendationEnabled: event.target.checked })}
                      />
                      Recommend Mock Interview
                    </label>
                  </div>
                </div>

                <label className="block text-xs text-text-muted">
                  Change reason (optional)
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={500}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                    placeholder="Why are you changing this policy?"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-black disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save policy"}
                </button>
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Universal assessment versions</h2>
                  <p className="mt-1 text-xs text-text-muted">Only active templates that pass the current runtime policy can be assigned to candidates.</p>
                </div>

                {templates.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">
                    No universal assessment has been generated yet. A valid role mapping plus configured authoring model is required before the first on-demand assessment can be created.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {templates.map((template) => (
                      <article key={template.id} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-primary">{template.roleTitle || "Role missing"}</p>
                            <h3 className="mt-1 font-bold text-white">{template.title}</h3>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${template.productionValid ? "border-green-500/30 text-green-300" : "border-red-500/30 text-red-300"}`}>
                            {template.productionValid ? "PRODUCTION VALID" : "NOT VALID"}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                          <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-text-muted">Questions</p><p className="mt-1 font-bold text-white">{template.questionCount}</p></div>
                          <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-text-muted">Attempts</p><p className="mt-1 font-bold text-white">{template._count.attempts}</p></div>
                          <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-text-muted">Active</p><p className="mt-1 font-bold text-white">{template.isActive ? "Yes" : "No"}</p></div>
                        </div>
                        {template.validationReasons.length > 0 && (
                          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
                            {template.validationReasons.join(" ")}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
