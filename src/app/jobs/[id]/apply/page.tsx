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
  const [answers, setAnswers] = useState({
    noticePeriod: "Immediate / 15 Days",
    experienceYears: "4",
    whyJoin: "",
  });

  useEffect(() => {
    fetch("/api/candidate/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitApplication = async () => {
    if (!jobId) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to submit application. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push("/jobs/apply/success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />

      <main className="flex-1 ml-[100px] lg:ml-[116px] p-6 lg:p-10 max-w-5xl">
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
              Screening Questions
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
                  Your verified HireGo credentials will be submitted to the hiring team.
                </p>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      Full Name
                    </span>
                    <span className="text-text-primary font-bold text-sm">
                      {profile?.name || "Candidate"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      Email Address
                    </span>
                    <span className="text-text-primary font-bold text-sm">
                      {profile?.email || profile?.user?.email || "candidate@hirego.ai"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      Headline
                    </span>
                    <span className="text-text-primary">
                      {profile?.headline || "Senior Software Professional"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">
                      HireGo Score™
                    </span>
                    <span className="text-green-400 font-bold">
                      {profile?.hireGoScore || 92} / 100
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold mb-2">
                    Verified Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills || ["React", "TypeScript", "Next.js", "AI"]).map(
                      (skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full font-semibold"
                        >
                          {skill}
                        </span>
                      )
                    )}
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
                  className="btn-3d-red px-8 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-md"
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
                  Please provide preliminary information for the hiring team.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-text-muted font-bold block">
                    What is your current notice period?
                  </label>
                  <select
                    value={answers.noticePeriod}
                    onChange={(e) =>
                      setAnswers({ ...answers, noticePeriod: e.target.value })
                    }
                    className="input-pill w-full h-11 px-4 text-xs text-text-primary"
                  >
                    <option value="Immediate" className="bg-[#181818]">Immediate</option>
                    <option value="15 Days" className="bg-[#181818]">15 Days</option>
                    <option value="30 Days" className="bg-[#181818]">30 Days</option>
                    <option value="60+ Days" className="bg-[#181818]">60+ Days</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted font-bold block">
                    Total relevant years of experience in this role:
                  </label>
                  <input
                    type="number"
                    value={answers.experienceYears}
                    onChange={(e) =>
                      setAnswers({ ...answers, experienceYears: e.target.value })
                    }
                    className="input-pill w-full h-11 px-4 text-xs text-text-primary"
                    placeholder="e.g. 5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted font-bold block">
                    Why are you interested in this position? (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={answers.whyJoin}
                    onChange={(e) =>
                      setAnswers({ ...answers, whyJoin: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-text-primary outline-none focus:border-primary transition-all"
                    placeholder="Tell the hiring manager why you'd be a great fit..."
                  />
                </div>
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
                  Your application will be processed by HireGo AI pipeline and forwarded directly to the employer.
                </p>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Target Job:</span>
                  <span className="text-text-primary font-bold">Senior Engineering Role</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Applicant:</span>
                  <span className="text-text-primary font-bold">{profile?.name || "Candidate"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Notice Period:</span>
                  <span className="text-text-primary">{answers.noticePeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Experience:</span>
                  <span className="text-text-primary">{answers.experienceYears} Years</span>
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
                  disabled={submitting}
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