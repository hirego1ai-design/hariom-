import Link from "next/link";

export default function LlmUsageMonitorPage() {
  return (
    <div className="space-y-6 text-text-primary">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
        <h1 className="text-2xl font-bold text-white">LLM Usage & Cost Analytics</h1>
        <p className="mt-3 text-sm text-text-secondary">
          Live provider token usage, spend, latency, and feature-level cost attribution are not displayed because no authoritative usage-metering API is connected to this screen.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Static provider names, token volumes, model costs, request counts, latency figures, budget percentages, and “Optimal/Active” status indicators have been removed.
        </p>
        <Link href="/admin/system-health" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">
          Open system health
        </Link>
      </div>
    </div>
  );
}
