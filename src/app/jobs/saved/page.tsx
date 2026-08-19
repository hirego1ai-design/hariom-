"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SavedJobItem {
  id: string;
  jobId: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    company?: { name: string; logoUrl?: string; location?: string };
    location?: string;
    salaryRange?: string;
    type?: string;
    description?: string;
  } | null;
  unavailable?: boolean;
}

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidate/saved-jobs")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load saved jobs");
        return data;
      })
      .then((data) => {
        if (data.success && data.savedJobs) {
          setSavedJobs(data.savedJobs);
          setLoadError(data.warning || null);
        }
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Unable to load saved jobs"))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (jobId: string) => {
    const previous = savedJobs;
    setSavedJobs((prev) => prev.filter((item) => item.jobId !== jobId));
    try {
      const response = await fetch(`/api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Unable to remove saved job");
    } catch {
      setSavedJobs(previous);
      setMessage("Could not remove this job. Please try again.");
    }
  };

  const handleApply = async (jobId: string, title: string) => {
    if (appliedJobs.includes(jobId)) return;
    setAppliedJobs((prev) => [...prev, jobId]);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!response.ok) throw new Error("Application failed");
      setMessage(`Application submitted for ${title}!`);
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setAppliedJobs((prev) => prev.filter((id) => id !== jobId));
      setMessage(`Could not submit the application for ${title}. Please try again.`);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const filtered = savedJobs.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Remote") return item.job?.location?.toLowerCase().includes("remote");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />

      <main className="flex-1 ml-[100px] lg:ml-[116px] p-6 lg:p-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-primary mb-2">
              Saved Jobs
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your bookmarked opportunities and track application statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {["All", "Remote"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === tab
                    ? "bg-primary text-white shadow-md"
                    : "bg-white/5 hover:bg-white/10 text-text-secondary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-xs text-green-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        {loadError && (
          <div role="alert" className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-xs text-yellow-300">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl border border-white/10 p-8">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-3">
              bookmark_border
            </span>
            <h3 className="text-lg font-bold text-text-primary mb-1">No saved jobs yet</h3>
            <p className="text-xs text-text-secondary mb-6">
              Browse recommended opportunities and bookmark roles you want to apply for later.
            </p>
            <Link
              href="/jobs"
              className="btn-3d-red inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Explore Jobs</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => {
              const isApplied = appliedJobs.includes(item.jobId);
              return (
                <div
                  key={item.id}
                  className="glass-card p-5 lg:p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2">
                      <span className="material-symbols-outlined text-primary text-[28px]">
                        work
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                        {item.job?.title || "Saved job details unavailable"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-1">
                        {item.job ? (
                          <>
                            <span>{item.job.company?.name || "Company not provided"}</span>
                            <span>•</span>
                            <span>{item.job.location || "Location not provided"}</span>
                            {item.job.salaryRange && <><span>•</span><span className="text-primary font-bold">{item.job.salaryRange}</span></>}
                          </>
                        ) : <span>Reconnect the database to load this job.</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleRemove(item.jobId)}
                      title="Remove from saved"
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400 flex items-center justify-center transition-all border border-white/5"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        bookmark
                      </span>
                    </button>

                    <button
                      onClick={() => handleApply(item.jobId, item.job?.title || "this role")}
                      disabled={isApplied || !item.job}
                      className={`h-10 px-6 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isApplied
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "btn-3d-red text-white shadow-md hover:scale-[1.02]"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <span>Apply Now</span>
                          <span className="material-symbols-outlined text-[16px]">
                            arrow_forward
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
