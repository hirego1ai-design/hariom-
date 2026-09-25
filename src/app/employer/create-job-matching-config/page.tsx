"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";
import { useJobCreationStore } from "@/store/useJobCreationStore";

export default function JobMatchingConfigPage() {
  const router = useRouter();
  const store = useJobCreationStore();
  const idempotencyKey = useRef(`job-${crypto.randomUUID()}`);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const totalWeight = store.weightExperience + store.weightEducation + store.weightSkills;
  const salary = store.salaryMin && store.salaryMax
    ? `${store.currency} ${store.salaryMin}-${store.salaryMax} ${store.salaryPeriod}`
    : "Negotiable";

  const requirements = useMemo(
    () => (store.skillRequirements.length
      ? store.skillRequirements
      : store.skillTags.map((name) => ({ name, priority: "preferred" as const }))),
    [store.skillRequirements, store.skillTags],
  );

  const canPublish = Boolean(
    store.jobTitle.trim() &&
    store.location.trim() &&
    totalWeight === 100 &&
    store.weightExperience + store.weightSkills > 0,
  );

  const handlePublish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    setError("");
    try {
      const response = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey.current,
        },
        body: JSON.stringify({
          title: store.jobTitle.trim(),
          department: store.department.trim() || undefined,
          location: store.location.trim(),
          type: store.jobType,
          salary,
          status: "ACTIVE",
          requirements: requirements.map((item) => item.name),
          skillRequirements: requirements,
          screeningQuestions: store.screeningQuestions.map((question) => question.trim()).filter(Boolean),
          aiFocusAreas: store.aiFocusAreas.trim() || undefined,
          requiresJobSpecificAssessment: store.requiresJobSpecificAssessment,
          matchingConfig: {
            weightExperience: store.weightExperience,
            weightEducation: store.weightEducation,
            weightSkills: store.weightSkills,
            autoArchiveScore: store.autoArchiveScore,
            autoInterviewLimit: store.autoInterviewLimit,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to publish job.");
      store.reset();
      router.replace("/employer/job-listings-management");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to publish job.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <PageContainer>
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Final job configuration</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Matching & Publish</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          These values are persisted with the job. The server derives your company and generates the final job description through the guarded JD agent during publish.
        </p>
      </header>

      {!store.jobTitle.trim() ? (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h2 className="font-bold text-amber-200">Job basics are incomplete</h2>
          <p className="mt-2 text-sm text-text-muted">Choose a role and location before publishing.</p>
          <button onClick={() => router.push("/employer/create-job-basic-info")} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">Return to basic info</button>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Matching weights</h2>
                  <p className="mt-1 text-xs text-text-muted">The three persisted weights must total 100%.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${totalWeight === 100 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                  {totalWeight}%
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {[
                  ["Experience", "weightExperience"],
                  ["Education", "weightEducation"],
                  ["Skills", "weightSkills"],
                ].map(([label, field]) => {
                  const value = store[field as "weightExperience" | "weightEducation" | "weightSkills"];
                  return (
                    <label key={field} className="block">
                      <div className="mb-2 flex justify-between text-xs"><span className="font-bold text-text-secondary">{label}</span><span className="text-white">{value}%</span></div>
                      <input type="range" min="0" max="100" value={value} onChange={(event) => store.updateField(field as any, Number(event.target.value))} className="w-full" />
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Recorded screening threshold</span>
                <div className="mt-3 flex items-center gap-4">
                  <input type="range" min="0" max="100" value={store.autoArchiveScore} onChange={(event) => store.updateField("autoArchiveScore", Number(event.target.value))} className="flex-1" />
                  <strong className="text-white">{store.autoArchiveScore}%</strong>
                </div>
                <p className="mt-2 text-xs text-text-muted">Stored as matching configuration; this screen does not claim an automatic rejection action.</p>
              </label>

              <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Additional job-specific assessment</span>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => store.updateField("requiresJobSpecificAssessment", false)}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold transition-colors ${!store.requiresJobSpecificAssessment ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-text-secondary"}`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => store.updateField("requiresJobSpecificAssessment", true)}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold transition-colors ${store.requiresJobSpecificAssessment ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-text-secondary"}`}
                  >
                    Yes
                  </button>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  If enabled, HireGo automatically creates the assessment from this job’s role and approved skills. Question count and scoring policy are controlled by HireGo, not manually configured here.
                </p>
              </div>
            </section>

            {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => router.push("/employer/create-job-requirements")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white">Back to requirements</button>
              <button onClick={handlePublish} disabled={!canPublish || publishing} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {publishing ? "Publishing…" : "Publish Job"}
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#121215] p-5 xl:sticky xl:top-24 xl:self-start">
            <h2 className="text-lg font-extrabold text-white">Draft Summary</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-xs text-text-muted">Role</dt><dd className="mt-1 font-bold text-white">{store.jobTitle}</dd></div>
              <div><dt className="text-xs text-text-muted">Department</dt><dd className="mt-1 text-text-secondary">{store.department || "Not specified"}</dd></div>
              <div><dt className="text-xs text-text-muted">Location</dt><dd className="mt-1 text-text-secondary">{store.location}</dd></div>
              <div><dt className="text-xs text-text-muted">Employment</dt><dd className="mt-1 text-text-secondary">{store.jobType} · {store.workMode}</dd></div>
              <div><dt className="text-xs text-text-muted">Salary</dt><dd className="mt-1 text-text-secondary">{salary}</dd></div>
              <div><dt className="text-xs text-text-muted">Selected skills</dt><dd className="mt-1 text-text-secondary">{requirements.length ? requirements.map((item) => item.name).join(", ") : "No skills selected"}</dd></div>
            </dl>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
