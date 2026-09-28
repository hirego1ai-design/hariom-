"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function JobApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [jobLoadError, setJobLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfileLoadError("");
      try {
        const response = await fetch("/api/candidate/profile", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.profile) {
          throw new Error(data.error || "Your candidate profile could not be loaded.");
        }
        if (!cancelled) setProfile(data.profile);
      } catch (error) {
        if (!cancelled) {
          setProfile(null);
          setProfileLoadError(error instanceof Error ? error.message : "Your candidate profile could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadJob() {
      if (!jobId) return;
      setJobLoadError("");
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.job) {
          throw new Error(data.error || "This job listing could not be loaded.");
        }
        if (!cancelled) setJobTitle(data.job.title || null);
      } catch (error) {
        if (!cancelled) {
          setJobTitle(null);
          setJobLoadError(error instanceof Error ? error.message : "This job listing could not be loaded.");
        }
      }
    }

    void loadProfile();
    void loadJob();
    return () => { cancelled = true; };
  }, [jobId]);

  const handleSubmitApplication = async () => {
    if (!jobId) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to submit application. Please try again.");
        setSubmitting(false);
        return;
      }

      if (response.status === 202 && data.assessmentRequired && data.noticeUrl) {
        router.push(data.noticeUrl);
        return;
      }
      if (data.assessmentRequired && data.assessmentType === "JOB_SPECIFIC_ASSESSMENT" && data.assessmentUrl) {
        router.push(data.assessmentUrl);
        return;
      }
      router.push("/applications");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />

      <main className="flex-1 ml-0 md:ml-[116px] p-6 lg:p-10 max-w-5xl">
        {/* Stepper Progress */}
        <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1 ? "bg-primary text-white shadow-md" : "bg-white/10 text-text-muted"
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold text-text-primary hidden sm:inline">
              Profile Review
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-white/10 mx-3" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2 ? "bg-primary text-white shadow-md" : "bg-white/10 text-text-muted"
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-text-primary hidden sm:inline">
              Application Requirements
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-white/10 mx-3" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 3 ? "bg-primary text-white shadow-md" : "bg-white/10 text-text-muted"
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-text-primary hidden sm:inline">
              Submit
            </span>
          </div>
        </div>

        {(profileLoadError || jobLoadError) && (
          <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300">
            {profileLoadError || jobLoadError}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-primary mb-1">
                  Confirm Your Profile Details
                </h1>
                <p className="text-xs text-text-secondary">
                  Review the details currently stored in your HireGo profile before applying.
                </p>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      Full Name
                    </span>
                    <span className="text-text-primary font-bold text-sm">
                      {profile?.user?.name || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      Email Address
                    </span>
                    <span className="text-text-primary font-bold text-sm">
                      {profile?.email || profile?.user?.email || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      Headline
                    </span>
                    <span className="text-text-primary">
                      {profile?.headline || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Profile status</span>
                    <span className="text-text-primary font-bold">{profile ? "Available" : "Not available"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold mb-2">
                    Skill Evidence
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.candidateSkills || []).map(
                      (skill: any) => (
                        <span
                          key={skill.id || skill.normalizedName || skill.name}
                          className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full font-semibold"
                        >
                          {skill.name} · {skill.verificationStatus === "VERIFIED" || skill.verificationStatus === "ASSESSMENT_VALIDATED" ? "validated" : "claimed"}
                        </span>
                      )
                    )}
                    {(!profile?.candidateSkills || profile.candidateSkills.length === 0) && <span className="text-text-secondary">No skill evidence recorded.</span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Link
                  href={`/jobs/${jobId}`}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-text-muted hover:text-white transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading || !profile || Boolean(profileLoadError) || Boolean(jobLoadError) || !jobTitle}
                  className="btn-3d-red disabled:opacity-50 disabled:cursor-not-allowed px-8 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-md"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-primary mb-1">
                  Screening Questions
                </h1>
                <p className="text-xs text-text-secondary">
                  HireGo will check the server-managed requirements for this job when you submit. If Skill Validation or a job-specific assessment is required, you will be taken to that step before the application workflow continues.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-text-secondary">
                No application answer is invented on this screen. Assessment requirements are assigned from the active job configuration after submission.
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-text-muted hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-3d-red px-8 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-md"
                >
                  <span>Review & Submit</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-primary mb-1">
                  Ready to Submit
                </h1>
                <p className="text-xs text-text-secondary">
                  Your application will be submitted to the employer for this active job listing.
                </p>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Target Job:</span>
                  <span className="text-text-primary font-bold">{jobTitle || "Job title not available"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Applicant:</span>
                  <span className="text-text-primary font-bold">{profile?.user?.name || "Not provided"}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-text-muted hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={submitting || loading || !profile || Boolean(profileLoadError) || Boolean(jobLoadError) || !jobTitle}
                  className="btn-3d-red px-10 py-3 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
