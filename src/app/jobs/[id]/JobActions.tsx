"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JobActions({
  jobId,
  jobTitle,
  candidateAuthenticated,
}: {
  jobId: string;
  jobTitle?: string;
  candidateAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [checking, setChecking] = useState(candidateAuthenticated);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!candidateAuthenticated) {
      setChecking(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setChecking(true);
      try {
        const [savedResponse, applicationsResponse] = await Promise.all([
          fetch("/api/candidate/saved-jobs", { cache: "no-store" }),
          fetch("/api/applications", { cache: "no-store" }),
        ]);
        const [saved, applications] = await Promise.all([
          savedResponse.json().catch(() => ({})),
          applicationsResponse.json().catch(() => ({})),
        ]);
        if (cancelled) return;
        if (savedResponse.ok && Array.isArray(saved?.savedJobs)) {
          setIsSaved(saved.savedJobs.some((item: { jobId?: string }) => item.jobId === jobId));
        }
        if (applicationsResponse.ok && Array.isArray(applications?.applications)) {
          setIsApplied(applications.applications.some((item: { jobId?: string }) => item.jobId === jobId));
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [candidateAuthenticated, jobId]);

  function handleApply() {
    if (isApplied || checking) return;
    const destination = `/jobs/${jobId}/apply`;
    router.push(
      candidateAuthenticated
        ? destination
        : `/login?redirect=${encodeURIComponent(destination)}`,
    );
  }

  async function handleToggleSave() {
    if (!candidateAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }

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
  }

  return (
    <>
      {feedbackMessage && (
        <div
          role={feedbackType === "error" ? "alert" : "status"}
          className={`mb-4 rounded-2xl border p-3 text-xs ${feedbackType === "error" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-400"}`}
        >
          {feedbackMessage}
        </div>
      )}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 shadow-xl">
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplied || checking}
          className={`w-full h-12 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isApplied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "btn-3d-red text-white shadow-lg hover:scale-[1.02]"}`}
        >
          {isApplied ? "Application Submitted" : checking ? "Checking account…" : "Apply Now"}
        </button>

        {jobTitle && (
          <Link
            href={`/ai/mock-interview/setup?role=${encodeURIComponent(jobTitle)}`}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-xs font-bold text-blue-300 hover:text-white flex items-center justify-center gap-2 transition-all shadow-md group"
          >
            <span className="material-symbols-outlined text-[18px] text-blue-400 group-hover:scale-110 transition-transform">
              mic
            </span>
            <span>Practice Interview for this Role</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => void handleToggleSave()}
          disabled={checking}
          className="w-full h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all disabled:opacity-60"
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
    </>
  );
}
