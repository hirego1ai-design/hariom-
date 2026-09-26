"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type NoticeData = {
  success: boolean;
  noticeVersion: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  applicationId: string | null;
  assessment: {
    id: string;
    title: string;
    roleTitle: string | null;
    questionCount: number;
    durationMinutes: number;
    passingPercentage: number;
    validityDays: number | null;
    retakeCooldownHours: number | null;
    skills: string[];
  };
  integrity: {
    serverTimed: boolean;
    candidateOwnershipChecked: boolean;
    answerKeysHidden: boolean;
    duplicateSubmissionProtected: boolean;
    webcamMonitoring: boolean;
    microphoneMonitoring: boolean;
    screenRecording: boolean;
    tabSwitchMonitoring: boolean;
  };
  privacy: {
    employerCanSeeRawAnswers: boolean;
    employerCanSeeCorrectAnswerKeys: boolean;
    employerCanSeeSkillEvidence: boolean;
    privateCoachingSharedByDefault: boolean;
  };
  error?: string;
};

export default function SkillValidationNoticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const applicationId = searchParams.get("applicationId");

  const [data, setData] = useState<NoticeData | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    if (!assessmentId) return "";
    const params = new URLSearchParams({ assessmentId });
    if (applicationId) params.set("applicationId", applicationId);
    return params.toString();
  }, [assessmentId, applicationId]);

  useEffect(() => {
    if (!query) {
      setError("Assessment information is missing.");
      setLoading(false);
      return;
    }

    fetch(`/api/candidate/skill-validation/notice?${query}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.error || "Unable to load Skill Validation details.");
        }
        setData(body);
        setAcknowledged(Boolean(body.acknowledged));
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Unable to load Skill Validation details.");
      })
      .finally(() => setLoading(false));
  }, [query]);

  const start = async () => {
    if (!data || !acknowledged || starting) return;
    setStarting(true);
    setError("");

    try {
      const response = await fetch("/api/candidate/skill-validation/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: data.assessment.id,
          applicationId: applicationId || null,
          acknowledged: true,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error || "Unable to start Skill Validation.");
      }
      router.push(body.startUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start Skill Validation.");
      setStarting(false);
    }
  };

  const monitoringItems = data ? [
    ["Server-side timer", data.integrity.serverTimed],
    ["Candidate ownership check", data.integrity.candidateOwnershipChecked],
    ["Answer keys hidden", data.integrity.answerKeysHidden],
    ["Duplicate submission protection", data.integrity.duplicateSubmissionProtected],
    ["Webcam monitoring", data.integrity.webcamMonitoring],
    ["Microphone monitoring", data.integrity.microphoneMonitoring],
    ["Screen recording", data.integrity.screenRecording],
    ["Tab-switch monitoring", data.integrity.tabSwitchMonitoring],
  ] as const : [];

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 md:ml-[116px] p-6 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">HireGo Universal Skill Validation</p>
            <h1 className="text-3xl font-extrabold">Before you start</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              This short assessment checks foundational knowledge for your target role. You may skip it while building your profile, but it is required before a new job application can finish submitting.
            </p>
          </header>

          {loading && (
            <div className="rounded-3xl border border-outline bg-bg-card p-8 text-sm text-text-secondary">
              Loading assessment details…
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {!loading && data && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-outline bg-bg-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Role</p>
                  <p className="mt-2 text-sm font-bold">{data.assessment.roleTitle || "Role not provided"}</p>
                </div>
                <div className="rounded-2xl border border-outline bg-bg-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Questions</p>
                  <p className="mt-2 text-2xl font-extrabold">{data.assessment.questionCount}</p>
                </div>
                <div className="rounded-2xl border border-outline bg-bg-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Time</p>
                  <p className="mt-2 text-2xl font-extrabold">{data.assessment.durationMinutes} min</p>
                </div>
                <div className="rounded-2xl border border-outline bg-bg-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Knowledge threshold</p>
                  <p className="mt-2 text-2xl font-extrabold">{data.assessment.passingPercentage}%</p>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                  <h2 className="text-lg font-bold">What this assessment means</h2>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Your score is calculated deterministically on the server from the assessment answer key. The AI model cannot change your raw score, correct-answer count, passing threshold, or evidence status.
                  </p>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Skills covered</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.assessment.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-outline bg-surface-container px-3 py-1.5 text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-text-muted">
                    “Knowledge Validated” means this short screening found sufficient basic evidence for a skill. It is not a certification, practical coding test, interview pass, or employment guarantee.
                  </p>
                </article>

                <article className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                  <h2 className="text-lg font-bold">Retakes & validity</h2>
                  <p className="text-sm text-text-secondary">
                    {data.assessment.validityDays
                      ? `A qualifying result can remain current for up to ${data.assessment.validityDays} days, subject to HireGo policy.`
                      : "No fixed validity period is configured for this assessment."}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {data.assessment.retakeCooldownHours
                      ? `Retakes are available after the configured ${data.assessment.retakeCooldownHours}-hour cooldown.`
                      : "No retake cooldown is currently configured."}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Leaving after the assessment starts does not reset the timer. An in-progress attempt may resume only while it remains within the allowed duration.
                  </p>
                </article>
              </section>

              <section className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Integrity & monitoring</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    HireGo only states monitoring that is actually enabled for this assessment.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {monitoringItems.map(([label, enabled]) => (
                    <div key={label} className="rounded-2xl border border-outline bg-surface-container p-4">
                      <p className="text-xs font-semibold">{label}</p>
                      <p className={`mt-2 text-[11px] font-bold ${enabled ? "text-green-400" : "text-text-muted"}`}>
                        {enabled ? "Enabled" : "Not enabled"}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  Current Universal Skill Validation does not claim webcam, microphone, screen-recording, or tab-switch surveillance because those controls are not enabled in this assessment flow.
                </p>
              </section>

              <section className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                <h2 className="text-lg font-bold">Privacy & employer visibility</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm text-text-secondary">Employers can see relevant validated skill evidence according to HireGo visibility policy.</p>
                  <p className="text-sm text-text-secondary">Raw answers and answer keys are not shared with employers.</p>
                  <p className="text-sm text-text-secondary">Private coaching or improvement guidance is not shared by default.</p>
                  <p className="text-sm text-text-secondary">Assessment integrity data is not presented as an automatic cheating verdict.</p>
                </div>
              </section>

              {applicationId && (
                <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6">
                  <h2 className="font-bold">Your application is waiting for this step</h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Your application intent is saved. After you complete this Universal Skill Validation, HireGo will continue the pending application automatically if the job is still active.
                  </p>
                </section>
              )}

              <section className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    I understand the assessment rules, timing, privacy information, and the monitoring controls listed above. I will answer independently.
                  </span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!acknowledged || starting}
                    onClick={() => void start()}
                    className="rounded-full btn-3d-red px-7 py-3 text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    {starting ? "Starting…" : "Start Skill Validation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(applicationId ? "/jobs" : "/dashboard")}
                    className="rounded-full border border-outline px-7 py-3 text-xs font-bold text-text-secondary"
                  >
                    Not now
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
