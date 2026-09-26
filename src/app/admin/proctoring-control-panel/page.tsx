"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Config = {
  enabled: boolean;
  tabSwitchEnabled: boolean;
  clipboardEnabled: boolean;
  contextMenuEnabled: boolean;
};

const DEFAULT_CONFIG: Config = {
  enabled: true,
  tabSwitchEnabled: true,
  clipboardEnabled: true,
  contextMenuEnabled: true,
};

export default function AdminProctoringControlPanelPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/proctoring-config", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) throw new Error(data?.error || "Could not load proctoring policy.");
        setConfig({
          enabled: data.config.enabled,
          tabSwitchEnabled: data.config.tabSwitchEnabled,
          clipboardEnabled: data.config.clipboardEnabled,
          contextMenuEnabled: data.config.contextMenuEnabled,
        });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load proctoring policy."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/proctoring-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Could not save proctoring policy.");
      setMessage("Proctoring runtime policy saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save proctoring policy.");
    } finally {
      setSaving(false);
    }
  };

  const items: Array<{ key: keyof Config; title: string; description: string }> = [
    { key: "enabled", title: "Live browser integrity telemetry", description: "Master switch for candidate-side browser event collection during interviews." },
    { key: "tabSwitchEnabled", title: "Tab switching", description: "Record when the interview tab becomes hidden." },
    { key: "clipboardEnabled", title: "Copy / paste attempts", description: "Block and record clipboard activity while telemetry is enabled." },
    { key: "contextMenuEnabled", title: "Context menu", description: "Block and record right-click activity while telemetry is enabled." },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Proctoring Control Panel" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1000px] w-full mx-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Proctoring Control Panel</h1>
            <p className="text-text-muted text-sm">These settings are persisted and enforced by the live interview browser telemetry runtime.</p>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-100">
            Face detection and audio anomaly detection are not enabled by these controls. HireGo currently records only the browser events listed below and treats them as unverified evidence requiring human review.
          </div>

          {message && <div role="status" className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{message}</div>}

          <div className="space-y-3">
            {items.map((item) => (
              <label key={item.key} className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[#141418] p-5">
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={config[item.key]}
                  disabled={loading || (item.key !== "enabled" && !config.enabled)}
                  onChange={(event) => setConfig((current) => ({ ...current, [item.key]: event.target.checked }))}
                  className="h-5 w-5"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void save()}
            className="rounded-full bg-yellow px-6 py-3 text-xs font-bold text-black disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save runtime policy"}
          </button>
        </main>
      </div>
    </div>
  );
}
