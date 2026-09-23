"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Application = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    location: string;
    type: string;
    company?: { name?: string | null } | null;
  };
  interviews?: Array<{ id: string; status: string; scheduledAt: string }>;
};

const STAGES = ["APPLIED", "SCREENING", "AI_INTERVIEW", "ASSESSMENT", "SHORTLISTED", "HIRED", "REJECTED", "WITHDRAWN"];

export default function ApplicationPipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeStage, setActiveStage] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load applications.");
        setApplications(Array.isArray(payload.applications) ? payload.applications : []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load applications."))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(STAGES.map((stage) => [stage, applications.filter((application) => application.status === stage).length])),
    [applications],
  );

  const visible = activeStage === "ALL" ? applications : applications.filter((application) => application.status === activeStage);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <CandidateSidebar />
      <main className="min-h-screen px-4 pb-28 pt-6 md:ml-[116px] md:px-8 md:pb-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Candidate workspace</p>
              <h1 className="mt-1 text-3xl font-extrabold text-white">Application Pipeline</h1>
              <p className="mt-2 text-sm text-text-muted">Your persisted HireGo applications and their current employer workflow status.</p>
            </div>
            <Link href="/jobs" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">Browse jobs</Link>
          </header>

          {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading applications…</div>}
          {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

          {!loading && !error && (
            <>
              <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                <button onClick={() => setActiveStage("ALL")} className={`rounded-xl border p-4 text-left ${activeStage === "ALL" ? "border-primary bg-primary/10" : "border-white/10 bg-[#121215]"}`}>
                  <p className="text-[10px] font-bold uppercase text-text-muted">All</p>
                  <p className="mt-1 text-2xl font-bold text-white">{applications.length}</p>
                </button>
                {STAGES.map((stage) => (
                  <button key={stage} onClick={() => setActiveStage(stage)} className={`rounded-xl border p-4 text-left ${activeStage === stage ? "border-primary bg-primary/10" : "border-white/10 bg-[#121215]"}`}>
                    <p className="truncate text-[10px] font-bold uppercase text-text-muted">{stage.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-2xl font-bold text-white">{counts[stage] || 0}</p>
                  </button>
                ))}
              </section>

              <section className="space-y-3">
                {visible.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">No applications are in this stage.</div>
                ) : visible.map((application) => {
                  const nextInterview = (application.interviews || [])
                    .filter((interview) => ["SCHEDULED", "RESCHEDULED"].includes(interview.status))
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
                  return (
                    <article key={application.id} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-white">{application.job.title}</h2>
                          <p className="mt-1 text-xs text-text-muted">{application.job.company?.name || "Employer"} · {application.job.location} · {application.job.type}</p>
                          <p className="mt-2 text-xs text-text-secondary">Applied {new Date(application.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{application.status.replaceAll("_", " ")}</span>
                          <p className="mt-2 text-xs text-text-muted">{nextInterview ? `Next interview: ${new Date(nextInterview.scheduledAt).toLocaleString()}` : "No upcoming interview recorded"}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
