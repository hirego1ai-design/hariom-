"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Candidate = {
  id: string;
  applicationId: string;
  name: string;
  matchScore: number;
  experience: string;
  stage: string;
  currentRole: string;
  appliedJob: string;
  currentLocation: string;
  candidateBio?: string | null;
  hasVideoResume: boolean;
  videoResumeId?: string | null;
  availability?: string | null;
  availabilityConfirmedAt?: string | null;
  jobReady: boolean;
  jobReadyRecords?: Array<{ roleTitle: string; seniority: string; score: number | null; validUntil: string | null }>;
};

export default function EmployerCandidateProfilePage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setError("Candidate identifier is required.");
      setLoading(false);
      return;
    }

    fetch("/api/employer/candidates?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load candidate profile.");
        const match = (payload.candidates || []).find((item: Candidate) => item.id === id || item.applicationId === id);
        if (!match) throw new Error("Candidate record was not found in your company pipeline.");
        setCandidate(match);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load candidate profile."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Candidate Review" subtitle="Only recorded employer-visible candidate evidence is shown. Missing evidence is not inferred." />
      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading candidate evidence…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

      {!loading && !error && candidate && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white">{candidate.name}</h1>
                <p className="mt-1 text-sm text-text-muted">{candidate.currentRole} · {candidate.currentLocation}</p>
                <p className="mt-2 text-sm text-text-secondary">{candidate.candidateBio || "No candidate bio has been recorded."}</p>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{candidate.stage.replaceAll("_", " ")}</span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Applied Job", candidate.appliedJob],
              ["Recorded Match", Number.isFinite(candidate.matchScore) ? `${candidate.matchScore}/100` : "Not available"],
              ["Experience", candidate.experience || "Not provided"],
              ["Availability", candidate.availability || "Not provided"],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                <p className="mt-2 text-base font-bold text-white">{value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-lg font-extrabold text-white">Job-Ready Evidence</h2>
            {!candidate.jobReady || !candidate.jobReadyRecords?.length ? (
              <p className="mt-3 text-sm text-text-muted">No current Job-Ready assessment record is available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {candidate.jobReadyRecords.map((record, index) => (
                  <div key={`${record.roleTitle}-${record.seniority}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="font-bold text-white">{record.roleTitle} · {record.seniority}</p>
                    <p className="mt-1 text-xs text-text-muted">Score: {typeof record.score === "number" ? `${record.score}/100` : "Not available"} · Valid until: {record.validUntil ? new Date(record.validUntil).toLocaleDateString() : "No expiry recorded"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            {candidate.hasVideoResume && candidate.videoResumeId && (
              <Link href={`/employer/video-resume/${encodeURIComponent(candidate.videoResumeId)}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">Review video resume</Link>
            )}
            <Link href="/employer/hiring-pipeline" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white">Back to pipeline</Link>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
