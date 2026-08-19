"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

export default function PreferencesPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [desiredCategory, setDesiredCategory] = useState("");
  const [preferredTitles, setPreferredTitles] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [employmentBasis, setEmploymentBasis] = useState<"Permanent" | "Contractual" | "Part-time" | "Freelance" | "">("");
  const [shiftTiming, setShiftTiming] = useState<"Day" | "Night" | "Flexible" | "">("");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [interviewLanguage, setInterviewLanguage] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");

  React.useEffect(() => {
    fetch("/api/candidate/profile")
      .then((res) => res.json())
      .then((data) => {
        const preferences = data.profile?.preferences;
        if (!preferences) return;
        setDesiredCategory(preferences.desiredCategory || "");
        setPreferredTitles(Array.isArray(preferences.preferredTitles) ? preferences.preferredTitles : []);
        setPreferredLocations(Array.isArray(preferences.preferredLocations) ? preferences.preferredLocations : []);
        setEmploymentBasis(preferences.employmentBasis || "");
        setShiftTiming(preferences.shiftTiming || "");
        setAvailabilityDate(preferences.availabilityDate || "");
        setTimeZone(preferences.timeZone || "");
        setInterviewLanguage(preferences.interviewLanguage || "");
        setSalaryCurrency(preferences.salaryCurrency || "");
        setSalaryExpectation(preferences.salaryExpectation || "");
      })
      .catch(() => {});
  }, []);

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

  const savePreferences = async () => {
    const preferences = {
      desiredCategory,
      preferredTitles,
      preferredLocations,
      employmentBasis,
      shiftTiming,
      availabilityDate,
      timeZone,
      interviewLanguage,
      salaryCurrency,
      salaryExpectation,
    };
    updateState({});
    await fetch("/api/candidate/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences }),
    });
  };

  const handleNext = async () => {
    await savePreferences();
    markStepComplete(9);
    router.push("/onboarding/baseline-assessment");
  };

  const handleSkip = async () => {
    await savePreferences();
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
                Preferences
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

          <div className="hidden" aria-hidden="true">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              Availability & role
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

            {/* Availability & interview setup */}
            <div className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--outline)" }}>
              <div>
                <h3 className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>Availability & Interview Setup</h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Optional now. You can update these details later from your profile.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                  Available from
                  <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold" style={{ backgroundColor: "var(--bg-input)", border: "1.5px solid var(--outline)", color: "var(--text-primary)" }} />
                </label>
                <label className="space-y-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                  Time zone
                  <input type="text" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} placeholder="e.g. Asia/Kolkata or America/New_York" className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold" style={{ backgroundColor: "var(--bg-input)", border: "1.5px solid var(--outline)", color: "var(--text-primary)" }} />
                </label>
                <label className="space-y-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                  Interview language
                  <input type="text" value={interviewLanguage} onChange={(e) => setInterviewLanguage(e.target.value)} placeholder="e.g. English, Spanish, Hindi" className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold" style={{ backgroundColor: "var(--bg-input)", border: "1.5px solid var(--outline)", color: "var(--text-primary)" }} />
                </label>
                <label className="space-y-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                  Salary expectation
                  <div className="flex gap-2">
                    <input type="text" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value.toUpperCase())} placeholder="USD" className="w-24 h-11 px-4 rounded-full outline-none text-xs font-semibold" style={{ backgroundColor: "var(--bg-input)", border: "1.5px solid var(--outline)", color: "var(--text-primary)" }} />
                    <input type="text" value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} placeholder="Annual or hourly range" className="flex-1 h-11 px-4 rounded-full outline-none text-xs font-semibold" style={{ backgroundColor: "var(--bg-input)", border: "1.5px solid var(--outline)", color: "var(--text-primary)" }} />
                  </div>
                </label>
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
              <span>Next: AI Baseline Assessment</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
