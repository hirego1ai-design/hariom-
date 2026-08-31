"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Job = {
  id: string;
  title: string;
  location: string;
  type: string;
  salaryRange: string | null;
  description: string;
  requirements: string[];
  company: { name: string; logoUrl: string | null; location: string | null };
};

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not load jobs.");
        setJobs(data.jobs || []);
      } catch (cause: any) {
        if (cause.name !== "AbortError") setError(cause.message || "Could not load jobs.");
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
    fetch("/api/candidate/saved-jobs")
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (response.ok && data.success) setSavedJobs((data.savedJobs || []).map((saved: { jobId: string }) => saved.jobId));
      })
      .catch(() => undefined);
  }, []);

  const apply = async (job: Job) => {
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Application could not be submitted.");
      setAppliedJobs((current) => current.includes(job.id) ? current : [...current, job.id]);
      setNotice(`Application submitted for ${job.title}.`);
    } catch (cause: any) {
      setError(cause.message || "Application could not be submitted.");
    }
  };

  const toggleSaved = async (jobId: string) => {
    const saved = savedJobs.includes(jobId);
    setError("");
    try {
      const response = await fetch(saved ? `/api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)}` : "/api/candidate/saved-jobs", {
        method: saved ? "DELETE" : "POST",
        headers: saved ? undefined : { "Content-Type": "application/json" },
        body: saved ? undefined : JSON.stringify({ jobId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not update saved jobs.");
      setSavedJobs((current) => saved ? current.filter((id) => id !== jobId) : [...current, jobId]);
    } catch (cause: any) {
      setError(cause.message || "Could not update saved jobs.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex">
      <CandidateSidebar />
      <main className="w-full max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">Find jobs</h1>
        <p className="mt-2 text-sm text-gray-400">Only active jobs from HireGo employers are shown.</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, skill, or company"
          className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-indigo-500"
        />
        {notice && <p className="mt-4 rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 text-sm text-emerald-300">{notice}</p>}
        {error && <p className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
        {loading && <p className="mt-8 text-gray-400">Loading jobs…</p>}
        {!loading && !error && jobs.length === 0 && <p className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-300">No active jobs match this search.</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => {
            const applied = appliedJobs.includes(job.id);
            const saved = savedJobs.includes(job.id);
            return (
              <article key={job.id} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-sm text-indigo-300">{job.company.name}</p>
                <h2 className="mt-1 text-xl font-semibold">{job.title}</h2>
                <p className="mt-2 text-sm text-gray-400">{job.location} · {job.type}</p>
                {job.salaryRange && <p className="mt-1 text-sm text-gray-400">{job.salaryRange}</p>}
                <p className="mt-4 line-clamp-3 text-sm text-gray-300">{job.description}</p>
                {job.requirements.length > 0 && <p className="mt-4 text-xs text-gray-400">Skills: {job.requirements.join(", ")}</p>}
                <div className="mt-6 flex gap-3">
                  <Link href={`/jobs/${job.id}`} className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:bg-gray-800">Details</Link>
                  <button onClick={() => apply(job)} disabled={applied} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-indigo-500">
                    {applied ? "Applied" : "Apply"}
                  </button>
                  <button onClick={() => toggleSaved(job.id)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:bg-gray-800">
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
