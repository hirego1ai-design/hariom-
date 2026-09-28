"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "AI_INTERVIEW"
  | "ASSESSMENT"
  | "SHORTLISTED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

type ApplicationDetail = {
  id: string;
  status: ApplicationStatus;
  matchScore: number | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    location: string | null;
    type: string;
    status: string;
    company: { name: string; logoUrl: string | null };
  };
  interviews: Array<{ id: string; status: string; scheduledAt: string | null; roomUrl: string | null }>;
  gates: Array<{ id: string; type: string; status: string; assessmentId: string | null; completedAt: string | null }>;
  offers: Array<{ id: string; status: string; expiresAt: string }>;
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  AI_INTERVIEW: "AI interview",
  ASSESSMENT: "Assessment",
  SHORTLISTED: "Shortlisted",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const WITHDRAWABLE = new Set<ApplicationStatus>(["APPLIED", "SCREENING", "AI_INTERVIEW", "ASSESSMENT", "SHORTLISTED"]);

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/applications/${encodeURIComponent(String(applicationId))}`, { cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success || !body.application) {
          throw new Error(body.error || "Could not load this application.");
        }
        if (!cancelled) setApplication(body.application);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load this application.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <CandidateSidebar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 md:ml-[116px] md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/applications" className="min-h-11 inline-flex items-center rounded-full border border-outline px-4 text-sm font-bold">
            ← Applications
          </Link>
          {application && WITHDRAWABLE.has(application.status) && (
            <Link href="/applications/withdraw" className="min-h-11 inline-flex items-center rounded-full border border-primary px-4 text-sm font-bold text-primary">
              Withdraw application
            </Link>
          )}
        </div>

        {loading && <div className="rounded-2xl border border-outline bg-bg-card p-8 text-sm text-text-muted">Loading application…</div>}
        {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>}

        {!loading && !error && application && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-outline bg-bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Application</p>
                  <h1 className="mt-2 text-2xl font-bold">{application.job.title}</h1>
                  <p className="mt-1 text-sm text-text-secondary">
                    {application.job.company.name}{application.job.location ? ` · ${application.job.location}` : ""}
                  </p>
                </div>
                <div className="rounded-full border border-outline px-4 py-2 text-sm font-bold">
                  {STATUS_LABEL[application.status] || application.status}
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-bg-elevated p-4">
                  <p className="text-xs text-text-muted">Applied</p>
                  <p className="mt-1 text-sm font-semibold">{new Date(application.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-bg-elevated p-4">
                  <p className="text-xs text-text-muted">Last updated</p>
                  <p className="mt-1 text-sm font-semibold">{new Date(application.updatedAt).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-bg-elevated p-4">
                  <p className="text-xs text-text-muted">Match score</p>
                  <p className="mt-1 text-sm font-semibold">
                    {typeof application.matchScore === "number" ? `${application.matchScore}%` : "Not available"}
                  </p>
                </div>
              </div>
              {application.aiSummary && (
                <div className="mt-5 rounded-2xl border border-outline p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Persisted evaluation summary</p>
                  <p className="mt-2 text-sm text-text-secondary">{application.aiSummary}</p>
                </div>
              )}
              <Link href={`/jobs/${application.job.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-outline px-4 text-sm font-bold">
                View job posting
              </Link>
            </section>

            <section className="rounded-3xl border border-outline bg-bg-card p-6">
              <h2 className="text-lg font-bold">Assessment requirements</h2>
              {application.gates.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No assessment gate is attached to this application.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {application.gates.map((gate) => (
                    <div key={gate.id} className="rounded-2xl border border-outline bg-bg-elevated p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{gate.type.replaceAll("_", " ")}</p>
                          <p className="mt-1 text-xs text-text-muted">Status: {gate.status}</p>
                        </div>
                        {gate.assessmentId && !gate.completedAt && (
                          <Link href={`/assessment/mcq/active?id=${encodeURIComponent(gate.assessmentId)}`} className="min-h-11 inline-flex items-center rounded-xl bg-primary px-4 text-xs font-bold text-white">
                            Open assessment
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-outline bg-bg-card p-6">
              <h2 className="text-lg font-bold">Interviews</h2>
              {application.interviews.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No interview has been scheduled for this application.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {application.interviews.map((interview) => (
                    <div key={interview.id} className="rounded-2xl border border-outline bg-bg-elevated p-4">
                      <p className="text-sm font-bold">{interview.status}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : "Schedule not set"}
                      </p>
                      {interview.roomUrl && (
                        <Link href={interview.roomUrl} className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-outline px-4 text-xs font-bold">
                          Open interview room
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {application.offers.length > 0 && (
              <section className="rounded-3xl border border-outline bg-bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Offer activity</h2>
                    <p className="mt-1 text-sm text-text-muted">Offer details and candidate responses are managed on the Offers page.</p>
                  </div>
                  <Link href="/offers" className="min-h-11 inline-flex items-center rounded-xl bg-primary px-4 text-xs font-bold text-white">
                    View offers
                  </Link>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
