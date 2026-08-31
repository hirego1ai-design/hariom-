"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type TypingResult = {
  id: string;
  wpm: number;
  accuracy: number;
  errorCount: number;
  durationSeconds: number;
  createdAt: string;
};

export default function TypingResultsPage() {
  const searchParams = useSearchParams();
  const resultId = searchParams?.get("id");
  const [result, setResult] = useState<TypingResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resultId) {
      setError("No typing practice result was selected.");
      return;
    }
    fetch(`/api/assessment/typing/${encodeURIComponent(resultId)}`)
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok || !data.success) throw new Error(data.error || "Could not load typing practice result.");
        setResult(data.assessment);
      })
      .catch((cause) => setError(cause.message || "Could not load typing practice result."));
  }, [resultId]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex">
      <CandidateSidebar />
      <main className="w-full max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">Typing practice result</h1>
        <p className="mt-2 text-sm text-gray-400">This is unproctored practice, not a hiring credential or pass/fail result.</p>
        {error && <p className="mt-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">{error}</p>}
        {result && (
          <section className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-gray-800 bg-gray-900 p-6 md:grid-cols-4">
            <div><p className="text-sm text-gray-400">Speed</p><p className="mt-1 text-2xl font-semibold">{result.wpm} WPM</p></div>
            <div><p className="text-sm text-gray-400">Accuracy</p><p className="mt-1 text-2xl font-semibold">{result.accuracy.toFixed(1)}%</p></div>
            <div><p className="text-sm text-gray-400">Errors</p><p className="mt-1 text-2xl font-semibold">{result.errorCount}</p></div>
            <div><p className="text-sm text-gray-400">Duration</p><p className="mt-1 text-2xl font-semibold">{result.durationSeconds}s</p></div>
          </section>
        )}
        <Link href="/assessment/typing/active" className="mt-8 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">Practice again</Link>
      </main>
    </div>
  );
}
