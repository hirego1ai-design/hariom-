"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(state.resumeAnalysis);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
        setUploadError("Please upload a PDF or Word document up to 10MB.");
        return;
      }
      setFileName(file.name);
      setAnalyzing(true);

      try {
        // Upload to /api/upload
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("category", "resumes");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.file?.url) {
          throw new Error(uploadJson.error || "Resume upload failed");
        }
        const fileUrl = uploadJson.file.url;

        const profileRes = await fetch("/api/candidate/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeUrl: fileUrl,
          }),
        });
        const profileJson = await profileRes.json();
        if (!profileRes.ok || !profileJson.success) {
          throw new Error(profileJson.error || "Resume could not be saved to your profile.");
        }

        // Do not invent an AI score from a filename. Resume analysis is enabled
        // only when a private-file parsing provider is configured.
        setAnalysis(null);
        updateState({ resumeUploaded: true, resumeAnalysis: null });
      } catch (err) {
        setFileName(null);
        setUploadError(err instanceof Error ? err.message : "Resume upload failed. Please try again.");
      } finally {
        setAnalyzing(false);
      }
    }
  };


  const handleNext = () => {
    markStepComplete(7);
    router.push("/onboarding/video-resume");
  };

  const handleSkip = () => {
    updateState({ resumeUploaded: false, resumeAnalysis: null });
    markStepComplete(7);
    router.push("/onboarding/video-resume");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        {/* Google-Style Ambient Lining Background & Quad Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35 ml-[116px]" />
        <div
          className="fixed inset-0 pointer-events-none -z-10 ml-[116px]"
          style={{
            background:
              "radial-gradient(ellipse at 85% 15%, rgba(66,133,244,0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(234,67,53,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 10%, rgba(251,188,5,0.06) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(52,168,83,0.08) 0%, transparent 50%)",
          }}
        />

        {/* Top Header */}
        <header
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-8 flex items-center justify-center text-center"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--primary-container-bg)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                }}
              >
                Resume upload
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Secure profile storage
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Resume upload
            </h1>
          </div>

          <div className="hidden" aria-hidden="true">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              Upload or import
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          {/* Main Upload Bento Card */}
          <div
            className="rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-sidebar)",
            }}
          >
            {/* Google Multi-Color Top Border Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 z-20"
              style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }}
            />

            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline)" }}>
              <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>description</span>
                PDF / DOCX Resume Ingestion
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Maximum 10MB
              </span>
            </div>

            {/* Drop Zone Box */}
            <div
              className="p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 cursor-pointer relative overflow-hidden group transition-all"
              style={{
                borderColor: "var(--outline)",
                backgroundColor: "var(--surface-container-low)",
              }}
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileDrop}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "var(--shadow-btn-red)",
                }}
              >
                <span className="material-symbols-outlined text-white text-[28px]">upload_file</span>
              </div>

              <div>
                <p className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>
                  {fileName ? fileName : "Drag & drop your resume file here"}
                </p>
                <p className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)" }}>
                  Supports PDF or Word format (.pdf, .docx)
                </p>
              </div>
            </div>

            {/* Parsing Progress State */}
            {analyzing && (
              <div className="p-4 rounded-2xl border space-y-2 flex items-center gap-3" style={{ backgroundColor: "var(--primary-container-bg)", borderColor: "var(--primary)" }}>
                <span className="material-symbols-outlined text-[20px] animate-spin" style={{ color: "var(--primary)" }}>progress_activity</span>
                <div>
                  <p className="font-extrabold text-xs" style={{ color: "var(--primary)" }}>Uploading your resume…</p>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Saving it securely to your candidate profile</p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-2xl border text-xs font-semibold" style={{ backgroundColor: "rgba(229,57,53,0.08)", borderColor: "var(--primary)", color: "var(--primary)" }}>
                {uploadError}
              </div>
            )}

            {/* Analysis Results */}
            {analysis && !analyzing && (
              <div
                className="p-6 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  borderColor: "var(--outline)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-green-light, #2E7D32)" }}>verified</span>
                    <h3 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>AI Quality Score Breakdown</h3>
                  </div>
                  <span className="text-lg font-extrabold font-mono" style={{ color: "var(--color-green-light, #2E7D32)" }}>
                    {analysis.qualityScore} / 100
                  </span>
                </div>

                <p className="text-xs font-semibold leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {analysis.summary}
                </p>

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest block" style={{ color: "var(--text-muted)" }}>
                    Extracted Skills:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: "var(--surface-container-high)",
                          border: "1px solid var(--outline)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/skills"
              className="px-6 h-11 rounded-full font-bold text-xs flex items-center gap-2 transition-all border"
              style={{
                backgroundColor: "var(--surface-container-high)",
                borderColor: "var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </Link>

            <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="px-5 h-11 rounded-full font-bold text-xs border transition-all"
              style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)", color: "var(--text-secondary)" }}
            >
              Skip for now
            </button>
            <button
              onClick={handleNext}
              className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              <span>Next: Video Pitch Setup</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
