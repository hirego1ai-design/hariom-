"use client";

import { useEffect, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Service = {
  name: string;
  type: string;
  provider: string;
  status: string;
  latencyMs?: number;
  details?: string;
};

export default function AdminCommandCentrePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [overallStatus, setOverallStatus] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/system-health", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load system health.");
        setServices(Array.isArray(payload.services) ? payload.services : []);
        setOverallStatus(payload.overallStatus || "UNKNOWN");
        setTimestamp(payload.timestamp || "");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load system health."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="AI & System Command Centre"
        subtitle="Live infrastructure facts only. Simulated executive agents and fabricated activity states have been removed."
      />

      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading system health…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

      {!loading && !error && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Overall system status</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{overallStatus}</p>
            <p className="mt-2 text-xs text-text-muted">{timestamp ? `Observed ${new Date(timestamp).toLocaleString()}` : "Observation time unavailable"}</p>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={`${service.type}-${service.name}`} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold text-white">{service.name}</p><p className="mt-1 text-xs text-text-muted">{service.provider} · {service.type}</p></div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-text-secondary">{service.status}</span>
                </div>
                {typeof service.latencyMs === "number" && <p className="mt-3 text-xs text-text-secondary">Observed latency: {service.latencyMs} ms</p>}
                <p className="mt-3 text-xs leading-relaxed text-text-muted">{service.details || "No additional health detail is available."}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-xs text-text-muted">
            Agent business-process activity is not represented as “live” unless an authoritative agent-runtime telemetry endpoint is available.
          </section>
        </div>
      )}
    </PageContainer>
  );
}
