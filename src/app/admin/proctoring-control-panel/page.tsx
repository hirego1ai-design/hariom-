"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Policy = {
  enabled: boolean;
  events: {
    TAB_SWITCH: boolean;
    BROWSER_UNFOCUSED: boolean;
    COPY_PASTE_DETECTED: boolean;
    SCREEN_SHARE_STOPPED: boolean;
  };
};

const labels: Record<keyof Policy["events"], string> = {
  TAB_SWITCH: "Tab switch / hidden tab",
  BROWSER_UNFOCUSED: "Browser loses focus",
  COPY_PASTE_DETECTED: "Copy / paste attempt",
  SCREEN_SHARE_STOPPED: "Active screen share stopped",
};

export default function AdminProctoringControlPanelPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/admin/proctoring/config", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Unable to load proctoring policy.");
        setPolicy(body.policy);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load proctoring policy."));
  }, []);

  const save = async () => {
    if (!policy || saving) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/admin/proctoring/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy, reason: "Updated from admin proctoring control panel." }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to save proctoring policy.");
      setPolicy(body.policy);
      setSaved("Policy saved and now enforced by live telemetry ingestion.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save proctoring policy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Proctoring Control Panel" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1000px] w-full mx-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Live interview proctoring</h1>
            <p className="text-text-muted text-sm mt-2">
              These settings control server acceptance of candidate browser-integrity events. They do not enable face recognition or audio-anomaly detection.
            </p>
          </div>

          {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
          {saved && <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">{saved}</div>}

          {!policy ? (
            <div className="glass-card rounded-2xl border border-white/10 p-6 text-sm text-text-muted">Loading policy…</div>
          ) : (
            <section className="glass-card rounded-3xl border border-white/10 p-6 space-y-5">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-bold text-sm">Enable live browser-integrity telemetry</p>
                  <p className="text-xs text-text-muted mt-1">When disabled, candidate telemetry is acknowledged but not stored.</p>
                </div>
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(event) => setPolicy({ ...policy, enabled: event.target.checked })}
                  className="h-5 w-5"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(policy.events) as Array<keyof Policy["events"]>).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-sm">{labels[key]}</span>
                    <input
                      type="checkbox"
                      disabled={!policy.enabled}
                      checked={policy.events[key]}
                      onChange={(event) => setPolicy({
                        ...policy,
                        events: { ...policy.events, [key]: event.target.checked },
                      })}
                      className="h-5 w-5"
                    />
                  </label>
                ))}
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-text-muted leading-relaxed">
                Supported evidence is client-reported and unverified. It is for human review only and must not automatically select, reject, suspend, or accuse a candidate.
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-full bg-primary px-7 py-3 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save enforced policy"}
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
