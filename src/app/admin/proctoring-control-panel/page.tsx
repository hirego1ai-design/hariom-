"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Policy = {
  enabled: boolean;
  trackTabSwitch: boolean;
  trackClipboard: boolean;
  trackContextMenu: boolean;
  policyVersion: string;
};

export default function AdminProctoringControlPanelPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [configured, setConfigured] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/proctoring-policy", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success || !body.policy) {
        throw new Error(body.error || "Unable to load proctoring policy.");
      }
      setPolicy(body.policy);
      setConfigured(Boolean(body.configured));
    } catch (error) {
      setPolicy(null);
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to load proctoring policy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!policy || saving) return;
    if (reason.trim().length < 3) {
      setMessageType("error");
      setMessage("Enter a change reason before saving the proctoring policy.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/proctoring-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: policy.enabled,
          trackTabSwitch: policy.trackTabSwitch,
          trackClipboard: policy.trackClipboard,
          trackContextMenu: policy.trackContextMenu,
          expectedPolicyVersion: policy.policyVersion,
          reason: reason.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success || !body.policy) {
        throw new Error(body.error || "Unable to save proctoring policy.");
      }

      setPolicy(body.policy);
      setConfigured(true);
      setReason("");
      setMessageType("success");
      setMessage(body.message || "Live interview proctoring policy saved and audited.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to save proctoring policy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0E0E0E] text-text-primary">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[116px]">
        <AdminHeader
          title="Proctoring Control Panel"
          subtitle="Versioned live-interview browser monitoring policy"
        />
        <main className="mx-auto w-full max-w-[1000px] flex-1 space-y-6 p-4 pt-24 pb-12 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Live Interview Proctoring</h1>
            <p className="text-sm text-text-muted">
              Only configured browser observations are enabled. They are advisory evidence and never an automatic hiring decision.
            </p>
          </div>

          {message && (
            <div
              role={messageType === "error" ? "alert" : "status"}
              aria-live={messageType === "error" ? "assertive" : "polite"}
              className={`rounded-xl border p-4 text-sm ${
                messageType === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message}
            </div>
          )}

          {loading ? (
            <div role="status" aria-live="polite" className="glass-card rounded-2xl border border-white/10 p-6">
              Loading policy…
            </div>
          ) : !policy ? (
            <div className="glass-card rounded-2xl border border-white/10 p-6 text-sm text-text-muted">
              Proctoring policy is unavailable. No local fallback can be edited or saved.
              <button type="button" onClick={() => void load()} className="mt-4 block rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white">
                Retry
              </button>
            </div>
          ) : (
            <section className="glass-card space-y-5 rounded-2xl border border-white/10 p-6">
              {!configured && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">
                  No persisted policy exists yet. The fail-closed runtime default is shown; save deliberately to configure it.
                </div>
              )}

              <label className="flex items-center justify-between gap-4">
                <span>
                  <strong className="block text-white">Enable live interview browser monitoring</strong>
                  <span className="text-xs text-text-muted">Candidate disclosure and consent are required before monitored room entry.</span>
                </span>
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(event) => setPolicy({ ...policy, enabled: event.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between gap-4">
                <span>Track tab visibility changes</span>
                <input
                  type="checkbox"
                  checked={policy.trackTabSwitch}
                  onChange={(event) => setPolicy({ ...policy, trackTabSwitch: event.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between gap-4">
                <span>Block and record copy/paste attempts</span>
                <input
                  type="checkbox"
                  checked={policy.trackClipboard}
                  onChange={(event) => setPolicy({ ...policy, trackClipboard: event.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between gap-4">
                <span>Block and record context-menu attempts</span>
                <input
                  type="checkbox"
                  checked={policy.trackContextMenu}
                  onChange={(event) => setPolicy({ ...policy, trackContextMenu: event.target.checked })}
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-text-muted">
                <span className="font-bold text-white">Current policy version:</span>{" "}
                <code>{policy.policyVersion}</code>
              </div>

              <label className="block text-sm text-text-secondary">
                Change reason
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Why are you changing the live-interview monitoring policy?"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white outline-none focus:border-primary/50"
                />
              </label>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">
                Face detection, multiple-face detection and audio anomaly detection are not enabled by this browser policy and must not be represented as active.
              </div>

              <button
                type="button"
                disabled={saving || reason.trim().length < 3}
                onClick={() => void save()}
                className="rounded-full bg-primary px-6 py-3 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save audited policy"}
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
