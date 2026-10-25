"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Activity,
  Database,
  DollarSign,
  Clock,
  Sparkles,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Key,
  Bot,
  Zap,
  Search,
  Check,
  SlidersHorizontal,
} from "lucide-react";

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
  reason?: string;
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
    totalTokens: number | null;
    knownTokens: number;
    tokenCoverageRate: number | null;
    totalCostUsd: number | null;
    knownCostUsd: number;
    costCoverageRate: number | null;
    avgLatencyMs: number | null;
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

const PROVIDER_METADATA: Record<
  string,
  {
    name: string;
    tagline: string;
    modelsSummary: string;
    badgeBg: string;
    borderColor: string;
    accentColor: string;
  }
> = {
  openai: {
    name: "OpenAI",
    tagline: "Industry Standard Multi-modal",
    modelsSummary: "GPT-4o, GPT-4o-mini, o1, o3-mini",
    badgeBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    accentColor: "text-emerald-400",
  },
  gemini: {
    name: "Google Gemini",
    tagline: "Ultra-long Context & Speed",
    modelsSummary: "Gemini 1.5 Pro, Flash 2.0, Flash-8B",
    badgeBg: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    accentColor: "text-blue-400",
  },
  deepseek: {
    name: "DeepSeek",
    tagline: "High Reasoning & Math Economics",
    modelsSummary: "DeepSeek-V3, DeepSeek-R1 (Reasoning)",
    badgeBg: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    accentColor: "text-cyan-400",
  },
  kimi: {
    name: "Moonshot Kimi",
    tagline: "200k+ Long Document Analysis",
    modelsSummary: "Kimi 1.5, Kimi Pro Long-Context",
    badgeBg: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    accentColor: "text-purple-400",
  },
  qwen: {
    name: "Alibaba Qwen",
    tagline: "Multilingual & Code Evaluation",
    modelsSummary: "Qwen 2.5 72B, Qwen Coder",
    badgeBg: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-400",
  },
  groq: {
    name: "Groq LPU",
    tagline: "Ultra Low-Latency Inference",
    modelsSummary: "Llama 3.3 70B Fast, Mixtral 8x7B",
    badgeBg: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    accentColor: "text-orange-400",
  },
  self_hosted: {
    name: "Self-Hosted / Local",
    tagline: "Private In-VPC Cluster",
    modelsSummary: "vLLM, Ollama, TGI Private Endpoints",
    badgeBg: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    accentColor: "text-rose-400",
  },
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "$0.00";
  if (value === 0) return "$0.0000";
  return `$${value.toFixed(value < 0.01 ? 6 : 4)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function getTierBadgeClass(tier: string): string {
  switch (tier.toLowerCase()) {
    case "reasoning":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "flagship":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "fast":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "economy":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function AdminLlmUsagePage() {
  const [data, setData] = useState<RoutingPayload | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [providerFilter, setProviderFilter] = useState<"all" | "active" | "configured" | "unconfigured">("all");
  const [modelSearch, setModelSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const load = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/llm-usage", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error || "Unable to load AI telemetry.");
      }
      setData(body);

      const runnableKeys = (body.config?.models || [])
        .filter((model: Model) => model.enabled)
        .slice(0, 3)
        .map((model: Model) => model.key);
      setSelectedModels((current) => (current.length ? current : runnableKeys));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load AI telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Provider filtering
  const filteredProviders = useMemo(() => {
    if (!data?.providers) return [];
    return data.providers.filter((p) => {
      const count = data.telemetry.providerCounts[p.provider] || 0;
      if (providerFilter === "active") return p.configured && count > 0;
      if (providerFilter === "configured") return p.configured;
      if (providerFilter === "unconfigured") return !p.configured;
      return true;
    });
  }, [data, providerFilter]);

  // Model filtering
  const filteredModels = useMemo(() => {
    if (!data?.config.models) return [];
    return data.config.models.filter((m) => {
      const matchesSearch =
        m.label.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.modelId.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.provider.toLowerCase().includes(modelSearch.toLowerCase());
      const matchesTier = tierFilter === "all" || m.qualityTier.toLowerCase() === tierFilter.toLowerCase();
      return matchesSearch && matchesTier;
    });
  }, [data, modelSearch, tierFilter]);

  const totalInferences = data?.telemetry.totalRequests ?? 0;
  const knownTokens = data?.telemetry.knownTokens ?? 0;
  const totalTokens = data?.telemetry.totalTokens ?? null;
  const displayedTokens = knownTokens > 0 ? knownTokens : totalTokens ?? 0;

  const knownSpend = data?.telemetry.knownCostUsd ?? 0;
  const totalSpend = data?.telemetry.totalCostUsd ?? null;
  const displayedSpend = knownSpend > 0 ? knownSpend : totalSpend ?? 0;

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative selection:bg-cyan-500/30 selection:text-cyan-200">
      <AdminSidebar />
      <AdminHeader
        title="AI Telemetry & LLM Intelligence"
        subtitle="Multi-Model Multi-Provider Live Usage Analytics"
      />

      {/* ─── Main Content Container with Generous Top Padding to Prevent Header Clipping ─── */}
      <main className="md:ml-[116px] px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-20 max-w-7xl mx-auto space-y-8">
        {/* ─── Executive Header & Actions ─── */}
        <header className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE INFERENCE ROUTER · LM06</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Usage, Cost &amp; Model Intelligence
              </h1>

              <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
                Real-time operational telemetry streaming from HireGo’s agentic routing fabric. No provider or model names are hardcoded.
              </p>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition-all shadow-sm disabled:opacity-50"
                title="Refresh live metrics"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${refreshing ? "animate-spin" : ""}`} />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <Link
                href="/admin/models/registry"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                <span>Model Registry</span>
              </Link>

              <Link
                href="/admin/settings/ai-provider-credentials"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2.5 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20"
              >
                <Key className="h-3.5 w-3.5 text-white" />
                <span>LLM Credentials</span>
              </Link>
            </div>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#121215] p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
            <span>Loading live AI infrastructure telemetry...</span>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <strong className="block font-bold">Telemetry Sync Alert</strong>
              <span className="text-xs text-red-300">{error}</span>
            </div>
            <button
              onClick={() => void load()}
              className="rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ─── Top Level 4-Card KPI Grid ─── */}
            <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Total Requests */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/90 p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    TOTAL INFERENCES
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {totalInferences.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">requests</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Dispatched across agentic workflows</span>
                </div>
              </div>

              {/* Card 2: Tracked Tokens */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/90 p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    TRACKED TOKENS
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Database className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {data.telemetry.totalTokens === null ? "Not fully measured" : displayedTokens.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                    Known Volume
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>
                    {data.telemetry.totalTokens === null && data.telemetry.totalRequests > 0
                      ? `Known tokens: ${data.telemetry.knownTokens.toLocaleString()}`
                      : "Reported from active provider streams"}
                  </span>
                </div>
              </div>

              {/* Card 3: Observed Spend */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/90 p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    OBSERVED SPEND
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {formatCurrency(displayedSpend)}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                    Active Rate
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>
                    {data.telemetry.totalCostUsd === null && data.telemetry.totalRequests > 0
                      ? `Known priced spend: ${formatCurrency(data.telemetry.knownCostUsd)}`
                      : "Calculated from model token price tables"}
                  </span>
                </div>
              </div>

              {/* Card 4: Average Latency */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/90 p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    AVERAGE LATENCY
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {data.telemetry.avgLatencyMs == null ? "No data" : `${data.telemetry.avgLatencyMs.toLocaleString()} ms`}
                  </span>
                  {data.telemetry.avgLatencyMs != null && (
                    <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300">
                      {data.telemetry.avgLatencyMs < 2000 ? "● Optimal" : "● Measured"}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span>End-to-end model turnaround time</span>
                </div>
              </div>
            </section>

            {/* ─── Provider Ecosystem Section (Completely redesigned to address circled items) ─── */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>Provider Usage &amp; Multi-Model Ecosystem</span>
                    <span className="text-xs font-mono text-slate-400">({data.providers.length} registered)</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Configured status is server-derived. Models under configured providers can be dynamically routed based on task complexity.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setProviderFilter("all")}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      providerFilter === "all" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({data.providers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderFilter("active")}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      providerFilter === "active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderFilter("configured")}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      providerFilter === "configured" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Configured
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderFilter("unconfigured")}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      providerFilter === "unconfigured" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Needs Setup
                  </button>
                </div>
              </div>

              {/* Provider Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((provider) => {
                  const key = provider.provider.toLowerCase();
                  const meta = PROVIDER_METADATA[key] || {
                    name: provider.provider.toUpperCase(),
                    tagline: "Custom Provider Integration",
                    modelsSummary: "Dynamically registered models",
                    badgeBg: "bg-slate-500/10",
                    borderColor: "border-slate-500/30",
                    accentColor: "text-slate-400",
                  };

                  const count = data.telemetry.providerCounts[provider.provider] || 0;
                  const trafficShare = totalInferences > 0 ? (count / totalInferences) * 100 : 0;
                  const isActive = provider.configured && count > 0;

                  return (
                    <article
                      key={provider.provider}
                      className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all backdrop-blur-md ${
                        isActive
                          ? "border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-[#121215] to-[#121215] shadow-lg shadow-emerald-950/20"
                          : provider.configured
                          ? "border-white/10 bg-[#121215]/90 hover:border-white/20"
                          : "border-white/5 bg-[#0f0f13]/70 hover:border-white/15"
                      }`}
                    >
                      <div>
                        {/* Provider Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-extrabold ${meta.accentColor}`}>
                                {meta.name}
                              </span>
                              {isActive && (
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {meta.tagline}
                            </span>
                          </div>

                          {/* Refined Status Pill (Replaces ugly yellow warning) */}
                          {provider.configured ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                              <Check className="h-3 w-3" />
                              CONFIGURED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                              <Key className="h-2.5 w-2.5 text-amber-400" />
                              KEY NEEDED
                            </span>
                          )}
                        </div>

                        {/* Model Family Summary */}
                        <div className="my-3 text-[11px] font-mono text-slate-400 bg-black/30 rounded-lg p-2 border border-white/5">
                          {meta.modelsSummary}
                        </div>
                      </div>

                      {/* Bottom Metrics / Action Area */}
                      <div className="pt-3 border-t border-white/5">
                        {provider.configured ? (
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-slate-400">Observed Requests:</span>
                              <span className="text-sm font-bold text-white">
                                {count.toLocaleString()}
                                {isActive && (
                                  <span className="ml-1.5 text-[10px] font-mono text-emerald-400">
                                    ({trafficShare.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Traffic share bar */}
                            {isActive && (
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                  style={{ width: `${Math.max(trafficShare, 4)}%` }}
                                />
                              </div>
                            )}

                            {!isActive && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Ready for routing · 0 observed requests
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Proactive Setup Link (Transforms unconfigured into a helpful action) */
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                              Ready for API key setup
                            </span>
                            <Link
                              href="/admin/settings/ai-provider-credentials"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                            >
                              <span>Configure Key</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Informative Provider Integration Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-blue-950/15 to-transparent backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Expand Multi-Provider Resilience &amp; Economics</p>
                    <p className="text-[11px] text-slate-300">
                      Configure API credentials for DeepSeek (V3/R1), Moonshot Kimi, or Alibaba Qwen to enable low-cost high-reasoning inference.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/settings/ai-provider-credentials"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-sm"
                >
                  <span>LLM Credentials Settings</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            {/* ─── Model Performance Table ─── */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Model Performance &amp; Unit Economics
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Cost per successful task reflects observed cost and reliability based on live telemetry.
                  </p>
                </div>

                {/* Search & Tier Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Filter models..."
                      className="rounded-xl border border-white/10 bg-white/[0.03] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="all" className="bg-slate-900">All Tiers</option>
                    <option value="flagship" className="bg-slate-900">Flagship</option>
                    <option value="reasoning" className="bg-slate-900">Reasoning</option>
                    <option value="fast" className="bg-slate-900">Fast</option>
                    <option value="economy" className="bg-slate-900">Economy</option>
                  </select>
                </div>
              </div>

              {filteredModels.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-xs text-slate-400">
                  No models matched your search or filter. Configure models in{" "}
                  <Link href="/admin/models/registry" className="text-cyan-400 underline">
                    Model Registry
                  </Link>.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121215]/80 shadow-xl backdrop-blur-md">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Model &amp; Provider</th>
                        <th className="px-4 py-3.5">Tier</th>
                        <th className="px-4 py-3.5">Token Price (per MTok)</th>
                        <th className="px-4 py-3.5">Requests</th>
                        <th className="px-4 py-3.5">Success Rate</th>
                        <th className="px-4 py-3.5">Fallback</th>
                        <th className="px-4 py-3.5">Avg Latency</th>
                        <th className="px-5 py-3.5 text-right">Cost / Success</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredModels.map((model) => {
                        const stat = statsByModel.get(`${model.provider}:${model.modelId}`);
                        const tierBadge = getTierBadgeClass(model.qualityTier);

                        return (
                          <tr key={model.key} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-white">{model.label}</p>
                              <p className="text-[11px] font-mono text-slate-400">
                                {model.provider} · <span className="text-slate-500">{model.modelId}</span>
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${tierBadge}`}>
                                {model.qualityTier}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-300">
                              {model.inputUsdPerMillion === null || model.outputUsdPerMillion === null ? (
                                <span className="text-slate-500">Unconfigured</span>
                              ) : (
                                <span>
                                  ${model.inputUsdPerMillion} in / ${model.outputUsdPerMillion} out
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-white">
                              {stat?.requests?.toLocaleString() ?? 0}
                            </td>
                            <td className="px-4 py-3.5">
                              {stat ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold font-mono">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  {formatPercent(stat.successRate)}
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-400">
                              {stat ? formatPercent(stat.fallbackRate) : "—"}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-300">
                              {stat?.avgLatencyMs == null ? "—" : `${stat.avgLatencyMs.toLocaleString()} ms`}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-white">
                              {formatCurrency(stat?.costPerSuccessfulTaskUsd ?? null)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ─── Safe Model Comparison / Benchmark Sandbox ─── */}
            <section className="rounded-3xl border border-white/10 bg-[#121215] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>BENCHMARKING PLAYGROUND</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Safe Multi-Model Comparison Sandbox
                  </h2>
                  <p className="mt-1 max-w-3xl text-xs text-slate-300">
                    Compare up to 5 models using the same synthetic structured-summary task. No real candidate, resume, or conversation data is touched. Benchmark runs are excluded from operational request, token and spend totals.
                  </p>
                </div>

                <div className="text-xs font-mono text-slate-400 shrink-0">
                  Selected: <strong className="text-white">{selectedModels.length}</strong> / 5
                </div>
              </div>

              {/* Model Selection Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {data.config.models
                  .filter((model) => model.enabled)
                  .map((model) => {
                    const isSelected = selectedModels.includes(model.key);
                    return (
                      <button
                        key={model.key}
                        type="button"
                        onClick={() =>
                          setSelectedModels((current) =>
                            isSelected
                              ? current.filter((key) => key !== model.key)
                              : current.length < 5
                              ? [...current, model.key]
                              : current
                          )
                        }
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-500/10"
                            : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-cyan-400" : "bg-slate-600"}`} />
                        <span>{model.label}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">({model.provider})</span>
                      </button>
                    );
                  })}
              </div>

              {/* Trigger Button */}
              <div>
                <button
                  type="button"
                  onClick={() => void runBenchmark()}
                  disabled={!selectedModels.length || benchmarking}
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all shadow-xl shadow-white/10 disabled:opacity-40"
                >
                  {benchmarking ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Running Synthetic Inferences...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Benchmark Selected Models ({selectedModels.length})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Benchmark Results Display */}
              {benchmark.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {benchmark.map((result) => (
                    <article
                      key={result.key}
                      className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white text-sm">{result.label}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {result.provider} · {result.model}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                            result.success && result.schemaPass
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-red-500/30 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {result.success ? (result.schemaPass ? "SCHEMA PASS" : "SCHEMA FAIL") : "FAILED"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/[0.02] border border-white/5 p-3 text-center">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block">Latency</span>
                          <span className="text-xs font-bold text-white font-mono">{result.latencyMs} ms</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block">Tokens</span>
                          <span className="text-xs font-bold text-white font-mono">
                            {result.totalTokens ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block">Cost</span>
                          <span className="text-xs font-bold text-white font-mono">{formatCurrency(result.costUsd)}</span>
                        </div>
                      </div>

                      {result.error && (
                        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 font-mono">
                          {result.error}
                        </p>
                      )}

                      {result.output && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                            Model Synthetic Response:
                          </span>
                          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/60 p-3 text-[11px] font-mono text-slate-300">
                            {result.output}
                          </pre>
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
  );
}
