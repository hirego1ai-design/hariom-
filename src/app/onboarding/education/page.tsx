"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, EducationEntry } from "@/context/OnboardingContext";

export default function EducationPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [eduList, setEduList] = useState<EducationEntry[]>(
    state.education && state.education.length > 0
      ? state.education
      : [{ degree: "B.S. Computer Science", university: "Stanford University", year: "2020", gpa: "3.8 / 4.0" }]
  );

  const handleAdd = () => {
    setEduList([...eduList, { degree: "", university: "", year: "", gpa: "" }]);
  };

  const handleRemove = (index: number) => {
    setEduList(eduList.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...eduList];
    updated[index][field] = value;
    setEduList(updated);
  };

  const handleNext = () => {
    updateState({ education: eduList });
    markStepComplete(4);
    router.push("/onboarding/experience");
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
                Onboarding Step 4/10
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Academic Background & Qualifications
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Education & Credentials
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
              Step 4 of 10
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          <div className="space-y-4">
            {eduList.map((edu, idx) => (
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
                    <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>school</span>
                    Degree / Qualification #{idx + 1}
                  </h3>
                  {eduList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-xs font-bold transition-opacity hover:opacity-75"
                      style={{ color: "var(--primary)" }}
                    >
                      Remove Entry
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                      DEGREE / FIELD OF STUDY
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.S. Computer Science"
                      value={edu.degree}
                      onChange={(e) => handleChange(idx, "degree", e.target.value)}
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
                      INSTITUTION / UNIVERSITY
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={edu.university}
                      onChange={(e) => handleChange(idx, "university", e.target.value)}
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
                      GRADUATION YEAR
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2022"
                      value={edu.year}
                      onChange={(e) => handleChange(idx, "year", e.target.value)}
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
                      GRADE / GPA (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3.8 / 4.0 or 88%"
                      value={edu.gpa}
                      onChange={(e) => handleChange(idx, "gpa", e.target.value)}
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
            Add Another Education Entry
          </button>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/personal-details"
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
              <span>Next: Work Experience</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}