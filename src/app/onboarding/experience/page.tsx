"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, ExperienceEntry } from "@/context/OnboardingContext";

export default function ExperiencePage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [expList, setExpList] = useState<ExperienceEntry[]>(
    state.experience && state.experience.length > 0
      ? state.experience
      : []
  );

  const handleAdd = () => {
    setExpList([...expList, { company: "", role: "", startDate: "", endDate: "", description: "" }]);
  };

  const handleRemove = (index: number) => {
    setExpList(expList.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...expList];
    updated[index][field] = value;
    setExpList(updated);
  };

  const handleAiDescribe = (index: number) => {
    const role = expList[index].role || "Software Engineer";
    const company = expList[index].company || "Tech Operations";
    const aiText = `Describe your impact as ${role} at ${company}: led projects, improved outcomes, and collaborated with cross-functional teams.`;
    handleChange(index, "description", aiText);
  };

  const handleNext = () => {
    updateState({ experience: expList });
    markStepComplete(5);

    // Persist to backend
    fetch("/api/candidate/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experience: expList,
        experienceYears: expList.length * 1.5,
      }),
    }).catch(() => {});

    router.push("/onboarding/skills");
  };

  const handleSkip = () => {
    updateState({ experience: [] });
    markStepComplete(5);
    router.push("/onboarding/skills");
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
                Experience
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Career Trajectory & Accomplishments
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Professional Work Experience
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
              Work history
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          <div className="space-y-4">
            {expList.map((exp, idx) => (
              <div
                key={idx}
                className="rounded-3xl p-6 lg:p-8 space-y-5 shadow-2xl relative overflow-hidden transition-all"
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
                  <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>work</span>
                    Work Experience #{idx + 1}
                  </h3>
                  {expList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-xs font-bold transition-opacity hover:opacity-75"
                      style={{ color: "var(--primary)" }}
                    >
                      Remove Role
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                      COMPANY NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Vercel"
                      value={exp.company}
                      onChange={(e) => handleChange(idx, "company", e.target.value)}
                      className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                      JOB TITLE / ROLE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={exp.role}
                      onChange={(e) => handleChange(idx, "role", e.target.value)}
                      className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                      START DATE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jan 2021"
                      value={exp.startDate}
                      onChange={(e) => handleChange(idx, "startDate", e.target.value)}
                      className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                      END DATE / STATUS
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Present or Dec 2023"
                      value={exp.endDate}
                      onChange={(e) => handleChange(idx, "endDate", e.target.value)}
                      className="w-full h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
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
                  </div>
                </div>

                {/* Description & AI Enhancer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                      KEY RESPONSIBILITIES & ACHIEVEMENTS
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAiDescribe(idx)}
                      className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
                      style={{
                        backgroundColor: "var(--primary-container-bg)",
                        color: "var(--primary)",
                        border: "1px solid var(--primary)",
                      }}
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Enhance with AI
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={exp.description}
                    onChange={(e) => handleChange(idx, "description", e.target.value)}
                    placeholder="Describe impact, tech stack, scale, and leadership..."
                    className="w-full p-4 rounded-2xl outline-none text-xs font-semibold transition-all custom-scrollbar resize-none"
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
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full h-12 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-bold text-xs transition-all"
            style={{
              borderColor: "var(--outline)",
              backgroundColor: "var(--surface-container-high)",
              color: "var(--text-primary)",
            }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>add_circle</span>
            Add Another Work Experience
          </button>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/education"
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
              <span>Next: Skills Matrix</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
