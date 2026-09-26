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
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/proctoring-policy", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Unable to load proctoring policy.");
        setPolicy(body.policy);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load proctoring policy."));
  }, []);

  async function save() {
    if (!policy) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/proctoring-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to save proctoring policy.");
      setPolicy(body.policy);
      setMessage("Live interview proctoring policy saved and will be enforced for new room entries.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save proctoring policy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Proctoring Control Panel" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1000px] w-full mx-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Live Interview Proctoring</h1>
            <p className="text-text-muted text-sm">Only configured browser observations are enabled. They are advisory evidence and never an automatic hiring decision.</p>
          </div>

          {!policy ? (
            <div className="glass-card p-6 rounded-2xl border border-white/10">{message || "Loading policy…"}</div>
          ) : (
            <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
              <label className="flex items-center justify-between gap-4">
                <span><strong className="block text-white">Enable live interview browser monitoring</strong><span className="text-xs text-text-muted">Candidate disclosure and consent are required before monitored room entry.</span></span>
                <input type="checkbox" checked={policy.enabled} onChange={(event) => setPolicy({ ...policy, enabled: event.target.checked })} />
              </label>
              <label className="flex items-center justify-between gap-4"><span>Track tab visibility changes</span><input type="checkbox" checked={policy.trackTabSwitch} onChange={(event) => setPolicy({ ...policy, trackTabSwitch: event.target.checked })} /></label>
              <label className="flex items-center justify-between gap-4"><span>Block and record copy/paste attempts</span><input type="checkbox" checked={policy.trackClipboard} onChange={(event) => setPolicy({ ...policy, trackClipboard: event.target.checked })} /></label>
              <label className="flex items-center justify-between gap-4"><span>Block and record context-menu attempts</span><input type="checkbox" checked={policy.trackContextMenu} onChange={(event) => setPolicy({ ...policy, trackContextMenu: event.target.checked })} /></label>
              <label className="block text-sm">Policy version<input className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" value={policy.policyVersion} onChange={(event) => setPolicy({ ...policy, policyVersion: event.target.value })} /></label>
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">
                Face detection, multiple-face detection and audio anomaly detection are not enabled by this browser policy and must not be represented as active.
              </div>
              <button disabled={saving} onClick={() => void save()} className="rounded-full bg-primary px-6 py-3 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save policy"}</button>
              {message && <p role="status" className="text-sm text-text-muted">{message}</p>}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
