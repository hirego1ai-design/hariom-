"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Job = {
  id: string;
  title: string;
  location: string;
  type: string;
  workMode: string;
  experienceLevel: string;
  numberOfOpenings: number;
  salaryRange: string | null;
  description: string;
  requirements: string[];
  company: { name: string; logoUrl: string | null; location: string | null };
};

type JobRecommendation = {
  jobId: string;
  matchScore: number | null;
  requiredSkillEvidenceCoverage: number | null;
  requiredSkillVerificationCoverage: number | null;
  verificationCoverage: number;
  candidateSkillEvidenceAvailable: boolean;
  experienceEvidenceAvailable: boolean;
  jobRequirementsAvailable: boolean;
};

export default function JobsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, JobRecommendation>>({});
  const [loading, setLoading] = useState(true);
  const [candidateStateLoading, setCandidateStateLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !Array.isArray(data.jobs)) {
          throw new Error(data.error || "Could not load jobs.");
        }
        setJobs(data.jobs);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Could not load jobs.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function candidateJson(url: string) {
      const response = await fetch(url, { cache: "no-store" });
      if (response.status === 401 || response.status === 403) return null;
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.error || "Candidate account state is temporarily unavailable.");
      }
      return body;
    }

    async function loadCandidateState() {
      setCandidateStateLoading(true);
      try {
        const [saved, applications, recommended] = await Promise.all([
          candidateJson("/api/candidate/saved-jobs"),
          candidateJson("/api/applications"),
          candidateJson("/api/candidate/recommended-jobs"),
        ]);
        if (cancelled) return;

        if (saved) {
          setSavedJobs((saved.savedJobs || []).map((item: { jobId: string }) => item.jobId));
        }
        if (applications) {
          setAppliedJobs((applications.applications || []).map((item: { jobId: string }) => item.jobId));
        }
        if (recommended) {
          setRecommendations(
            Object.fromEntries(
              (recommended.recommendations || []).map((item: JobRecommendation) => [item.jobId, item]),
            ),
          );
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Candidate account state is temporarily unavailable.");
        }
      } finally {
        if (!cancelled) setCandidateStateLoading(false);
      }
    }

    void loadCandidateState();
    return () => { cancelled = true; };
  }, []);

  const apply = async (job: Job) => {
    if (appliedJobs.includes(job.id)) return;
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/jobs")}`);
        return;
      }
      if (response.status === 202 && data.success && data.assessmentRequired && data.noticeUrl) {
        router.push(data.noticeUrl);
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Application could not be submitted.");
      }

      setAppliedJobs((current) => current.includes(job.id) ? current : [...current, job.id]);

      if (data.assessmentRequired && data.assessmentType === "JOB_SPECIFIC_ASSESSMENT" && data.assessmentUrl) {
        router.push(data.assessmentUrl);
        return;
      }

      setNotice(`Application submitted for ${job.title}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Application could not be submitted.");
    }
  };

  const toggleSaved = async (jobId: string) => {
    const saved = savedJobs.includes(jobId);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        saved ? `/api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)}` : "/api/candidate/saved-jobs",
        {
          method: saved ? "DELETE" : "POST",
          headers: saved ? undefined : { "Content-Type": "application/json" },
          body: saved ? undefined : JSON.stringify({ jobId }),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/jobs")}`);
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not update saved jobs.");
      }

      setSavedJobs((current) => saved ? current.filter((id) => id !== jobId) : [...current, jobId]);
      setNotice(saved ? "Job removed from saved jobs." : "Job saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update saved jobs.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-24 md:pb-10 md:ml-[116px]">
        <h1 className="text-3xl font-bold">Find jobs</h1>
        <p className="mt-2 text-sm text-text-muted">
          Only active jobs from HireGo employers are shown. Compatibility appears only when relevant profile evidence exists.
        </p>

        <label className="sr-only" htmlFor="job-search">Search jobs</label>
        <input
          id="job-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, skill, or company"
          className="mt-6 w-full min-h-11 rounded-xl border border-outline bg-bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />

        {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 text-sm text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
        {loading && <p className="mt-8 text-text-muted">Loading jobs…</p>}
        {!loading && !error && jobs.length === 0 && (
          <p className="mt-8 rounded-xl border border-outline bg-bg-card p-6 text-text-secondary">No active jobs match this search.</p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => {
            const applied = appliedJobs.includes(job.id);
            const saved = savedJobs.includes(job.id);
            const recommendation = recommendations[job.id];

            return (
              <article key={job.id} className="rounded-xl border border-outline bg-bg-card p-6">
                <p className="text-sm text-primary">{job.company.name}</p>
                <h2 className="mt-1 text-xl font-semibold">{job.title}</h2>
                <p className="mt-2 text-sm text-text-muted">
                  {job.location} · {job.type} · {job.workMode} · {job.experienceLevel}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {job.numberOfOpenings} opening{job.numberOfOpenings === 1 ? "" : "s"}
                </p>
                {job.salaryRange && <p className="mt-1 text-sm text-text-muted">{job.salaryRange}</p>

                {recommendation?.matchScore !== null && recommendation?.matchScore !== undefined ? (
                  <div className="mt-3 rounded-xl border border-outline bg-surface-container-high p-3 text-xs">
                    <strong>{recommendation.matchScore}% evidence-based compatibility</strong>
                    {recommendation.requiredSkillEvidenceCoverage !== null && (
                      <p className="mt-1 text-text-muted">
                        Required-skill evidence: {recommendation.requiredSkillEvidenceCoverage}%
                        {recommendation.requiredSkillVerificationCoverage !== null
                          ? ` · verified: ${recommendation.requiredSkillVerificationCoverage}%`
                          : ""}
                      </p>
                    )}
                  </div>
                ) : recommendation?.jobRequirementsAvailable ? (
                  <p className="mt-3 text-xs text-text-muted">
                    Compatibility not scored yet because relevant candidate evidence is unavailable.
                  </p>
                ) : null}

                <p className="mt-4 line-clamp-3 text-sm text-text-secondary">{job.description}</p>
                {job.requirements.length > 0 && (
                  <p className="mt-4 text-xs text-text-muted">Requirements: {job.requirements.join(", ")}</p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="min-h-11 inline-flex items-center rounded-lg border border-outline px-4 py-2 text-sm hover:bg-surface-container-high"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => void apply(job)}
                    disabled={applied || candidateStateLoading}
                    className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
                  >
                    {applied ? "Applied" : "Apply"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleSaved(job.id)}
                    disabled={candidateStateLoading}
                    className="min-h-11 rounded-lg border border-outline px-4 py-2 text-sm hover:bg-surface-container-high disabled:opacity-50"
                  >
                    {saved ? "Saved" : "Save"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
