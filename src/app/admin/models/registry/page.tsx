"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type ProviderName = "openai" | "gemini" | "deepseek" | "kimi" | "qwen";
type QualityTier = "ECONOMY" | "BALANCED" | "PREMIUM";
type RoutingMode = "MANUAL" | "COST_SAVER" | "BALANCED" | "QUALITY_FIRST" | "SMART_AUTO";

type ModelConfig = {
  key: string;
  provider: ProviderName;
  modelId: string;
  label: string;
  enabled: boolean;
  qualityTier: QualityTier;
  capabilities: string[];
  taskTypes: string[];
  inputUsdPerMillion: number | null;
  outputUsdPerMillion: number | null;
  cachedInputUsdPerMillion: number | null;
  contextWindow: number | null;
};

type TaskRoute = {
  taskType: string;
  mode: RoutingMode;
  primaryModelKey: string | null;
  fallbackModelKeys: string[];
  timeoutMs: number;
  maxTokens: number;
  temperature: number | null;
  maxRetriesPerEndpoint: number;
  maxCostUsdPerRequest: number | null;
};

type AiRoutingConfig = {
  version: number;
  models: ModelConfig[];
  routes: TaskRoute[];
};

type ProviderStatus = {
  provider: ProviderName;
  configured: boolean;
  status: string;
  reason: string | null;
};

type ModelStat = {
  provider: string;
  model: string;
  requests: number;
  successRate: number;
  fallbackRate: number;
  failureRate: number;
  avgLatencyMs: number | null;
  avgCostUsd: number | null;
  costPerSuccessfulTaskUsd: number | null;
};

type Telemetry = {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  providerCounts: Record<string, number>;
  modelStats: ModelStat[];
};

const providers: ProviderName[] = ["openai", "gemini", "deepseek", "kimi", "qwen"];
const qualityTiers: QualityTier[] = ["ECONOMY", "BALANCED", "PREMIUM"];
const routingModes: RoutingMode[] = ["MANUAL", "COST_SAVER", "BALANCED", "QUALITY_FIRST", "SMART_AUTO"];
const capabilities = ["TEXT", "STRUCTURED_OUTPUT", "TOOL_USE", "VISION", "LONG_CONTEXT", "REASONING"];

function nullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function money(value: number | null) {
  return value === null ? "Not measured" : `$${value.toFixed(value < 0.01 ? 6 : 4)}`;
}

function newModelKey(config: AiRoutingConfig) {
  let index = config.models.length + 1;
  let key = `model-${index}`;
  const keys = new Set(config.models.map((model) => model.key));
  while (keys.has(key)) {
    index += 1;
    key = `model-${index}`;
  }
  return key;
}

function newTaskKey(config: AiRoutingConfig) {
  let index = config.routes.length + 1;
  let key = `task-${index}`;
  const keys = new Set(config.routes.map((route) => route.taskType));
  while (keys.has(key)) {
    index += 1;
    key = `task-${index}`;
  }
  return key;
}

export default function AdminModelRegistryPage() {
  const [config, setConfig] = useState<AiRoutingConfig>({ version: 1, models: [], routes: [] });
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ai-routing", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load AI routing configuration.");
      setConfig(data.config);
      setProviderStatus(data.providers || []);
      setTelemetry(data.telemetry || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load AI routing configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const statByModel = useMemo(() => {
    const map = new Map<string, ModelStat>();
    for (const stat of telemetry?.modelStats || []) {
      map.set(`${stat.provider}:${stat.model}`, stat);
    }
    return map;
  }, [telemetry]);

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/ai-routing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { ...config, version: config.version + 1 },
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "AI routing configuration could not be saved.");
      setConfig(data.config);
      setProviderStatus(data.providers || providerStatus);
      setReason("");
      setNotice("Routing configuration saved and audited. New AI requests will use this policy.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI routing configuration could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const updateModel = (index: number, patch: Partial<ModelConfig>) => {
    setConfig((current) => ({
      ...current,
      models: current.models.map((model, modelIndex) =>
        modelIndex === index ? { ...model, ...patch } : model
      ),
    }));
  };

  const updateRoute = (index: number, patch: Partial<TaskRoute>) => {
    setConfig((current) => ({
      ...current,
      routes: current.routes.map((route, routeIndex) =>
        routeIndex === index ? { ...route, ...patch } : route
      ),
    }));
  };

  const addModel = () => {
    setConfig((current) => ({
      ...current,
      models: [
        ...current.models,
        {
          key: newModelKey(current),
          provider: "openai",
          modelId: "",
          label: "New model",
          enabled: false,
          qualityTier: "BALANCED",
          capabilities: ["TEXT"],
          taskTypes: ["*"],
          inputUsdPerMillion: null,
          outputUsdPerMillion: null,
          cachedInputUsdPerMillion: null,
          contextWindow: null,
        },
      ],
    }));
  };

  const addRoute = () => {
    setConfig((current) => ({
      ...current,
      routes: [
        ...current.routes,
        {
          taskType: newTaskKey(current),
          mode: "MANUAL",
          primaryModelKey: null,
          fallbackModelKeys: [],
          timeoutMs: 20_000,
          maxTokens: 2_000,
          temperature: null,
          maxRetriesPerEndpoint: 0,
          maxCostUsdPerRequest: null,
        },
      ],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="AI Model Registry" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-8 max-w-[1500px] w-full mx-auto">
          <header className="space-y-2">
            <h1 className="font-display-lg text-display-lg text-white">AI Model Registry & Routing</h1>
            <p className="max-w-4xl text-sm text-text-muted">
              Configure exact provider models and per-task routing without changing business logic. Provider secrets remain server-side and are never returned to this screen.
            </p>
          </header>

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">
              Loading authoritative AI configuration…
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-sm text-green-200">
              {notice}
            </div>
          )}

          {!loading && (
            <>
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Provider readiness</h2>
                  <p className="mt-1 text-xs text-text-muted">Configured means the server has the required credential/endpoint. It does not claim a model is enabled for any task.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {providers.map((provider) => {
                    const status = providerStatus.find((item) => item.provider === provider);
                    const configured = Boolean(status?.configured);
                    return (
                      <article key={provider} className="rounded-2xl border border-white/10 bg-[#121215] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold uppercase text-white">{provider}</p>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${configured ? "border-green-500/30 text-green-300" : "border-amber-500/30 text-amber-300"}`}>
                            {configured ? "CONFIGURED" : "MISSING CONFIG"}
                          </span>
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
                          {configured ? "Server credential is present." : status?.reason || "Provider configuration unavailable."}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Observed requests</p>
                  <p className="mt-2 text-2xl font-bold text-white">{telemetry?.totalRequests ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Observed tokens</p>
                  <p className="mt-2 text-2xl font-bold text-white">{telemetry?.totalTokens ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Observed spend</p>
                  <p className="mt-2 text-2xl font-bold text-white">{money(telemetry?.totalCostUsd ?? 0)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Average latency</p>
                  <p className="mt-2 text-2xl font-bold text-white">{telemetry ? `${telemetry.avgLatencyMs} ms` : "—"}</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Models</h2>
                    <p className="mt-1 text-xs text-text-muted">Prices are admin-maintained metadata used for routing/accounting. Keep them synchronized with provider pricing.</p>
                  </div>
                  <button type="button" onClick={addModel} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/5">
                    + Add model
                  </button>
                </div>

                {config.models.length === 0 && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-text-muted">
                    No model is registered. AI requests will fail closed until an enabled model and task route are configured.
                  </div>
                )}

                <div className="space-y-4">
                  {config.models.map((model, index) => {
                    const stat = statByModel.get(`${model.provider}:${model.modelId}`);
                    return (
                      <article key={`${model.key}-${index}`} className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-white">{model.label || "Unnamed model"}</p>
                            <p className="mt-1 text-xs text-text-muted">{model.provider} · {model.modelId || "Model ID required"}</p>
                          </div>
                          <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                            <input type="checkbox" checked={model.enabled} onChange={(event) => updateModel(index, { enabled: event.target.checked })} />
                            Enabled
                          </label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <label className="text-xs text-text-muted">Registry key
                            <input value={model.key} onChange={(event) => updateModel(index, { key: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Provider
                            <select value={model.provider} onChange={(event) => updateModel(index, { provider: event.target.value as ProviderName })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Exact model ID
                            <input value={model.modelId} onChange={(event) => updateModel(index, { modelId: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Display label
                            <input value={model.label} onChange={(event) => updateModel(index, { label: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Quality tier
                            <select value={model.qualityTier} onChange={(event) => updateModel(index, { qualityTier: event.target.value as QualityTier })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              {qualityTiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Input $ / 1M tokens
                            <input type="number" min="0" step="0.000001" value={model.inputUsdPerMillion ?? ""} onChange={(event) => updateModel(index, { inputUsdPerMillion: nullableNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Output $ / 1M tokens
                            <input type="number" min="0" step="0.000001" value={model.outputUsdPerMillion ?? ""} onChange={(event) => updateModel(index, { outputUsdPerMillion: nullableNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Cached input $ / 1M
                            <input type="number" min="0" step="0.000001" value={model.cachedInputUsdPerMillion ?? ""} onChange={(event) => updateModel(index, { cachedInputUsdPerMillion: nullableNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Context window
                            <input type="number" min="1" value={model.contextWindow ?? ""} onChange={(event) => updateModel(index, { contextWindow: nullableNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted md:col-span-2">Allowed task types (comma separated, * = any)
                            <input value={model.taskTypes.join(", ")} onChange={(event) => updateModel(index, { taskTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((capability) => {
                            const checked = model.capabilities.includes(capability);
                            return (
                              <label key={capability} className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-bold ${checked ? "border-sky-500/40 text-sky-300" : "border-white/10 text-text-muted"}`}>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={(event) => {
                                    const next = event.target.checked
                                      ? Array.from(new Set([...model.capabilities, capability]))
                                      : model.capabilities.filter((item) => item !== capability);
                                    updateModel(index, { capabilities: next });
                                  }}
                                />
                                {capability}
                              </label>
                            );
                          })}
                        </div>

                        <div className="grid gap-3 rounded-xl border border-white/5 bg-black/15 p-4 text-xs sm:grid-cols-5">
                          <div><p className="text-text-muted">Requests</p><p className="mt-1 font-bold text-white">{stat?.requests ?? 0}</p></div>
                          <div><p className="text-text-muted">Success</p><p className="mt-1 font-bold text-white">{stat ? asPercent(stat.successRate) : "No data"}</p></div>
                          <div><p className="text-text-muted">Fallback</p><p className="mt-1 font-bold text-white">{stat ? asPercent(stat.fallbackRate) : "No data"}</p></div>
                          <div><p className="text-text-muted">Avg latency</p><p className="mt-1 font-bold text-white">{stat?.avgLatencyMs === null || stat?.avgLatencyMs === undefined ? "No data" : `${stat.avgLatencyMs} ms`}</p></div>
                          <div><p className="text-text-muted">Cost / success</p><p className="mt-1 font-bold text-white">{money(stat?.costPerSuccessfulTaskUsd ?? null)}</p></div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setConfig((current) => ({
                            ...current,
                            models: current.models.filter((_, itemIndex) => itemIndex !== index),
                            routes: current.routes.map((route) => ({
                              ...route,
                              primaryModelKey: route.primaryModelKey === model.key ? null : route.primaryModelKey,
                              fallbackModelKeys: route.fallbackModelKeys.filter((key) => key !== model.key),
                            })),
                          }))}
                          className="text-xs font-bold text-red-300 hover:text-red-200"
                        >
                          Remove model from registry
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Per-task routing</h2>
                    <p className="mt-1 text-xs text-text-muted">Each task is limited to the models explicitly selected here. Cost/quality modes only reorder this approved chain.</p>
                  </div>
                  <button type="button" onClick={addRoute} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/5">
                    + Add task route
                  </button>
                </div>

                {config.routes.length === 0 && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-text-muted">
                    No task route is configured. AI tasks fail closed rather than silently choosing an unapproved model.
                  </div>
                )}

                <div className="space-y-4">
                  {config.routes.map((route, index) => {
                    const fallback1 = route.fallbackModelKeys[0] || "";
                    const fallback2 = route.fallbackModelKeys[1] || "";
                    const setFallback = (position: number, value: string) => {
                      const next = [...route.fallbackModelKeys];
                      if (value) next[position] = value;
                      else next.splice(position, 1);
                      updateRoute(index, { fallbackModelKeys: Array.from(new Set(next.filter(Boolean))) });
                    };
                    return (
                      <article key={`${route.taskType}-${index}`} className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <label className="text-xs text-text-muted">Task type
                            <input value={route.taskType} onChange={(event) => updateRoute(index, { taskType: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Routing mode
                            <select value={route.mode} onChange={(event) => updateRoute(index, { mode: event.target.value as RoutingMode })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              {routingModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Primary model
                            <select value={route.primaryModelKey || ""} onChange={(event) => updateRoute(index, { primaryModelKey: event.target.value || null })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              <option value="">Select model</option>
                              {config.models.map((model) => <option key={model.key} value={model.key}>{model.label} · {model.provider}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Fallback 1
                            <select value={fallback1} onChange={(event) => setFallback(0, event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              <option value="">None</option>
                              {config.models.filter((model) => model.key !== route.primaryModelKey).map((model) => <option key={model.key} value={model.key}>{model.label} · {model.provider}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Fallback 2
                            <select value={fallback2} onChange={(event) => setFallback(1, event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              <option value="">None</option>
                              {config.models.filter((model) => model.key !== route.primaryModelKey && model.key !== fallback1).map((model) => <option key={model.key} value={model.key}>{model.label} · {model.provider}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Timeout ms
                            <input type="number" min="1000" max="120000" value={route.timeoutMs} onChange={(event) => updateRoute(index, { timeoutMs: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Max output tokens
                            <input type="number" min="1" value={route.maxTokens} onChange={(event) => updateRoute(index, { maxTokens: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Temperature (blank = provider default)
                            <input type="number" min="0" max="2" step="0.1" value={route.temperature ?? ""} onChange={(event) => updateRoute(index, { temperature: nullableNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                          <label className="text-xs text-text-muted">Same-endpoint rate-limit retry
                            <select value={route.maxRetriesPerEndpoint} onChange={(event) => updateRoute(index, { maxRetriesPerEndpoint: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-2.5 text-white">
                              <option value={0}>0</option>
                              <option value={1}>1</option>
                            </select>
                          </label>
                          <label className="text-xs text-text-muted">Max cost / request USD
                            <input type="number" min="0" step="0.000001" value={route.maxCostUsdPerRequest ?? ""} onChange={(event) => updateRoute(index, { maxCostUsdPerRequest: nullableNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white" />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfig((current) => ({ ...current, routes: current.routes.filter((_, routeIndex) => routeIndex !== index) }))}
                          className="text-xs font-bold text-red-300 hover:text-red-200"
                        >
                          Remove task route
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Save routing policy</h2>
                  <p className="mt-1 text-xs text-text-muted">Changes are audited. They affect future AI requests only and never alter deterministic auth, payments, MCQ scoring or application authorization.</p>
                </div>
                <label className="block text-xs text-text-muted">
                  Change reason (optional)
                  <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" placeholder="Why are you changing this routing policy?" />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={saving} onClick={() => void save()} className="rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-50">
                    {saving ? "Saving…" : "Save & activate"}
                  </button>
                  <button type="button" disabled={saving} onClick={() => void load()} className="rounded-xl border border-white/15 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                    Discard local changes
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
