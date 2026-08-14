"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

export default function PreferencesPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [desiredCategory, setDesiredCategory] = useState("Software Engineering");
  const [preferredTitles, setPreferredTitles] = useState(["Senior Fullstack Engineer", "System Architect"]);
  const [newTitle, setNewTitle] = useState("");
  const [preferredLocations, setPreferredLocations] = useState(["San Francisco, CA", "Remote - Global"]);
  const [newLocation, setNewLocation] = useState("");
  const [employmentBasis, setEmploymentBasis] = useState<"Permanent" | "Contractual" | "Part-time" | "Freelance">("Permanent");
  const [shiftTiming, setShiftTiming] = useState<"Day" | "Night" | "Flexible">("Day");

  const handleAddTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      setPreferredTitles([...preferredTitles, newTitle.trim()]);
      setNewTitle("");
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocation.trim()) {
      setPreferredLocations([...preferredLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const handleNext = () => {
    markStepComplete(9);
    router.push("/onboarding/baseline-assessment");
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
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-8 flex items-center justify-between"
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
                Onboarding Step 9/10
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Target Compensation, Work Type & Location
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Job & Career Preferences
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              Step 9 of 10
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          {/* Main Preferences Bento Card */}
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
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>tune</span>
                Recruiter Radar Preferences
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Ranks 2,400+ Live Openings
              </span>
            </div>

            {/* Target Job Titles */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                PREFERRED JOB TITLES
              </label>

              <form onSubmit={handleAddTitle} className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead Frontend Architect..."
                  className="flex-1 h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1.5px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--outline)";
                  }}
                />
                <button
                  type="submit"
                  className="px-5 h-11 rounded-full text-white text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  Add Title
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1">
                {preferredTitles.map((t) => (
                  <span
                    key={t}
                    className="px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 border"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      borderColor: "var(--outline)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setPreferredTitles(preferredTitles.filter((item) => item !== t))}
                      className="hover:opacity-75 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Target Locations */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                PREFERRED LOCATIONS
              </label>

              <form onSubmit={handleAddLocation} className="flex gap-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. New York, Remote - Global..."
                  className="flex-1 h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1.5px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--outline)";
                  }}
                />
                <button
                  type="submit"
                  className="px-5 h-11 rounded-full text-white text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all"
                  style={{
                    background: "linear-gradient(135deg, var(--secondary), var(--secondary-dim))",
                  }}
                >
                  Add Location
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1">
                {preferredLocations.map((l) => (
                  <span
                    key={l}
                    className="px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 border"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      borderColor: "var(--outline)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => setPreferredLocations(preferredLocations.filter((item) => item !== l))}
                      className="hover:opacity-75 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Employment Basis Options */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                EMPLOYMENT BASIS
              </label>
              <div className="flex flex-wrap gap-2.5">
                {(["Permanent", "Contractual", "Part-time", "Freelance"] as const).map((b) => {
                  const isSel = employmentBasis === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setEmploymentBasis(b)}
                      className="px-5 py-2 rounded-full text-xs font-extrabold border transition-all"
                      style={{
                        backgroundColor: isSel ? "var(--primary-container-bg)" : "var(--surface-container-high)",
                        borderColor: isSel ? "var(--primary)" : "var(--outline)",
                        color: isSel ? "var(--primary)" : "var(--text-primary)",
                      }}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/video-resume"
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

            <button
              onClick={handleNext}
              className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              <span>Next: AI Baseline Assessment</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}