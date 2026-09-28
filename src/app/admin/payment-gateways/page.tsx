"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type GatewayName = "STRIPE" | "PAYU";
type GatewayStatus = "HEALTHY" | "DEGRADED" | "DISABLED";
type GatewayConfig = {
  mode: "AUTO" | "MANUAL";
  primaryGateway: GatewayName;
  autoFailover: boolean;
  allowEmployerSelection: boolean;
  gatewaysStatus: Record<GatewayName, GatewayStatus>;
  priorities: GatewayName[];
};

const GATEWAYS: GatewayName[] = ["STRIPE", "PAYU"];

const statusLabel: Record<GatewayStatus, string> = {
  HEALTHY: "ENABLED",
  DEGRADED: "LIMITED",
  DISABLED: "DISABLED",
};

const statusClass: Record<GatewayStatus, string> = {
  HEALTHY: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
  DEGRADED: "border-amber-500/20 bg-amber-500/15 text-amber-300",
  DISABLED: "border-red-500/20 bg-red-500/15 text-red-300",
};

const initialConfig: GatewayConfig = {
  mode: "AUTO",
  primaryGateway: "STRIPE",
  autoFailover: false,
  allowEmployerSelection: false,
  gatewaysStatus: {
    STRIPE: "DISABLED",
    PAYU: "DISABLED",
  },
  priorities: ["STRIPE", "PAYU"],
};

export default function AdminPaymentGatewaysPage() {
  const [config, setConfig] = useState<GatewayConfig>(initialConfig);
  const [configUpdatedAt, setConfigUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmAllDisabled, setConfirmAllDisabled] = useState(false);

  const enabledGateways = useMemo(
    () => GATEWAYS.filter((gateway) => config.gatewaysStatus[gateway] !== "DISABLED"),
    [config.gatewaysStatus],
  );
  const allDisabled = enabledGateways.length === 0;

  async function fetchConfig() {
    setLoading(true);
    setConfigLoaded(false);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payment-gateway/config", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.config) {
        throw new Error(payload.error || "Unable to load gateway configuration.");
      }
      setConfig(payload.config);
      setConfigUpdatedAt(typeof payload.updatedAt === "string" ? payload.updatedAt : null);
      setConfigLoaded(true);
    } catch (error) {
      setConfigLoaded(false);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load gateway configuration.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchConfig();
  }, []);

  async function persistConfiguration() {
    if (!configLoaded || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payment-gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          expectedUpdatedAt: configUpdatedAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.config) {
        throw new Error(payload.error || "Unable to save gateway configuration.");
      }

      setConfig(payload.config);
      setConfigUpdatedAt(typeof payload.updatedAt === "string" ? payload.updatedAt : null);
      setConfirmAllDisabled(false);
      setMessage({ type: "success", text: "Payment routing configuration saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save gateway configuration.",
      });
    } finally {
      setSaving(false);
    }
  }

  function requestSave() {
    if (!configLoaded) {
      setMessage({
        type: "error",
        text: "Gateway configuration must load from the server before it can be changed.",
      });
      return;
    }
    if (allDisabled) {
      setConfirmAllDisabled(true);
      return;
    }
    void persistConfiguration();
  }

  function toggleGatewayStatus(gateway: GatewayName) {
    if (!configLoaded) return;
    const current = config.gatewaysStatus[gateway] ?? "DISABLED";
    const next: GatewayStatus =
      current === "HEALTHY"
        ? "DEGRADED"
        : current === "DEGRADED"
          ? "DISABLED"
          : "HEALTHY";
    const gatewaysStatus = { ...config.gatewaysStatus, [gateway]: next };
    const enabled = GATEWAYS.filter((name) => gatewaysStatus[name] !== "DISABLED");

    setMessage(null);
    setConfig((currentConfig) => ({
      ...currentConfig,
      gatewaysStatus,
      primaryGateway:
        gatewaysStatus[currentConfig.primaryGateway] === "DISABLED" && enabled.length > 0
          ? enabled[0]
          : currentConfig.primaryGateway,
    }));
  }

  function movePriority(gateway: GatewayName, direction: -1 | 1) {
    setConfig((current) => {
      const index = current.priorities.indexOf(gateway);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.priorities.length) return current;
      const priorities = [...current.priorities];
      [priorities[index], priorities[nextIndex]] = [priorities[nextIndex], priorities[index]];
      return { ...current, priorities };
    });
  }

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Payment Gateway Control"
          subtitle="Stripe and PayU routing policy. Routing states are not live provider-health measurements."
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          {message && (
            <div
              role={message.type === "error" ? "alert" : "status"}
              aria-live={message.type === "error" ? "assertive" : "polite"}
              className={`rounded-xl border px-4 py-3 text-sm ${
                message.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#16161B] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#448AFF]">Routing policy</p>
                <h1 className="mt-1 text-2xl font-extrabold">Stripe + PayU</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Enabled/Limited/Disabled are administrator routing states. They do not claim that a provider is currently reachable or healthy.
                </p>
              </div>
              <button
                type="button"
                onClick={requestSave}
                disabled={saving || loading || !configLoaded}
                className="rounded-xl bg-[#448AFF] px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-[#2979FF] disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          </section>

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#16161B] p-10 text-center text-sm text-slate-400">
              Loading authoritative payment routing configuration…
            </div>
          ) : !configLoaded ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              <p className="font-bold">Authoritative payment routing configuration is unavailable.</p>
              <p className="mt-2 text-red-200/80">No local fallback can be edited or saved.</p>
              <button
                type="button"
                onClick={() => void fetchConfig()}
                className="mt-4 rounded-xl border border-red-300/30 px-4 py-2 text-xs font-bold hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {allDisabled && (
                <div role="status" className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                  All payment gateways are disabled. New paid checkouts will fail closed until at least one route is enabled.
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <section className="space-y-6 rounded-2xl border border-white/10 bg-[#16161B] p-5" aria-labelledby="routing-controller-heading">
                  <h2 id="routing-controller-heading" className="text-lg font-bold">Routing controller</h2>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Mode</p>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                      {(["AUTO", "MANUAL"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={config.mode === mode}
                          onClick={() => setConfig((current) => ({ ...current, mode }))}
                          className={`rounded-lg py-2 font-bold transition ${
                            config.mode === mode ? "bg-[#448AFF] text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {mode === "AUTO" ? "Auto priority" : "Manual fixed"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Primary gateway
                    <select
                      aria-label="Primary payment gateway"
                      disabled={allDisabled}
                      value={allDisabled ? "" : config.primaryGateway}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          primaryGateway: event.target.value as GatewayName,
                        }))
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {allDisabled && <option value="">No enabled gateway</option>}
                      {enabledGateways.map((gateway) => (
                        <option key={gateway} value={gateway}>{gateway}</option>
                      ))}
                    </select>
                  </label>

                  <div className="space-y-3 border-t border-white/10 pt-4 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">Auto failover</p>
                        <p className="mt-1 text-[10px] text-slate-400">Try the next enabled route only after a non-ambiguous creation failure.</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Toggle automatic payment gateway failover"
                        aria-pressed={config.autoFailover}
                        onClick={() => setConfig((current) => ({ ...current, autoFailover: !current.autoFailover }))}
                        className={`h-7 w-12 rounded-full p-1 transition ${config.autoFailover ? "bg-emerald-500" : "bg-white/10"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${config.autoFailover ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">Employer selection</p>
                        <p className="mt-1 text-[10px] text-slate-400">Allow checkout to request an enabled provider.</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Toggle employer payment gateway selection"
                        aria-pressed={config.allowEmployerSelection}
                        onClick={() => setConfig((current) => ({ ...current, allowEmployerSelection: !current.allowEmployerSelection }))}
                        className={`h-7 w-12 rounded-full p-1 transition ${config.allowEmployerSelection ? "bg-emerald-500" : "bg-white/10"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${config.allowEmployerSelection ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-3" aria-labelledby="gateway-priority-heading">
                  <div>
                    <h2 id="gateway-priority-heading" className="text-lg font-bold">Provider routing state & priority</h2>
                    <p className="mt-1 text-xs text-slate-400">Priority affects AUTO mode. Use Enabled/Limited only when that route is approved for checkout traffic.</p>
                  </div>

                  {config.priorities.map((gateway, index) => {
                    const status = config.gatewaysStatus[gateway] ?? "DISABLED";
                    return (
                      <article key={gateway} className="rounded-2xl border border-white/10 bg-[#16161B] p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-black text-slate-400">#{index + 1}</span>
                              <h3 className="font-mono text-base font-extrabold">{gateway}</h3>
                              {config.primaryGateway === gateway && !allDisabled && (
                                <span className="rounded-full border border-[#448AFF]/30 bg-[#448AFF]/20 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#448AFF]">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                              Administrative routing state: {statusLabel[status]}. No live provider-health assertion is made here.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => movePriority(gateway, -1)}
                              disabled={index === 0}
                              aria-label={`Move ${gateway} earlier in payment priority`}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => movePriority(gateway, 1)}
                              disabled={index === config.priorities.length - 1}
                              aria-label={`Move ${gateway} later in payment priority`}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleGatewayStatus(gateway)}
                              aria-label={`Change ${gateway} routing state; currently ${statusLabel[status]}`}
                              className={`rounded-full border px-3 py-2 text-xs font-extrabold ${statusClass[status]}`}
                            >
                              {statusLabel[status]}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      {confirmAllDisabled && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="disable-all-gateways-title" className="w-full max-w-md rounded-2xl border border-red-400/25 bg-[#151519] p-6 shadow-2xl">
            <h2 id="disable-all-gateways-title" className="text-lg font-extrabold">Disable all payment gateways?</h2>
            <p className="mt-2 text-sm text-slate-400">
              This is an emergency/maintenance state. New paid checkouts will fail closed until a gateway is enabled again.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAllDisabled(false)}
                disabled={saving}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void persistConfiguration()}
                disabled={saving}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {saving ? "Saving…" : "Confirm maintenance state"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
