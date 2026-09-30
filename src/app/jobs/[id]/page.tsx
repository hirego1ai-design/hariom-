"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import MarketingNav from "@/components/marketing/MarketingNav";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface JobDetail {
  id: string;
  title: string;
  department?: string;
  location: string;
  type: string;
  workMode: string;
  experienceLevel: string;
  numberOfOpenings: number;
  salaryRange?: string;
  description: string;
  requirements?: string[];
  company?: {
    name: string;
    logoUrl?: string;
    description?: string;
    location?: string;
  };
  createdAt?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [isApplying, setIsApplying] = useState(false);
  const [candidateAuthenticated, setCandidateAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!jobId) return;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return null;
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Account state is unavailable.");
        return data;
      })
      .then((data) => {
        setCandidateAuthenticated(data?.user?.role === "CANDIDATE");
      })
      .catch(() => {
        setCandidateAuthenticated(false);
      });

    // Fetch live job details
    fetch(`/api/jobs/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.job) {
          setJob(data.job);
        } else throw new Error(data.error || "Job listing not found.");
      })
      .catch((cause) => {
        setFeedbackType("error");
        setFeedbackMessage(cause instanceof Error ? cause.message : "Job listing could not be loaded.");
      })
      .finally(() => setLoading(false));

    // Load candidate-specific state only when authenticated as a candidate.
    fetch("/api/candidate/saved-jobs", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) return null;
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Saved-job state is unavailable.");
        return data;
      })
      .then((data) => {
        if (data?.savedJobs) {
          const exists = data.savedJobs.some((s: any) => s.jobId === jobId);
          setIsSaved(exists);
        }
      })
      .catch((cause) => {
        setFeedbackType("error");
        setFeedbackMessage(cause instanceof Error ? cause.message : "Saved-job state is unavailable.");
      });

    fetch("/api/applications", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) return null;
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Application state is unavailable.");
        return data;
      })
      .then((data) => {
        if (Array.isArray(data?.applications)) {
          setIsApplied(data.applications.some((application: any) => application.jobId === jobId));
        }
      })
      .catch((cause) => {
        setFeedbackType("error");
        setFeedbackMessage(cause instanceof Error ? cause.message : "Application state is unavailable.");
      });
  }, [jobId]);

  const handleApply = async () => {
    if (!jobId || isApplied || isApplying) return;
    setIsApplying(true);
    setFeedbackMessage(null);
    setFeedbackType("success");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`);
        return;
      }

      if (response.status === 202 && data.success && data.assessmentRequired && data.noticeUrl) {
        router.push(data.noticeUrl);
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Application could not be submitted.");
      }

      setIsApplied(true);
      if (data.assessmentRequired && data.assessmentType === "JOB_SPECIFIC_ASSESSMENT" && data.assessmentUrl) {
        router.push(data.assessmentUrl);
        return;
      }
      setFeedbackType("success");
      setFeedbackMessage("Application submitted successfully.");
    } catch (cause) {
      setFeedbackType("error");
      setFeedbackMessage(cause instanceof Error ? cause.message : "Application could not be submitted.");
      setIsApplying(false);
    }
  };

  const handleToggleSave = async () => {
    if (!jobId) return;
    const nextState = !isSaved;
    try {
      const response = nextState
        ? await fetch("/api/candidate/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        })
        : await fetch(`/api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)}`, {
          method: "DELETE",
        });
      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not update saved jobs.");
      setIsSaved(nextState);
      setFeedbackType("success");
      setFeedbackMessage(nextState ? "Job saved." : "Job removed from saved jobs.");
    } catch (cause) {
      setFeedbackType("error");
      setFeedbackMessage(cause instanceof Error ? cause.message : "Could not update saved jobs.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
        {candidateAuthenticated === true ? <CandidateSidebar /> : candidateAuthenticated === false ? <MarketingNav /> : null}
        <main className={`flex-1 p-8 flex items-center justify-center ${candidateAuthenticated === true ? "md:ml-[116px]" : candidateAuthenticated === false ? "pt-28 sm:pt-32" : ""}`}>
          <div className="text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-xs text-text-secondary">Loading opportunity details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
        {candidateAuthenticated === true ? <CandidateSidebar /> : candidateAuthenticated === false ? <MarketingNav /> : null}
        <main className={`flex-1 p-8 flex items-center justify-center ${candidateAuthenticated === true ? "md:ml-[116px]" : candidateAuthenticated === false ? "pt-28 sm:pt-32" : ""}`}>
          <div className="glass-card max-w-md p-8 rounded-3xl border border-white/10 text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-primary">work_off</span>
            <h1 className="text-lg font-bold">Job listing unavailable</h1>
            <p className="text-sm text-text-secondary">{feedbackMessage || "This listing may have closed or been removed."}</p>
            <Link href="/jobs" className="inline-flex px-5 py-2.5 rounded-xl btn-3d-red text-xs font-bold text-white">Back to job search</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      {candidateAuthenticated === true ? <CandidateSidebar /> : candidateAuthenticated === false ? <MarketingNav /> : null}

      <main className={`flex-1 w-full p-4 sm:p-6 lg:p-10 max-w-6xl ${candidateAuthenticated === true ? "md:ml-[116px] pb-24 md:pb-10" : candidateAuthenticated === false ? "mx-auto pt-28 sm:pt-32" : "mx-auto"}`}>
        {/* Top Back Link */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary mb-6 transition-colors font-bold"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Job Search</span>
        </Link>

        {feedbackMessage && (
          <div
            role={feedbackType === "error" ? "alert" : "status"}
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2 ${
              feedbackType === "error"
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : "bg-green-500/10 border border-green-500/30 text-green-400"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{feedbackType === "error" ? "error" : "check_circle"}</span>
            <span>{feedbackMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Card */}
            <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3">
                  <span className="material-symbols-outlined text-primary text-[36px]">
                    business
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-text-primary mb-1">
                    {job.title}
                  </h1>
                  <p className="text-xs text-text-secondary">
                    {job.company?.name || "Company name not available"} • {job.location} • {job.type}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Pill Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">
                    Salary Range
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {job.salaryRange || "Not disclosed"}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">
                    Department
                  </span>
                  <span className="text-xs font-bold text-text-primary">
                    {job.department || "Not specified"}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">
                    Work Mode
                  </span>
                  <span className="text-xs font-bold text-text-primary">
                    {job.workMode}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">
                    Experience
                  </span>
                  <span className="text-xs font-bold text-text-primary">{job.experienceLevel}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">
                    Openings
                  </span>
                  <span className="text-xs font-bold text-text-primary">{job.numberOfOpenings}</span>
                </div>
              </div>
            </div>

            {/* Role Overview */}
            <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4">
              <h2 className="text-base font-bold text-text-primary">About the Role</h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4">
                <h2 className="text-base font-bold text-text-primary">Key Requirements</h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                      <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 flex-shrink-0">
                        check_circle
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Actions & Company (4 cols) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 shadow-xl">
              <button
                onClick={handleApply}
                disabled={isApplied || isApplying}
                className={`w-full h-12 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isApplied
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "btn-3d-red text-white shadow-lg hover:scale-[1.02]"
                }`}
              >
                {isApplied ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>Application Submitted</span>
                  </>
                ) : isApplying ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Checking requirements…</span>
                  </>
                ) : (
                  <>
                    <span>Apply Now</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleSave}
                className="w-full h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all"
              >
                <span
                  className="material-symbols-outlined text-[18px] text-primary"
                  style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                >
                  bookmark
                </span>
                <span>{isSaved ? "Saved to Bookmarks" : "Save Job"}</span>
              </button>
            </div>

            {/* Company Info */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Hiring Organization
              </h3>
              <p className="text-xs text-text-primary font-bold">
                {job.company?.name || "Company name not available"}
              </p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {job.company?.description || "No company description has been provided for this listing."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
