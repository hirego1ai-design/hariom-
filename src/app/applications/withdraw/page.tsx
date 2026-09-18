"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Application = {
  id: string;
  status: string;
  job: { title: string; company: { name: string } };
};

function WithdrawApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load application.");
        const found = (data.applications || []).find((item: Application) => item.id === applicationId);
        if (!found) throw new Error("Application not found or no longer accessible.");
        setApplication(found);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load application."))
      .finally(() => setLoading(false));
  }, [applicationId]);

  async function withdraw() {
    if (!applicationId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to withdraw application.");
      router.replace("/applications");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to withdraw application.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <main className="flex-1 flex items-center justify-center p-6">
        <section className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-yellow/20 bg-yellow/10">
            <span className="material-symbols-outlined text-4xl text-yellow">warning</span>
          </div>
          <h1 className="text-center text-2xl font-bold text-white">Withdraw application?</h1>

          {loading ? (
            <p className="mt-5 text-center text-sm text-text-secondary">Loading application...</p>
          ) : error && !application ? (
            <div className="mt-5">
              <p className="rounded-lg bg-red-400/10 p-3 text-sm text-red-300">{error}</p>
              <button onClick={() => router.back()} className="mt-4 w-full rounded-full border border-white/10 p-3 text-sm text-white">Go back</button>
            </div>
          ) : application ? (
            <>
              <p className="mt-4 text-center text-sm leading-6 text-text-secondary">
                You are about to withdraw your application for <strong className="text-white">{application.job.title}</strong> at{" "}
                <strong className="text-white">{application.job.company.name}</strong>. This action cannot be undone.
              </p>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{application.job.company.name}</p>
                <p className="mt-1 text-sm text-text-secondary">{application.job.title}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-text-muted">Current status: {application.status}</p>
              </div>
              {error && <p className="mt-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
              <div className="mt-6 space-y-3">
                <button disabled={submitting} onClick={withdraw} className="w-full rounded-full bg-red-600 p-3 font-bold text-white disabled:opacity-50">
                  {submitting ? "Withdrawing..." : "Yes, withdraw application"}
                </button>
                <button disabled={submitting} onClick={() => router.back()} className="w-full rounded-full border border-white/10 p-3 text-white disabled:opacity-50">
                  Keep application
                </button>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}


export default function WithdrawApplicationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E0E0E] flex text-text-primary"><CandidateSidebar /><main className="flex-1 flex items-center justify-center p-6"><p className="text-sm text-text-secondary">Loading application...</p></main></div>}>
      <WithdrawApplicationContent />
    </Suspense>
  );
}
