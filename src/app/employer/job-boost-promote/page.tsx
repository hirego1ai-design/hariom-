"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Job = {
  id: string;
  title: string;
  department?: string | null;
  location: string;
  status: string;
  matchingConfig?: {
    isBoosted?: boolean;
    boostTier?: string;
    boostName?: string;
    boostExpiresAt?: string;
  } | null;
};

const BOOST_TIERS = [
  {
    id: "boost_7d",
    name: "Standard 7-Day Boost",
    days: 7,
    price: 1499,
    description: "Top ranking in search & candidate recommendation feed for 7 days",
    badge: "Popular",
  },
  {
    id: "boost_14d",
    name: "High-Visibility 14-Day Boost",
    days: 14,
    price: 2499,
    description: "Priority placement, candidate email digest highlight, and feed pin for 14 days",
    badge: "Best Value",
  },
  {
    id: "boost_30d",
    name: "Executive 30-Day Boost",
    days: 30,
    price: 4499,
    description: "Maximum reach with sponsored badge, AI candidate matching priority, and talent spotlight for 30 days",
    badge: "Maximum Impact",
  },
];

export default function JobBoostPromotePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("boost_7d");
  const [boosting, setBoosting] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/employer/jobs");
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load jobs.");
      const list = Array.isArray(data.jobs) ? data.jobs : [];
      setJobs(list);
      if (list.length > 0 && !selectedJobId) {
        setSelectedJobId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleBoost = async () => {
    if (!selectedJobId) {
      setError("Please select a job listing to boost.");
      return;
    }
    setBoosting(true);
    setError("");
    setSuccessNotice("");
    try {
      const response = await fetch(`/api/employer/jobs/${encodeURIComponent(selectedJobId)}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: selectedTierId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to boost job listing.");
      setSuccessNotice(data.message || "Job boosted successfully!");
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to boost job.");
    } finally {
      setBoosting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Job Boost & Promotion"
        subtitle="Accelerate hiring by giving your job listings top visibility, candidate feed priority, and sponsored badges."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {successNotice && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {successNotice}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading your job listings…</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-slate-300">You do not have any job listings yet.</p>
          <Link
            href="/employer/create-job-basic-info"
            className="mt-4 inline-block rounded-xl btn-3d-red px-5 py-2.5 text-xs font-bold text-white"
          >
            Create Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="glass-card rounded-2xl border border-white/10 p-6">
            <h2 className="text-base font-bold text-white">1. Select Job to Promote</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const config = job.matchingConfig;
                const isBoosted = Boolean(config?.isBoosted && config?.boostExpiresAt && new Date(config.boostExpiresAt) > new Date());
                const isSelected = selectedJobId === job.id;

                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-red-500/80 bg-red-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{job.department || "General"}</span>
                      {isBoosted && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          Active Boost
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-bold text-white">{job.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{job.location} • {job.status}</p>
                    {isBoosted && config?.boostExpiresAt && (
                      <p className="mt-2 text-[10px] text-amber-300/80">
                        Expires: {new Date(config.boostExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass-card rounded-2xl border border-white/10 p-6">
            <h2 className="text-base font-bold text-white">2. Select Boost Package</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-3">
              {BOOST_TIERS.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`relative cursor-pointer rounded-2xl border p-6 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-red-500 bg-red-500/10 ring-1 ring-red-500"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                          {tier.badge}
                        </span>
                        <span className="text-xs text-slate-400">{tier.days} Days</span>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-white">{tier.name}</h3>
                      <p className="mt-2 text-2xl font-extrabold text-primary">₹{tier.price}</p>
                      <p className="mt-3 text-xs text-slate-400 leading-relaxed">{tier.description}</p>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedTierId(tier.id)}
                        className="accent-primary"
                      />
                      <span className="text-xs font-semibold text-white">
                        {isSelected ? "Selected Tier" : "Choose this tier"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleBoost}
              disabled={boosting || !selectedJobId}
              className="rounded-xl btn-3d-red px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {boosting ? "Processing Boost…" : "Activate Boost Now"}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
