"use client";
import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";
import Link from "next/link";

interface SourceBreakdownItem {
  source: string;
  count: number;
  pct: number;
}

interface ChannelRoiItem {
  channel: string;
  hiredCount: number;
  totalApps: number;
  conversionRate: number;
}

interface SourceTrackingData {
  totalApplications: number;
  sourceBreakdown: SourceBreakdownItem[];
  channelRoi: ChannelRoiItem[];
  generatedAt: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "Referral (Direct Link)": "#FBBC04",
  "Referral (Email Invite)": "#f59e0b",
  "Referral (Partner)": "#fcd34d",
  "Direct": "#c5221f",
  "LinkedIn": "#0162cf",
  "WhatsApp": "#22c55e",
  "Twitter / X": "#94a3b8",
};

function getColor(source: string, index: number): string {
  const fallbacks = ["#c5221f", "#0162cf", "#FBBC04", "#22c55e", "#94a3b8", "#a78bfa", "#f97316"];
  return SOURCE_COLORS[source] ?? fallbacks[index % fallbacks.length];
}

export default function EmployerSourceTrackingPage() {
  const [data, setData] = useState<SourceTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30" | "90" | "365">("30");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employer/source-tracking?days=${period}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error ?? "Failed to load source data.");
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <PageContainer>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md mb-6">
        <div>
          <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl text-primary leading-tight">
            Source Intelligence
          </h1>
          <p className="font-body-lg text-text-secondary mt-2">
            Candidate quality and recruitment ROI across all acquisition channels.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container flex p-1 rounded-full border border-white/5">
            {(["30", "90", "365"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-4 py-1.5 rounded-full font-medium text-label-md transition-all ${
                  period === d ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {d === "30" ? "Last 30 Days" : d === "90" ? "Quarterly" : "Yearly"}
              </button>
            ))}
          </div>
          <Link
            href="/employer/referrals"
            className="glass-card p-3 rounded-full text-primary hover:bg-white/5 flex items-center justify-center"
            title="Referral Dashboard"
          >
            <span className="material-symbols-outlined">group_add</span>
          </Link>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card p-6 rounded-2xl border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Source Breakdown Chart Card */}
          <div className="md:col-span-8 glass-card p-stack-lg rounded-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-stack-lg h-full">
              <div className="flex-1 w-full flex flex-col">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
                  Application Distribution
                </h3>

                {data.sourceBreakdown.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-3">
                    <span className="material-symbols-outlined text-[40px] opacity-40">bar_chart</span>
                    <p className="text-sm">No application data yet. Source breakdown will appear once candidates apply to your jobs.</p>
                    <Link href="/employer/referrals" className="text-xs text-primary font-bold hover:underline">
                      Start referring partner companies →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.sourceBreakdown.map((item, i) => (
                      <div
                        key={item.source}
                        className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getColor(item.source, i), boxShadow: `0 0 8px ${getColor(item.source, i)}80` }}
                          />
                          <span className="font-body-md text-on-surface">{item.source}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted font-mono">{item.count} apps</span>
                          <span className="font-data-md text-on-surface-variant w-10 text-right">{item.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Donut Chart — dynamic SVG */}
              {data.sourceBreakdown.length > 0 && (
                <div className="relative w-64 h-64 md:w-72 md:h-72 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      let offset = 0;
                      const circumference = 2 * Math.PI * 40;
                      return data.sourceBreakdown.map((item, i) => {
                        const dash = (item.pct / 100) * circumference;
                        const segment = (
                          <circle
                            key={item.source}
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            stroke={getColor(item.source, i)}
                            strokeWidth="12"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += dash;
                        return segment;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display-xl text-[36px] text-on-surface font-bold">
                      {data.totalApplications.toLocaleString()}
                    </span>
                    <span className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
                      Total Apps
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Referral CTA Card */}
          <div className="md:col-span-4 glass-card p-stack-lg rounded-xl border-l-[6px] border-l-red-light flex flex-col">
            <div className="flex items-center gap-3 mb-stack-md">
              <span
                className="material-symbols-outlined text-red-light"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lightbulb
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface">AI Strategy</h3>
            </div>

            {data.sourceBreakdown.length === 0 ? (
              <div className="flex-1 space-y-4">
                <p className="font-body-md text-on-surface-variant leading-relaxed text-sm">
                  Start building your referral network. Referred candidates show{" "}
                  <span className="text-gold-payment font-bold">higher offer acceptance</span> and{" "}
                  <span className="text-primary font-bold">lower cost-per-hire</span> than job board applications.
                </p>
                <Link
                  href="/employer/referrals"
                  className="btn-primary-blue mt-4 w-full flex items-center justify-center gap-2 font-bold h-11 rounded-full text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                  Go to Referral Dashboard
                </Link>
              </div>
            ) : (() => {
              const topSource = data.sourceBreakdown[0];
              const referralItems = data.sourceBreakdown.filter(s => s.source.toLowerCase().includes("referral"));
              const referralPct = referralItems.reduce((sum, s) => sum + s.pct, 0);
              return (
                <div className="space-y-6 flex-1">
                  <p className="font-body-md text-on-surface-variant leading-relaxed text-sm">
                    Your top source is <span className="text-primary font-bold">{topSource.source}</span> at{" "}
                    <span className="text-primary font-bold">{topSource.pct}%</span>.
                    {referralPct > 0 && (
                      <> Referral channels account for <span className="text-gold-payment font-bold">{referralPct}%</span> of applications.</>
                    )}
                  </p>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <span className="font-label-md text-primary uppercase block mb-1 text-xs">Referral Share</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[32px] font-display-xl text-on-surface">{referralPct}%</span>
                      <span className="font-body-md text-green-400 text-sm">of all applications</span>
                    </div>
                  </div>
                  <Link
                    href="/employer/referrals"
                    className="btn-primary-blue w-full flex items-center justify-center gap-2 font-bold h-11 rounded-full text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                    Grow Referral Network
                  </Link>
                </div>
              );
            })()}
          </div>

          {/* Channel ROI Table */}
          {data.channelRoi.length > 0 && (
            <div className="md:col-span-12 glass-card p-stack-lg rounded-xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline-md text-headline-md text-on-surface">Channel Hire Conversion</h3>
                <span className="font-label-md text-on-surface-variant text-xs">Applications → Hired</span>
              </div>
              <div className="space-y-6 py-4">
                {data.channelRoi.map((item) => (
                  <div key={item.channel} className="space-y-2">
                    <div className="flex justify-between text-label-md text-on-surface-variant text-xs">
                      <span>{item.channel}</span>
                      <span>{item.conversionRate}% ({item.hiredCount}/{item.totalApps})</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(item.conversionRate, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data freshness footer */}
          <div className="md:col-span-12 text-right">
            <span className="text-[10px] text-text-muted">
              Data as of {new Date(data.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
