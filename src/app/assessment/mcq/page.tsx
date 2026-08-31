"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type AssignedAssessment = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  passingPercentage: number;
  job: { id: string; title: string };
  attempt: { startedAt: string; submittedAt: string | null } | null;
};

export default function CandidateMcqAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssignedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/assessment/mcq/assigned")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not load assigned assessments.");
        setAssessments(data.assessments || []);
      })
      .catch((cause) => setError(cause.message || "Could not load assigned assessments."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <CandidateSidebar />
      <main className="w-full max-w-4xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-bold">Assigned assessments</h1>
        <p className="mt-2 text-gray-400">Only assessments assigned through your active job applications appear here.</p>

        {loading && <p className="mt-8 text-gray-400">Loading assessments…</p>}
        {error && <p className="mt-8 rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">{error}</p>}
        {!loading && !error && assessments.length === 0 && (
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-300">
            You do not have an assessment assigned yet. Apply to a role first; the employer may then assign an assessment.
          </div>
        )}
        <div className="mt-8 grid gap-4">
          {assessments.map((assessment) => {
            const completed = Boolean(assessment.attempt?.submittedAt);
            return (
              <article key={assessment.id} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-sm font-medium text-indigo-300">{assessment.job.title}</p>
                <h2 className="mt-1 text-xl font-semibold">{assessment.title}</h2>
                {assessment.description && <p className="mt-2 text-gray-400">{assessment.description}</p>}
                <p className="mt-4 text-sm text-gray-400">{assessment.durationMinutes} minutes · Passing score: {assessment.passingPercentage}%</p>
                {completed ? (
                  <p className="mt-5 text-sm font-medium text-emerald-300">Completed</p>
                ) : (
                  <Link
                    href={`/assessment/mcq/active?id=${encodeURIComponent(assessment.id)}`}
                    className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500"
                  >
                    {assessment.attempt ? "Resume assessment" : "Start assessment"}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
