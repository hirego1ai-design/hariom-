"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Interview = {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  roomUrl: string | null;
  round: string;
  mode: string;
  candidateName: string;
  jobTitle: string;
};

export default function UpcomingInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employer/interviews")
      .then(async (response) => {
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to load interviews.");
        setInterviews(data.interviews || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load interviews."))
      .finally(() => setLoading(false));
  }, []);

  const visibleInterviews = useMemo(
    () => interviews.filter((item) => item.status !== "CANCELLED"),
    [interviews],
  );

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview operations</p>
            <h1 className="text-3xl font-bold text-white">Interviews</h1>
            <p className="text-sm text-text-secondary mt-2">Live schedule, joining links, rescheduling and final feedback.</p>
          </div>
          <Link href="/employer/interview-scheduler" className="btn-primary-red h-11 px-6 rounded-full text-white font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>Schedule interview
          </Link>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{error}</p>}
        {loading ? <p className="text-text-secondary">Loading interviews...</p> : visibleInterviews.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-text-muted">event_busy</span>
            <h2 className="text-lg font-bold text-white mt-3">No interviews scheduled</h2>
            <p className="text-sm text-text-secondary mt-2">Schedule a candidate from the managed-hiring tracker.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleInterviews.map((interview) => {
              const scheduledAt = new Date(interview.scheduledAt);
              return (
                <article key={interview.id} className="glass-card rounded-2xl p-5 border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-primary font-bold">{interview.round.replaceAll("_", " ")}</p>
                      <h2 className="text-lg text-white font-bold mt-1">{interview.candidateName}</h2>
                      <p className="text-sm text-text-secondary">{interview.jobTitle}</p>
                    </div>
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-text-secondary">{interview.status.replaceAll("_", " ")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 my-5 text-xs text-text-secondary">
                    <p><span className="material-symbols-outlined text-[16px] align-middle mr-1">calendar_month</span>{scheduledAt.toLocaleDateString()}</p>
                    <p><span className="material-symbols-outlined text-[16px] align-middle mr-1">schedule</span>{scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <p><span className="material-symbols-outlined text-[16px] align-middle mr-1">timer</span>{interview.durationMins} minutes</p>
                    <p><span className="material-symbols-outlined text-[16px] align-middle mr-1">location_on</span>{interview.mode}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interview.roomUrl && <a href={interview.roomUrl} target="_blank" rel="noreferrer" className="btn-primary-red h-10 px-4 rounded-full text-white text-xs font-bold flex items-center">Join interview</a>}
                    <Link href={`/employer/interview-reschedule-employer-view?interviewId=${encodeURIComponent(interview.id)}`} className="h-10 px-4 rounded-full border border-white/10 text-text-secondary text-xs font-bold flex items-center">Reschedule / Cancel</Link>
                    <Link href={`/employer/final-round-feedback?interviewId=${encodeURIComponent(interview.id)}`} className="h-10 px-4 rounded-full border border-white/10 text-text-secondary text-xs font-bold flex items-center">Feedback</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
