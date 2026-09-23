"use client";

import { useEffect, useState } from "react";

type ManagedHiringConfig = Record<string, unknown>;

export default function ManagedHiringSettingsPage() {
  const [config, setConfig] = useState<ManagedHiringConfig | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/admin/managed-hiring/config", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load managed-hiring configuration.");
        const stored = payload.config && typeof payload.config === "object" ? payload.config : null;
        setConfig(stored);
        setDraft(stored ? JSON.stringify(stored, null, 2) : "");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load managed-hiring configuration."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const parsed = JSON.parse(draft);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Configuration must be a JSON object.");
      const response = await fetch("/api/admin/managed-hiring/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: parsed, reason: "Managed hiring configuration updated from Admin Settings" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to save managed-hiring configuration.");
      setConfig(payload.config || parsed);
      setDraft(JSON.stringify(payload.config || parsed, null, 2));
      setNotice("Managed-hiring configuration saved to the authoritative database.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save managed-hiring configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 text-text-primary">
      <div>
        <h1 className="text-2xl font-bold text-white">Managed Hiring Configuration</h1>
        <p className="mt-2 text-sm text-text-muted">
          This editor reads and writes the persisted AdminConfiguration record. No browser-only defaults or mock-save fallback is used.
        </p>
      </div>

      {loading && <div role="status" className="rounded-2xl border border-white/10 bg-[#121215] p-6 text-sm text-text-muted">Loading persisted configuration…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-200">{notice}</div>}

      {!loading && !config && !error && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-text-secondary">
          No managed-hiring configuration is stored yet. Enter an audited configuration JSON object below before enabling commercial automation.
        </div>
      )}

      {!loading && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">Persisted configuration JSON</label>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={24}
            spellCheck={false}
            placeholder='{"pricing": {...}, "agreements": {...}}'
            className="w-full rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-relaxed text-white outline-none focus:border-primary"
          />
          <button type="button" onClick={save} disabled={saving || !draft.trim()} className="mt-4 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save persisted configuration"}
          </button>
        </div>
      )}
    </div>
  );
}
