"use client";

import Link from "next/link";
import { useEmployer } from "@/context/EmployerContext";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

export default function EmployerDashboardPage() {
  const { dashboardStats, candidates, jobs, isLoading } = useEmployer();

  const activeJobs = jobs.filter((job: any) => String(job.status).toUpperCase() === "ACTIVE");
  const recentCandidates = candidates.slice(0, 5);
  const credits = dashboardStats.companyCredits || dashboardStats.credits || {};

  const stats = [
    ["Active Jobs", dashboardStats.activeJobs ?? activeJobs.length, "Persisted active job listings"],
    ["Applications", dashboardStats.totalApplications ?? candidates.length, "Tenant-scoped applications"],
    ["Upcoming Interviews", dashboardStats.interviews ?? 0, "Scheduled interview count"],
    ["Candidate Records", candidates.length, "Loaded application records"],
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Employer Dashboard"
        subtitle="Live company hiring data from HireGo’s tenant-scoped backend. Unsupported predictions and demo metrics have been removed."
      />

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading company workspace…</div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value, note]) => (
              <article key={String(label)} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">{String(value ?? 0)}</p>
                <p className="mt-2 text-xs text-text-muted">{note}</p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div><h2 className="text-lg font-extrabold text-white">Active Jobs</h2><p className="mt-1 text-xs text-text-muted">Current company job listings.</p></div>
                <Link href="/employer/job-listings-management" className="text-xs font-bold text-secondary hover:underline">Manage jobs</Link>
              </div>
              <div className="mt-4 space-y-3">
                {activeJobs.length === 0 ? (
                  <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-text-muted">No active jobs yet.</p>
                ) : activeJobs.slice(0, 6).map((job: any) => (
                  <div key={job.id} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-bold text-white">{job.title}</p><p className="mt-1 text-xs text-text-muted">{job.department || "Department not specified"} · {job.location}</p></div>
                    <span className="text-xs font-bold text-emerald-300">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
              <h2 className="text-lg font-extrabold text-white">Available Credits</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Job posts</span><strong className="text-white">{credits.jobPostsLeft ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-text-muted">Resume unlocks</span><strong className="text-white">{credits.resumeUnlocksLeft ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-text-muted">AI interviews</span><strong className="text-white">{credits.aiInterviewsLeft ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-text-muted">AI agent credits</span><strong className="text-white">{credits.aiAgentCreditsLeft ?? 0}</strong></div>
              </div>
              <Link href="/employer/subscriptions" className="mt-5 inline-flex text-xs font-bold text-secondary hover:underline">View subscription</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-lg font-extrabold text-white">Recent Candidates</h2><p className="mt-1 text-xs text-text-muted">Latest application records available to your company.</p></div>
              <Link href="/employer/hiring-pipeline" className="text-xs font-bold text-secondary hover:underline">Open pipeline</Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {recentCandidates.length === 0 ? (
                <p className="text-sm text-text-muted">No candidate applications are available yet.</p>
              ) : recentCandidates.map((candidate: any) => (
                <div key={candidate.applicationId || candidate.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="font-bold text-white">{candidate.name}</p>
                  <p className="mt-1 text-xs text-text-muted">{candidate.appliedJob} · {String(candidate.stage || "").replaceAll("_", " ")}</p>
                  <p className="mt-2 text-xs text-text-secondary">Recorded match: {typeof candidate.matchScore === "number" ? `${candidate.matchScore}/100` : "Not available"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Post a Job", "/employer/create-job-basic-info"],
              ["Search Candidates", "/employer/proactive-candidate-search"],
              ["Schedule Interview", "/employer/interview-scheduler"],
              ["Recruiting Analytics", "/employer/employer-analytics-dashboard"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-xl border border-white/10 bg-[#121215] p-4 text-center text-sm font-bold text-white transition hover:border-secondary/50">{label}</Link>
            ))}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
