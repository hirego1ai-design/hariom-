"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

<<<<<<< HEAD
type ProviderName = "openai" | "gemini" | "deepseek" | "kimi" | "qwen" | "self_hosted";
=======
type ProviderName = "openai" | "gemini" | "deepseek" | "kimi" | "qwen" | "groq" | "openrouter" | "self_hosted";
>>>>>>> origin/main
type ProviderView = {
  provider: ProviderName;
  configured: boolean;
  source: "admin" | "environment" | "none";
  hasStoredKey: boolean;
  hasAdminOverride: boolean;
  hasEnvironmentKey: boolean;
  baseUrl: string | null;
  reason: string | null;
  updatedAt: string | null;
};
type Model = { key: string; provider: ProviderName; label: string; modelId: string; enabled: boolean };
type Draft = { apiKey: string; baseUrl: string; reason: string; modelKey: string };
const names: Record<ProviderName, string> = {
  openai: "OpenAI", gemini: "Google Gemini", deepseek: "DeepSeek",
<<<<<<< HEAD
  kimi: "Kimi / Moonshot", qwen: "Qwen / DashScope", self_hosted: "Self-hosted LLM",
=======
  kimi: "Kimi / Moonshot", qwen: "Qwen / DashScope", groq: "GroqCloud", openrouter: "OpenRouter (Free/Paid Models)", self_hosted: "Self-hosted LLM",
>>>>>>> origin/main
};
const providerNames = Object.keys(names) as ProviderName[];
const editableEndpoint = (p: ProviderName) => p === "qwen" || p === "self_hosted";

function getDraft(current: Record<string, Draft>, provider: ProviderName, view?: ProviderView): Draft {
  return current[provider] || { apiKey: "", baseUrl: view?.baseUrl || "", reason: "", modelKey: "" };
}

export default function AiProviderCredentialsPage() {
  const [providers, setProviders] = useState<ProviderView[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [working, setWorking] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [credentialResponse, registryResponse] = await Promise.all([
      fetch("/api/admin/ai-provider-credentials", { cache: "no-store" }),
      fetch("/api/admin/ai-routing", { cache: "no-store" }),
    ]);
    const credentialBody = await credentialResponse.json();
    if (!credentialResponse.ok || !credentialBody.success) {
      throw new Error(credentialBody.error || "Could not load credential settings.");
    }
    setProviders(credentialBody.providers || []);
    const registryBody = await registryResponse.json().catch(() => ({}));
    if (registryResponse.ok && registryBody.success) setModels(registryBody.config?.models || []);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try { await refresh(); }
      catch (err) { if (active) setError(err instanceof Error ? err.message : "Unable to load settings."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [refresh]);

  const update = (provider: ProviderName, patch: Partial<Draft>, view: ProviderView) => {
    setDrafts((all) => ({ ...all, [provider]: { ...getDraft(all, provider, view), ...patch } }));
  };

  const result = (provider: ProviderName, ok: boolean, message: string) => {
    setResults((all) => ({ ...all, [provider]: { ok, message } }));
  };

  async function submit(provider: ProviderName, action: "save" | "clear" | "test", view: ProviderView) {
    const draft = getDraft(drafts, provider, view);
    if (action === "clear" && !window.confirm("Clear the saved Admin override? An environment API key may remain active.")) return;
    setWorking(provider);
    result(provider, true, "");
    try {
      if (action === "save") {
        const body: Record<string, string> = { provider, reason: draft.reason.trim() };
        if (draft.apiKey.trim()) body.apiKey = draft.apiKey.trim();
        if (editableEndpoint(provider) && draft.baseUrl.trim() !== (view.baseUrl || "")) {
          body.baseUrl = draft.baseUrl.trim();
        }
        if (!body.apiKey && body.baseUrl === undefined) throw new Error("Enter a new key or change the endpoint.");
        if (body.reason.length < 3) throw new Error("Enter a short reason for the audit log.");
        const response = await fetch("/api/admin/ai-provider-credentials", {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not save credentials.");
        setDrafts((all) => ({
          ...all, [provider]: { ...getDraft(all, provider, view), apiKey: "", reason: "", baseUrl: (
            data.providers?.find((item: ProviderView) => item.provider === provider)?.baseUrl || ""
          ) },
        }));
        result(provider, true, "Credential updated securely. New requests use the saved key.");
        setProviders(data.providers);
      } else if (action === "clear") {
        if (draft.reason.trim().length < 3) throw new Error("Enter a reason before clearing the override.");
        const response = await fetch("/api/admin/ai-provider-credentials", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, reason: draft.reason.trim() }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not clear override.");
        setDrafts((all) => ({ ...all, [provider]: { apiKey: "", baseUrl: "", reason: "", modelKey: draft.modelKey } }));
        setProviders(data.providers);
        result(provider, true, data.message);
      } else {
        if (!draft.modelKey) throw new Error("Select an enabled model to test first.");
        const response = await fetch("/api/admin/ai-provider-credentials/test", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, modelKey: draft.modelKey }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Connection test failed.");
        result(provider, Boolean(data.connected), data.message || "No response.");
      }
    } catch (err) {
      result(provider, false, err instanceof Error ? err.message : "Request failed.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader title="LLM API Credentials" />
        <main className="mx-auto max-w-6xl space-y-7 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-extrabold">AI Provider Credentials</h1>
            <p className="max-w-3xl text-sm text-text-secondary">
              Add or rotate server-encrypted API keys for all registered LLM providers.
              Saved keys are never returned to the browser. Changes take effect on new AI requests.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/admin/models/registry" className="font-bold text-primary underline">Configure models and fallbacks →</Link>
              <Link href="/admin/ai-command-centre-dashboard" className="text-text-secondary underline">AI Control Centre →</Link>
            </div>
          </header>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
            A deployment administrator must configure AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY once (a random 32-byte base64/hex key).
            Do not replace it without re-encrypting saved credentials. Tests make a small billable provider request.
            An environment key remains active when the Admin override is cleared.
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-500/30 p-4 text-red-300">{error}</div>}
          {loading && <p className="text-text-muted">Loading provider settings…</p>}

          <div className="grid gap-5 lg:grid-cols-2">
            {providerNames.map((provider) => {
              const view = providers.find((item) => item.provider === provider);
              if (!view) return null;
              const draft = getDraft(drafts, provider, view);
              const options = models.filter((model) => model.provider === provider && model.enabled);
              const busy = working !== null;
              const notice = results[provider];
              return (
                <section key={provider} className="space-y-4 rounded-2xl border border-white/10 bg-[#15151B] p-5" aria-label={names[provider] + " credentials"}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">{names[provider]}</h2>
                      <p className="mt-1 text-xs text-text-muted">
                        {view.source === "admin" ? "Admin-encrypted key" : view.source === "environment" ? "Server environment key" : "No key configured"}
                      </p>
                    </div>
                    <span className={"rounded-full border px-2 py-1 text-[10px] font-extrabold " +
                      (view.configured ? "border-green-500/30 text-green-300" : "border-amber-500/30 text-amber-300")}>
                      {view.configured ? "KEY AVAILABLE" : "MISSING CONFIG"}
                    </span>
                  </div>
                  {view.reason && <p className="text-xs text-amber-200">{view.reason}</p>}
                  {view.updatedAt && <p className="text-xs text-text-muted">Last Admin update: {new Date(view.updatedAt).toLocaleString()}</p>}

                  <label className="block space-y-1 text-xs font-bold text-text-secondary">
                    New API key (leave empty to keep current key)
                    <input
                      type="password" autoComplete="new-password" spellCheck={false}
                      value={draft.apiKey}
                      onChange={(e) => update(provider, { apiKey: e.target.value }, view)}
                      placeholder={view.configured ? "•••••••• (configured)" : "Paste API key securely"}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
                    />
                  </label>

                  {editableEndpoint(provider) && (
                    <label className="block space-y-1 text-xs font-bold text-text-secondary">
                      HTTPS API endpoint
                      <input
                        type="url" value={draft.baseUrl}
                        onChange={(e) => update(provider, { baseUrl: e.target.value }, view)}
                        placeholder={provider === "qwen" ? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1" : "https://your-allowlisted-host.example/v1"}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
                      />
                    </label>
                  )}

                  <label className="block space-y-1 text-xs font-bold text-text-secondary">
                    Audit reason (required for changes)
                    <input
                      value={draft.reason} maxLength={300}
                      onChange={(e) => update(provider, { reason: e.target.value }, view)}
                      placeholder="e.g. rotate production key"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy} type="button" onClick={() => void submit(provider, "save", view)}
                      className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-black disabled:opacity-50">
                      {working === provider ? "Working…" : "Save / Rotate"}
                    </button>
                    <button disabled={busy || !view.hasAdminOverride} type="button" onClick={() => void submit(provider, "clear", view)}
                      className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold disabled:opacity-40">
                      Clear Admin override
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold text-text-secondary">Connection test (small billable request)</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select aria-label={"Test model for " + names[provider]}
                        value={draft.modelKey} onChange={(e) => update(provider, { modelKey: e.target.value }, view)}
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#202029] px-3 py-2.5 text-xs text-white">
                        <option value="">Choose an enabled model</option>
                        {options.map((model) => <option key={model.key} value={model.key}>{model.label} — {model.modelId}</option>)}
                      </select>
                      <button type="button" disabled={busy || !view.configured || !draft.modelKey}
                        onClick={() => void submit(provider, "test", view)}
                        className="rounded-xl border border-primary/40 px-4 py-2.5 text-xs font-bold text-primary disabled:opacity-40">
                        Test connection
                      </button>
                    </div>
                    {!options.length && <p className="text-xs text-text-muted">Enable a model for this provider in Model Registry before testing.</p>}
                  </div>
                  {notice?.message && <p role="status" className={"text-xs " + (notice.ok ? "text-green-300" : "text-red-300")}>{notice.message}</p>}
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
