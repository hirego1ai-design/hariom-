"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  copilotEnabled: boolean;
  copilotActivatedAt?: string | null;
  _count?: { applications: number };
};

type CopilotState = {
  jobs: Job[];
  copilotJobsLeft: number;
  config?: {
    enabled: boolean;
    title: string;
    description: string;
    benefits: string[];
  } | null;
};

export default function AiHiringCopilotHubPage() {
  const [state, setState] = useState<CopilotState>({ jobs: [], copilotJobsLeft: 0 });
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/employer/copilot", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to load Co-Pilot.");
      setState({ jobs: body.jobs || [], copilotJobsLeft: body.copilotJobsLeft || 0, config: body.config || null });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load Co-Pilot.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function activate(jobId: string) {
    setBusyJobId(jobId);
    setError(null);
    try {
      const response = await fetch("/api/employer/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to activate Co-Pilot.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to activate Co-Pilot.");
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#080b18] text-white px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(44,188,255,.25),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(122,71,255,.22),transparent_30%),linear-gradient(135deg,#111a38,#0a1024)] p-7 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,.45)]">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.18em] text-cyan-200">
                HireGo Co-Pilot
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                AI-assisted workflow support, with your team in control.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Activate Co-Pilot on an eligible live job. HireGo can help coordinate candidate prioritisation,
                assessments, interviews, reminders and next-step guidance. Consequential hiring decisions remain human-approved.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[.06] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_50px_rgba(0,0,0,.35)] backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-400">Available activations</p>
              <p className="mt-2 text-5xl font-black text-cyan-300">{state.copilotJobsLeft}</p>
              <p className="mt-2 text-sm text-slate-300">Co-Pilot job entitlement{state.copilotJobsLeft === 1 ? "" : "s"} remaining</p>
              <Link href="/employer/subscriptions" className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950">
                View plans & add-ons
              </Link>
            </div>
          </div>
        </section>

        {state.config?.benefits?.length ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {state.config.benefits.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 shadow-[0_16px_35px_rgba(0,0,0,.25)]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">✦</div>
                <p className="text-sm font-bold">{benefit}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Your active jobs</h2>
              <p className="mt-1 text-sm text-slate-400">Choose where Co-Pilot should assist.</p>
            </div>
          </div>
          {error ? <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[.04] p-10 text-center text-slate-400">Loading live job data…</div>
          ) : state.jobs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[.04] p-10 text-center">
              <p className="font-bold">No active jobs available.</p>
              <Link href="/employer/create-job-basic-info" className="mt-4 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">Create a job</Link>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {state.jobs.map(job => (
                <article key={job.id} className={`relative overflow-hidden rounded-[26px] border p-5 transition ${job.copilotEnabled ? "border-cyan-300/30 bg-cyan-300/[.07]" : "border-white/10 bg-white/[.04]"}`}>
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{job._count?.applications ?? 0} applicants</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${job.copilotEnabled ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>
                        {job.copilotEnabled ? "Co-Pilot active" : "Manual workflow"}
                      </span>
                    </div>
                    {job.expiresAt ? <p className="mt-4 text-xs text-slate-400">Job valid until {new Date(job.expiresAt).toLocaleDateString()}</p> : null}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {job.copilotEnabled ? (
                        <>
                          <Link href="/employer/hiring-pipeline" className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950">Open hiring pipeline</Link>
                          <Link href="/employer/interview-scheduler" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold">Interviews</Link>
                        </>
                      ) : (
                        <button
                          onClick={() => void activate(job.id)}
                          disabled={busyJobId === job.id || state.copilotJobsLeft < 1}
                          className="rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busyJobId === job.id ? "Activating…" : state.copilotJobsLeft > 0 ? "Activate Co-Pilot" : "Co-Pilot entitlement required"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
