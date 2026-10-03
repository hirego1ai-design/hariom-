"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import MarketingNav from "@/components/marketing/MarketingNav";

export type Job = {
  id: string;
  title: string;
  location: string;
  type: string;
  salaryRange: string | null;
  description: string;
  requirements: string[];
  company: { name: string; logoUrl: string | null; location: string | null };
};

const PAGE_SIZE = 20;

type JobsSearchPayload = {
  success?: boolean;
  jobs?: Job[];
  pagination?: {
    page?: number;
    totalPages?: number;
  };
  error?: string;
};

async function fetchJobsPage(query: string, page: number, location = "", signal?: AbortSignal) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (location) params.set("location", location);
  const response = await fetch(`/api/jobs/search?${params.toString()}`, {
    signal,
  });
  const raw: unknown = await response.json().catch(() => null);
  const data: JobsSearchPayload =
    raw && typeof raw === "object" ? (raw as JobsSearchPayload) : {};

  if (!response.ok || data.success !== true || !Array.isArray(data.jobs)) {
    throw new Error(data.error || "Could not load jobs.");
  }

  const totalPages = Number(data.pagination?.totalPages);
  return {
    jobs: data.jobs,
    page,
    totalPages: Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

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

export default function JobsClient({
  initialJobs,
  initialTotalPages,
}: {
  initialJobs: Job[];
  initialTotalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mappedLocation = (searchParams.get("location") || "").trim();
  const didHandleInitialJobsEffect = useRef(false);
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, JobRecommendation>>({});
  const [candidateAuthenticated, setCandidateAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [candidateStateLoading, setCandidateStateLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!didHandleInitialJobsEffect.current) {
      didHandleInitialJobsEffect.current = true;
      if (!query && !mappedLocation) return;
    }

    const controller = new AbortController();
    const delay = query ? 250 : 0;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const page = await fetchJobsPage(query, 1, mappedLocation, controller.signal);
        setJobs(page.jobs);
        setCurrentPage(1);
        setTotalPages(page.totalPages);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Could not load jobs.");
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, mappedLocation]);

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
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authBody = await authResponse.json().catch(() => ({}));
        if (
          authResponse.status === 401 ||
          authResponse.status === 403 ||
          !authResponse.ok ||
          authBody?.success !== true ||
          authBody?.user?.role !== "CANDIDATE"
        ) {
          if (!cancelled) {
            setCandidateAuthenticated(false);
            setSavedJobs([]);
            setAppliedJobs([]);
            setRecommendations({});
          }
          return;
        }

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
          setCandidateAuthenticated(true);
          setRecommendations(
            Object.fromEntries(
              (recommended.recommendations || []).map((item: JobRecommendation) => [item.jobId, item]),
            ),
          );
        } else {
          setCandidateAuthenticated(false);
          setRecommendations({});
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

  const loadMoreJobs = async () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    setError("");
    try {
      const nextPage = currentPage + 1;
      const page = await fetchJobsPage(query, nextPage, mappedLocation);
      setJobs((current) => {
        const seen = new Set(current.map((job) => job.id));
        const additions = page.jobs.filter((job) => !seen.has(job.id));
        return [...current, ...additions];
      });
      setCurrentPage(nextPage);
      setTotalPages(page.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load more jobs.");
    } finally {
      setLoadingMore(false);
    }
  };

  const apply = (job: Job) => {
    if (appliedJobs.includes(job.id) || candidateStateLoading) return;
    const destination = `/jobs/${job.id}/apply`;
    router.push(
      candidateAuthenticated
        ? destination
        : `/login?redirect=${encodeURIComponent(destination)}`,
    );
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
        router.push(`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`);
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
      {!candidateStateLoading && (candidateAuthenticated ? <CandidateSidebar /> : <MarketingNav />)}
      <main className={`w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-24 md:pb-10 ${candidateAuthenticated ? "md:ml-[116px]" : "pt-28 sm:pt-32"}`}>
        <h1 className="text-3xl font-bold">{mappedLocation ? `Jobs in ${mappedLocation}` : "Find jobs"}</h1>
        {mappedLocation && <p className="mt-2 text-sm text-text-muted">Showing current jobs mapped to {mappedLocation}.</p>}
        <label className="sr-only" htmlFor="job-search">Search jobs</label>
        <input
          id="job-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, description, department, or company"
          className="mt-6 w-full min-h-11 rounded-xl border border-outline bg-bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />

        {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 text-sm text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
        {loading && <p className="mt-8 text-text-muted">Loading jobs…</p>}
        {!loading && !error && jobs.length === 0 && (
          <p className="mt-8 rounded-xl border border-outline bg-bg-card p-6 text-text-secondary">{query ? "No jobs match your search." : "No jobs are available right now."}</p>
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
                <p className="mt-2 text-sm text-text-muted">{job.location} · {job.type}</p>
                {job.salaryRange && <p className="mt-1 text-sm text-text-muted">{job.salaryRange}</p>}

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
                ) : !candidateStateLoading && !candidateAuthenticated ? (
                  <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
                    <strong className="text-text-primary">See how well this job matches you</strong>
                    <p className="mt-1 text-text-muted">Create your candidate profile to get an evidence-based match score from your skills and experience.</p>
                    <Link href={`/register?redirect=${encodeURIComponent(`/jobs/${job.id}`)}`} prefetch={false} className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-primary/40 px-3 py-2 font-semibold text-primary hover:bg-primary/10">
                      Check My Match
                    </Link>
                  </div>
                ) : !candidateStateLoading && candidateAuthenticated && recommendation?.jobRequirementsAvailable ? (
                  <div className="mt-3 rounded-xl border border-outline bg-surface-container-high p-3 text-xs">
                    <strong className="text-text-primary">Complete your profile to unlock your match</strong>
                    <p className="mt-1 text-text-muted">A score is shown only when HireGo has enough relevant profile evidence. No score is guessed.</p>
                    <Link href="/profile" prefetch={false} className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-outline px-3 py-2 font-semibold text-primary hover:bg-bg-card">
                      Complete Profile
                    </Link>
                  </div>
                ) : !candidateStateLoading && candidateAuthenticated ? (
                  <p className="mt-3 text-xs text-text-muted">
                    A reliable match cannot be calculated until this role has structured requirements.
                  </p>
                ) : null}

                <p className="mt-4 line-clamp-3 text-sm text-text-secondary">{job.description}</p>
                {job.requirements.length > 0 && (
                  <p className="mt-4 text-xs text-text-muted">Requirements: {job.requirements.join(", ")}</p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/jobs/${job.id}`}
                    prefetch={false}
                    className="min-h-11 inline-flex items-center rounded-lg border border-outline px-4 py-2 text-sm hover:bg-surface-container-high"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => apply(job)}
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

        {!loading && currentPage < totalPages && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => void loadMoreJobs()}
              disabled={loadingMore}
              className="min-h-11 rounded-xl border border-outline px-5 text-sm font-bold text-text-primary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more jobs"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
