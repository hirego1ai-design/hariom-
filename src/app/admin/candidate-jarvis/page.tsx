"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Config = {
  enabled: boolean;
  voiceEnabled: boolean;
  hybridRoutingEnabled: boolean;
  smartTaskType: string;
  qualityTaskType: string;
  maxInputChars: number;
  maxApplicationsContext: number;
  maxInterviewsContext: number;
  maxJobsContext: number;
  deepReasoningKeywords: string[];
};

export default function CandidateJarvisAdminPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/admin/candidate-jarvis", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load Candidate Jarvis configuration.");
      setConfig(payload.config);
      setUpdatedAt(payload.updatedAt ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load Candidate Jarvis configuration.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!config || saving || reason.trim().length < 3) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/candidate-jarvis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          reason: reason.trim(),
          expectedUpdatedAt: updatedAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to save Candidate Jarvis configuration.");
      setConfig(payload.config);
      setUpdatedAt(payload.updatedAt ?? null);
      setReason("");
      setNotice("Candidate Jarvis configuration saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save Candidate Jarvis configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Candidate Jarvis" />
        <main className="flex-1 p-gutter pt-24 pb-12 max-w-[1300px] w-full mx-auto space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Hybrid runtime control</p>
              <h1 className="mt-1 text-3xl font-extrabold text-white">Candidate Jarvis</h1>
              <p className="mt-2 max-w-3xl text-sm text-text-muted">
                FAST commands bypass LLMs. SMART and DEEP requests use the task routes configured in the AI Model Registry. Voice stays independently feature-flagged for the self-hosted HireGo Voice Engine.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/models/registry" className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-black">
                Model routing
              </Link>
              <Link href="/admin/ai-command-centre-dashboard" className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white">
                AI Control Centre
              </Link>
            </div>
          </header>

          {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
          {notice && <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</div>}

          {!config ? (
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading authoritative Jarvis configuration…</div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <label className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="font-bold text-white">Candidate Jarvis</p><p className="mt-1 text-xs text-text-muted">Master runtime switch.</p></div>
                    <input type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ ...config, enabled: event.target.checked })} />
                  </div>
                </label>
                <label className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="font-bold text-white">Hybrid routing</p><p className="mt-1 text-xs text-text-muted">Direct actions first, LLM only when needed.</p></div>
                    <input type="checkbox" checked={config.hybridRoutingEnabled} onChange={(event) => setConfig({ ...config, hybridRoutingEnabled: event.target.checked })} />
                  </div>
                </label>
                <label className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="font-bold text-white">Voice</p><p className="mt-1 text-xs text-text-muted">Keep OFF until self-hosted Voice Engine E2E is verified.</p></div>
                    <input type="checkbox" checked={config.voiceEnabled} onChange={(event) => setConfig({ ...config, voiceEnabled: event.target.checked })} />
                  </div>
                </label>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-6 space-y-5">
                <div><h2 className="text-lg font-bold text-white">Hybrid model task routes</h2><p className="mt-1 text-xs text-text-muted">The exact models and fallbacks are managed in AI Model Registry; Jarvis references task names only.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-text-muted">SMART task type
                    <input value={config.smartTaskType} onChange={(event) => setConfig({ ...config, smartTaskType: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                  <label className="text-xs text-text-muted">DEEP task type
                    <input value={config.qualityTaskType} onChange={(event) => setConfig({ ...config, qualityTaskType: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-6 space-y-5">
                <div><h2 className="text-lg font-bold text-white">Context & cost limits</h2><p className="mt-1 text-xs text-text-muted">These caps bound the context Jarvis may load into reasoning requests.</p></div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs text-text-muted">Max input chars
                    <input type="number" min={100} max={4000} value={config.maxInputChars} onChange={(event) => setConfig({ ...config, maxInputChars: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                  <label className="text-xs text-text-muted">Application context
                    <input type="number" min={1} max={25} value={config.maxApplicationsContext} onChange={(event) => setConfig({ ...config, maxApplicationsContext: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                  <label className="text-xs text-text-muted">Interview context
                    <input type="number" min={1} max={20} value={config.maxInterviewsContext} onChange={(event) => setConfig({ ...config, maxInterviewsContext: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                  <label className="text-xs text-text-muted">Job context
                    <input type="number" min={1} max={20} value={config.maxJobsContext} onChange={(event) => setConfig({ ...config, maxJobsContext: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-6 space-y-4">
                <div><h2 className="text-lg font-bold text-white">DEEP escalation keywords</h2><p className="mt-1 text-xs text-text-muted">Matching requests use the quality task route instead of the cheap SMART route.</p></div>
                <textarea
                  rows={5}
                  value={config.deepReasoningKeywords.join("\n")}
                  onChange={(event) => setConfig({
                    ...config,
                    deepReasoningKeywords: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean),
                  })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
                />
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
                <label className="text-xs text-text-muted">Change reason
                  <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white" placeholder="Why are you changing Jarvis runtime settings?" />
                </label>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => void save()} disabled={saving || reason.trim().length < 3} className="rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white disabled:opacity-40">
                    {saving ? "Saving…" : "Save Jarvis configuration"}
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
