"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Agent = {
  agentId: string;
  name: string;
  description: string;
  allowedTools: string[];
  taskType: string | null;
  status: "DETERMINISTIC_NO_LLM" | "PAUSED" | "UNCONFIGURED" | "BLOCKED_CONFIGURATION" | "READY";
  pausedReason: string | null;
  routing: null | {
    mode: string;
    primary: null | {
      key: string;
      label: string;
      provider: string;
      modelId: string;
      enabled: boolean;
      providerConfigured: boolean;
    };
    fallbacks: Array<{
      key: string;
      label: string;
      provider: string;
      modelId: string;
      enabled: boolean;
      providerConfigured: boolean;
    }>;
    timeoutMs: number;
    maxTokens: number;
    maxCostUsdPerRequest: number | null;
  };
  telemetry: {
    requests: number;
    successes: number;
    failures: number;
    fallbackCount: number;
    successRate: number | null;
    fallbackRate: number | null;
    avgLatencyMs: number | null;
    totalTokens: number;
    observedCostUsd: number;
    costPerSuccessfulTaskUsd: number | null;
    lastSuccess: string | null;
    lastFailure: string | null;
    lastError: string | null;
    lastErrorNote: string | null;
  };
};

type Service = {
  name: string;
  type: string;
  provider: string;
  status: string;
  latencyMs?: number;
  details?: string;
};

function percent(value: number | null) {
  return value === null ? "No data" : `${(value * 100).toFixed(1)}%`;
}

function money(value: number | null) {
  return value === null ? "No data" : `$${value.toFixed(value < 0.01 ? 6 : 4)}`;
}

function statusClass(status: Agent["status"]) {
  if (status === "READY") return "border-green-500/30 text-green-300";
  if (status === "DETERMINISTIC_NO_LLM") return "border-sky-500/30 text-sky-300";
  if (status === "PAUSED") return "border-red-500/30 text-red-300";
  return "border-amber-500/30 text-amber-300";
}

export default function AdminCommandCentrePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [overallStatus, setOverallStatus] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [routingConfigVersion, setRoutingConfigVersion] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [agentResponse, healthResponse] = await Promise.all([
        fetch("/api/admin/ai-agents", { cache: "no-store" }),
        fetch("/api/admin/system-health", { cache: "no-store" }),
      ]);
      const [agentPayload, healthPayload] = await Promise.all([
        agentResponse.json(),
        healthResponse.json(),
      ]);
      if (!agentResponse.ok || !agentPayload.success) {
        throw new Error(agentPayload.error || "Unable to load AI agent control data.");
      }
      if (!healthResponse.ok || !healthPayload.success) {
        throw new Error(healthPayload.error || "Unable to load system health.");
      }
      setAgents(Array.isArray(agentPayload.agents) ? agentPayload.agents : []);
      setRoutingConfigVersion(
        typeof agentPayload.routingConfigVersion === "number"
          ? agentPayload.routingConfigVersion
          : null,
      );
      setServices(Array.isArray(healthPayload.services) ? healthPayload.services : []);
      setOverallStatus(healthPayload.overallStatus || "UNKNOWN");
      setTimestamp(healthPayload.timestamp || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load AI Control Centre.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="AI Control Centre" />
        <main className="flex-1 p-gutter pt-24 pb-12 max-w-[1500px] w-full mx-auto space-y-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Authoritative runtime control</p>
              <h1 className="text-3xl font-extrabold text-white">AI Agent & Model Control Centre</h1>
              <p className="max-w-4xl text-sm text-text-muted">
                Agent identity comes from the runtime AgentRegistry. Model routing and cost policy come from the same Admin configuration used by production requests. Empty telemetry stays empty; no activity is simulated.
              </p>
              <p className="text-xs text-text-muted">
                Routing config version: {routingConfigVersion ?? "Unavailable"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/models/registry" className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-black">
                Change model routing
              </Link>
              <Link href="/admin/settings/llm-usage" className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white">
                Usage & benchmark
              </Link>
              <button type="button" onClick={() => void load()} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white">
                Refresh
              </button>
            </div>
          </header>

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">
              Loading authoritative agent and system state…
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Registered agents</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Deterministic agents intentionally show no model. LLM agents show their exact current primary/fallback configuration.
                  </p>
                </div>

                {agents.length === 0 ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-text-muted">
                    No runtime agents are registered.
                  </div>
                ) : (
                  <div className="grid gap-5 xl:grid-cols-2">
                    {agents.map((agent) => (
                      <article key={agent.agentId} className="rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{agent.agentId}</p>
                            <h3 className="mt-1 text-lg font-bold text-white">{agent.name}</h3>
                            <p className="mt-2 text-xs leading-relaxed text-text-muted">{agent.description}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${statusClass(agent.status)}`}>
                            {agent.status.replaceAll("_", " ")}
                          </span>
                        </div>

                        {agent.pausedReason && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
                            {agent.pausedReason}
                          </div>
                        )}

                        {agent.routing ? (
                          <div className="rounded-2xl border border-white/10 bg-black/15 p-4 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div><p className="text-[10px] uppercase text-text-muted">Task</p><p className="mt-1 text-xs font-bold text-white">{agent.taskType}</p></div>
                              <div><p className="text-[10px] uppercase text-text-muted">Mode</p><p className="mt-1 text-xs font-bold text-white">{agent.routing.mode}</p></div>
                              <div><p className="text-[10px] uppercase text-text-muted">Max cost/request</p><p className="mt-1 text-xs font-bold text-white">{money(agent.routing.maxCostUsdPerRequest)}</p></div>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase text-text-muted">Primary model</p>
                              {agent.routing.primary ? (
                                <p className="mt-1 text-sm font-bold text-white">
                                  {agent.routing.primary.label}
                                  <span className="ml-2 text-xs font-normal text-text-muted">
                                    {agent.routing.primary.provider} · {agent.routing.primary.modelId}
                                  </span>
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-amber-300">No primary model selected</p>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] uppercase text-text-muted">Fallback chain</p>
                              <p className="mt-1 text-xs text-text-secondary">
                                {agent.routing.fallbacks.length
                                  ? agent.routing.fallbacks.map((model) => `${model.label} (${model.provider})`).join(" → ")
                                  : "No fallback configured"}
                              </p>
                            </div>

                            <p className="text-[11px] text-text-muted">
                              Timeout {agent.routing.timeoutMs} ms · max output {agent.routing.maxTokens} tokens
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-text-muted">
                            This registered agent currently uses deterministic application logic and has no LLM route.
                          </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                          <div><p className="text-[10px] text-text-muted">Requests</p><p className="mt-1 text-sm font-bold text-white">{agent.telemetry.requests}</p></div>
                          <div><p className="text-[10px] text-text-muted">Success</p><p className="mt-1 text-sm font-bold text-white">{percent(agent.telemetry.successRate)}</p></div>
                          <div><p className="text-[10px] text-text-muted">Fallback</p><p className="mt-1 text-sm font-bold text-white">{percent(agent.telemetry.fallbackRate)}</p></div>
                          <div><p className="text-[10px] text-text-muted">Avg latency</p><p className="mt-1 text-sm font-bold text-white">{agent.telemetry.avgLatencyMs === null ? "No data" : `${agent.telemetry.avgLatencyMs} ms`}</p></div>
                          <div><p className="text-[10px] text-text-muted">Observed cost</p><p className="mt-1 text-sm font-bold text-white">{money(agent.telemetry.observedCostUsd)}</p></div>
                          <div><p className="text-[10px] text-text-muted">Cost / success</p><p className="mt-1 text-sm font-bold text-white">{money(agent.telemetry.costPerSuccessfulTaskUsd)}</p></div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-text-muted">
                          <p>Last success: {agent.telemetry.lastSuccess ? new Date(agent.telemetry.lastSuccess).toLocaleString() : "No recorded success"}</p>
                          <p>Last failure: {agent.telemetry.lastFailure ? new Date(agent.telemetry.lastFailure).toLocaleString() : "No recorded failure"}</p>
                        </div>
                        {agent.telemetry.lastErrorNote && (
                          <p className="text-[11px] text-text-muted">{agent.telemetry.lastErrorNote}</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Infrastructure health</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Overall status: {overallStatus || "UNKNOWN"}{timestamp ? ` · observed ${new Date(timestamp).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <article key={`${service.type}-${service.name}`} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">{service.name}</p>
                          <p className="mt-1 text-xs text-text-muted">{service.provider} · {service.type}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-text-secondary">{service.status}</span>
                      </div>
                      {typeof service.latencyMs === "number" && <p className="mt-3 text-xs text-text-secondary">Observed latency: {service.latencyMs} ms</p>}
                      <p className="mt-3 text-xs leading-relaxed text-text-muted">{service.details || "No additional health detail is available."}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
