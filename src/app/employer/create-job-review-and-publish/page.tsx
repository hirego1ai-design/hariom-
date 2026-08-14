"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployer } from "@/context/EmployerContext";

export default function EmployerCreateJobReviewAndPublishPage() {
  const router = useRouter();
  const { draftJob, addJob } = useEmployer();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<{
    jobPostsLeft: number;
    message: string;
  } | null>(null);
  const [idempotencyKey] = useState(() => `idemp-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          title: draftJob.title || "Senior Full-Stack Engineer (AI focus)",
          company: draftJob.company || "HireGo AI",
          location: draftJob.location || "London, UK / Remote",
          salary: draftJob.salary || "£85,000 - £120,000",
          type: draftJob.type || "Full-time",
          status: "ACTIVE",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish job listing.");
      }

      // Add to local context state
      addJob(data.job);

      // Show publication success modal
      setPublishSuccess({
        jobPostsLeft: data.jobPostsLeft ?? 0,
        message: data.message || "Job published successfully!",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {/* Publication Confirmation Modal */}
      {publishSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#16161B] border border-emerald-500/30 p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white font-display">Job Published Successfully!</h3>
              <p className="text-xs text-slate-300 mt-2">
                {publishSuccess.message}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-around text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Used</span>
                <span className="text-red-400 font-extrabold text-sm">-1 Credit</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Quota</span>
                <span className="text-emerald-400 font-extrabold text-sm">{publishSuccess.jobPostsLeft} Credits</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/employer/dashboard")}
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#FF5252] text-white shadow-lg hover:bg-[#E53935] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1000px] mx-auto mt-stack-lg px-margin-mobile md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
          <div>
            <nav className="flex items-center gap-2 text-text-muted mb-2">
              <span className="text-label-md font-label-md">Create Job</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-label-md font-label-md text-primary">Step 6: Review &amp; Publish</span>
            </nav>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
              Final Job Review
            </h1>
          </div>
          <div className="flex gap-stack-md">
            <button className="h-[50px] px-8 rounded-full bg-[#1E1E1E] border border-white/10 text-primary font-label-md hover:bg-white/5 transition-all">
              Save as Draft
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-6 flex items-center justify-between">
            <span>{errorMsg}</span>
            {errorMsg.includes("credits") && (
              <button
                onClick={() => router.push("/employer/subscriptions")}
                className="px-3 py-1 rounded-lg bg-red-500 text-white text-[11px]"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div className="md:col-span-8 flex flex-col gap-gutter">
            <div className="glass-card rounded-lg p-stack-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-stack-md">
                <span className="bg-surface-container-highest text-primary px-3 py-1 rounded-full text-[12px] font-label-md flex items-center gap-1 border border-white/10">
                  <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  AI-Optimized
                </span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-primary text-3xl">business</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">
                    {draftJob.title || "Senior Full-Stack Engineer (AI focus)"}
                  </h2>
                  <p className="text-text-secondary">
                    HireGo AI • Engineering • {draftJob.location || "London, UK / Remote"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-bg-subtle text-on-surface-variant px-4 py-1.5 rounded-full text-label-md">
                  £85k — £120k
                </span>
                <span className="bg-bg-subtle text-on-surface-variant px-4 py-1.5 rounded-full text-label-md">
                  {draftJob.type || "Full-time"}
                </span>
                <span className="bg-bg-subtle text-on-surface-variant px-4 py-1.5 rounded-full text-label-md">
                  Equity Options
                </span>
              </div>
            </div>

            <div className="glass-card rounded-lg overflow-hidden">
              <div className="p-stack-lg flex flex-col gap-stack-lg">
                <section>
                  <h3 className="font-headline-md text-[20px] text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">school</span> Skills Required
                  </h3>
                  <div className="flex flex-wrap gap-2 text-body-md text-on-surface-variant">
                    {draftJob.skills && draftJob.skills.length > 0 ? (
                      draftJob.skills.map((skill, index) => (
                        <span key={index} className="bg-surface-container-low px-3 py-1 rounded-full border border-white/5">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="bg-surface-container-low px-3 py-1 rounded-full border border-white/5">React.js</span>
                        <span className="bg-surface-container-low px-3 py-1 rounded-full border border-white/5">TypeScript</span>
                        <span className="bg-surface-container-low px-3 py-1 rounded-full border border-white/5">System Design</span>
                      </>
                    )}
                  </div>
                </section>
                <section>
                  <h3 className="font-headline-md text-[20px] text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">card_giftcard</span> Benefits
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
                      <span className="material-symbols-outlined text-secondary">medical_services</span>
                      <span className="text-label-md">Premium Private Healthcare</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
                      <span className="material-symbols-outlined text-secondary">laptop_mac</span>
                      <span className="text-label-md">Personalized Tech Stipend</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="sticky top-[104px] flex flex-col gap-6">
              <div className="glass-card rounded-lg p-stack-lg">
                <h4 className="font-headline-md text-[18px] text-primary mb-6">Deployment Config</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-text-secondary text-label-md">Job Visibility</span>
                    <span className="text-primary text-label-md font-bold">Public (HireGo &amp; Google Jobs)</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-text-secondary text-label-md">AI Screening</span>
                    <span className="text-green text-label-md font-bold">Active</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-lg p-stack-lg border-primary/20">
                <p className="text-body-md text-on-surface-variant mb-6 text-center italic">
                  "Ready to find your next great hire? Review the details one last time. Publishing will consume 1 job credit."
                </p>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full h-[56px] rounded-full btn-primary-red text-white font-headline-md text-[18px] flex items-center justify-center gap-2 mb-4 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    publish
                  </span>
                  {isPublishing ? "Publishing..." : "Publish Job Now (1 Credit)"}
                </button>
                <p className="text-[12px] text-text-muted text-center leading-tight">
                  By publishing, you agree to our Terms of Service and Credit Usage Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
