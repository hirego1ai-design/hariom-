"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Model = {
  key: string;
  provider: string;
  modelId: string;
  label: string;
  enabled: boolean;
  qualityTier: string;
  inputUsdPerMillion: number | null;
  outputUsdPerMillion: number | null;
};

type Route = {
  taskType: string;
  mode: string;
  primaryModelKey: string | null;
  fallbackModelKeys: string[];
};

type ProviderStatus = {
  provider: string;
  configured: boolean;
  status: string;
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

type RoutingPayload = {
  success: boolean;
  config: { models: Model[]; routes: Route[] };
  providers: ProviderStatus[];
  telemetry: {
    totalRequests: number;
    totalTokens: number;
    totalCostUsd: number;
    avgLatencyMs: number;
    providerCounts: Record<string, number>;
    modelStats: ModelStat[];
  };
  error?: string;
};

type BenchmarkResult = {
  key: string;
  provider: string;
  model: string;
  label: string;
  success: boolean;
  schemaPass: boolean;
  latencyMs: number;
  totalTokens: number | null;
  costUsd: number | null;
  output: string | null;
  error: string | null;
};

function money(value: number | null) {
  return value === null ? "Not measured" : `$${value.toFixed(value < 0.01 ? 6 : 4)}`;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminLlmUsagePage() {
  const [data, setData] = useState<RoutingPayload | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [benchmarking, setBenchmarking] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ai-routing", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to load AI telemetry.");
      setData(body);
      const runnableKeys = (body.config?.models || [])
        .filter((model: Model) => model.enabled)
        .slice(0, 3)
        .map((model: Model) => model.key);
      setSelectedModels((current) => current.length ? current : runnableKeys);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load AI telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const statsByModel = useMemo(() => {
    const map = new Map<string, ModelStat>();
    for (const stat of data?.telemetry.modelStats || []) {
      map.set(`${stat.provider}:${stat.model}`, stat);
    }
    return map;
  }, [data]);

  const runBenchmark = async () => {
    if (!selectedModels.length || benchmarking) return;
    setBenchmarking(true);
    setError("");
    setBenchmark([]);
    try {
      const response = await fetch("/api/admin/model-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelKeys: selectedModels }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Benchmark failed.");
      setBenchmark(body.results || []);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Benchmark failed.");
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader title="LLM Usage & Model Comparison" />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-8 max-w-7xl mx-auto">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">AI infrastructure</p>
          <h1 className="text-3xl font-extrabold">Usage, Cost & Model Comparison</h1>
          <p className="max-w-4xl text-sm text-text-muted">
            Live telemetry comes from the same model registry and router used by HireGo agents. No provider or model name on this page is hardcoded.
          </p>
          <Link href="/admin/models/registry" className="inline-flex text-xs font-bold text-primary">
            Open Model Registry & Routing →
          </Link>
        </header>

        {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading real AI telemetry…</div>}
        {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {!loading && data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#121215] p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Requests</p><p className="mt-2 text-2xl font-bold">{data.telemetry.totalRequests}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#121215] p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Tokens</p><p className="mt-2 text-2xl font-bold">{data.telemetry.totalTokens}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#121215] p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Observed spend</p><p className="mt-2 text-2xl font-bold">{money(data.telemetry.totalCostUsd)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#121215] p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Average latency</p><p className="mt-2 text-2xl font-bold">{data.telemetry.avgLatencyMs} ms</p></div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Provider usage</h2>
                <p className="mt-1 text-xs text-text-muted">Configured status is server-derived. It does not mean every model under that provider is enabled.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {data.providers.map((provider) => (
                  <article key={provider.provider} className="rounded-2xl border border-white/10 bg-[#121215] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold uppercase">{provider.provider}</p>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${provider.configured ? "border-green-500/30 text-green-300" : "border-amber-500/30 text-amber-300"}`}>
                        {provider.configured ? "CONFIGURED" : "NOT CONFIGURED"}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-extrabold">{data.telemetry.providerCounts[provider.provider] || 0}</p>
                    <p className="text-xs text-text-muted">observed requests</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Model performance</h2>
                <p className="mt-1 text-xs text-text-muted">Cost per successful task reflects observed cost and reliability when enough telemetry exists.</p>
              </div>
              {data.config.models.length === 0 ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-text-muted">
                  No models are registered yet. Configure exact model IDs and prices in Model Registry first.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-white/5 text-text-muted">
                      <tr>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Configured token price</th>
                        <th className="px-4 py-3">Requests</th>
                        <th className="px-4 py-3">Success</th>
                        <th className="px-4 py-3">Fallback</th>
                        <th className="px-4 py-3">Avg latency</th>
                        <th className="px-4 py-3">Cost / success</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.config.models.map((model) => {
                        const stat = statsByModel.get(`${model.provider}:${model.modelId}`);
                        return (
                          <tr key={model.key} className="border-t border-white/5 bg-[#121215]">
                            <td className="px-4 py-3"><p className="font-bold">{model.label}</p><p className="text-text-muted">{model.provider} · {model.modelId}</p></td>
                            <td className="px-4 py-3">{model.qualityTier}</td>
                            <td className="px-4 py-3">{model.inputUsdPerMillion === null || model.outputUsdPerMillion === null ? "Missing" : `$${model.inputUsdPerMillion} in / $${model.outputUsdPerMillion} out`}</td>
                            <td className="px-4 py-3">{stat?.requests ?? 0}</td>
                            <td className="px-4 py-3">{stat ? percent(stat.successRate) : "No data"}</td>
                            <td className="px-4 py-3">{stat ? percent(stat.fallbackRate) : "No data"}</td>
                            <td className="px-4 py-3">{stat?.avgLatencyMs == null ? "No data" : `${stat.avgLatencyMs} ms`}</td>
                            <td className="px-4 py-3">{money(stat?.costPerSuccessfulTaskUsd ?? null)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Safe Model Comparison</h2>
                <p className="mt-1 max-w-3xl text-xs text-text-muted">
                  Compare up to five enabled models using the same synthetic structured-summary task. No real candidate, employer, resume, or conversation data is used.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.config.models.filter((model) => model.enabled).map((model) => {
                  const selected = selectedModels.includes(model.key);
                  return (
                    <button
                      key={model.key}
                      type="button"
                      onClick={() => setSelectedModels((current) =>
                        selected
                          ? current.filter((key) => key !== model.key)
                          : current.length < 5
                            ? [...current, model.key]
                            : current
                      )}
                      className={`rounded-full border px-3 py-2 text-xs font-bold ${selected ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-text-secondary"}`}
                    >
                      {model.label} · {model.provider}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void runBenchmark()}
                disabled={!selectedModels.length || benchmarking}
                className="w-fit rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-black disabled:opacity-50"
              >
                {benchmarking ? "Running benchmark…" : "Compare selected models"}
              </button>

              {benchmark.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {benchmark.map((result) => (
                    <article key={result.key} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-bold">{result.label}</p><p className="text-xs text-text-muted">{result.provider} · {result.model}</p></div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${result.success && result.schemaPass ? "border-green-500/30 text-green-300" : "border-red-500/30 text-red-300"}`}>
                          {result.success ? (result.schemaPass ? "SCHEMA PASS" : "SCHEMA FAIL") : "FAILED"}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                        <div><p className="text-text-muted">Latency</p><p className="font-bold">{result.latencyMs} ms</p></div>
                        <div><p className="text-text-muted">Tokens</p><p className="font-bold">{result.totalTokens ?? "Unknown"}</p></div>
                        <div><p className="text-text-muted">Cost</p><p className="font-bold">{money(result.costUsd)}</p></div>
                      </div>
                      {result.error && <p className="mt-4 text-xs text-red-300">{result.error}</p>}
                      {result.output && <pre className="mt-4 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] text-text-secondary">{result.output}</pre>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
