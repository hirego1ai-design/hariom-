"use client";
import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

type Interview = { id: string; scheduledAt?: string; status?: string; job?: { title?: string; company?: { name?: string } }; roomId?: string };

export default function CandidateInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/interviews", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not load interviews.");
        setInterviews(data.interviews || []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load interviews."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 ml-0 md:ml-[116px] max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div><h1 className="text-2xl font-bold">Scheduled interviews</h1><p className="mt-1 text-sm text-text-muted">Only interviews associated with your account are shown here.</p></div>
          <Link href="/ai/mock-interview/active" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white">Practice with AI</Link>
        </div>
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
        {loading && <p className="text-sm text-text-muted">Loading interviews…</p>}
        {!loading && !error && interviews.length === 0 && <div className="rounded-2xl border border-outline bg-bg-card p-8 text-center"><h2 className="font-bold">No interviews scheduled</h2><p className="mt-2 text-sm text-text-muted">When an employer schedules an interview, its verified date, time and joining option will appear here.</p><Link href="/jobs" className="mt-5 min-h-11 inline-flex items-center rounded-xl border border-outline px-5 text-sm font-bold">Browse jobs</Link></div>}
        <div className="grid gap-4">
          {interviews.map((interview) => {
            const scheduled = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
            return <article key={interview.id} className="rounded-2xl border border-outline bg-bg-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div><p className="text-xs font-bold text-primary">{interview.status || "Scheduled"}</p><h2 className="mt-1 text-lg font-bold">{interview.job?.title || "Interview"}</h2><p className="text-sm text-text-muted">{interview.job?.company?.name || "Employer"}</p></div>
                <div className="text-sm text-text-secondary">{scheduled && !Number.isNaN(scheduled.getTime()) ? scheduled.toLocaleString() : "Schedule pending"}</div>
              </div>
              {interview.roomId && <Link href={`/interviews/room/${interview.roomId}`} className="mt-5 min-h-11 inline-flex items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white">Enter interview room</Link>}
            </article>;
          })}
        </div>
      </main>
    </div>
  );
}
