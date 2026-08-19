"use client";

import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, CandidateRole } from "@/context/OnboardingContext";
import type { RoleDefinition } from "@/lib/skill-master";

const roles: { id: CandidateRole; title: string; desc: string; icon: string; color: string }[] = [
  { id: "fresher", title: "Fresher / Graduate", desc: "Recently graduated and looking for entry-level opportunities.", icon: "workspace_premium", color: "#EA4335" },
  { id: "experienced", title: "Experienced Professional", desc: "A working professional ready for the next career move.", icon: "work", color: "#FBBC05" },
  { id: "intern", title: "Internship Seeker", desc: "Looking for practical industry experience and mentorship.", icon: "badge", color: "#AB47BC" },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<CandidateRole | null>(state.candidateRole);
  const [targetRole, setTargetRole] = useState(state.targetRole);
  const [roleOptions, setRoleOptions] = useState<RoleDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setSelectedRole(state.candidateRole);
    setTargetRole(state.targetRole);
  }, [state.candidateRole, state.targetRole]);

  useEffect(() => {
    if (!targetRole.trim()) {
      setRoleOptions([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/skill-master?type=roles&q=${encodeURIComponent(targetRole)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { roles: [] })
      .then((data) => setRoleOptions(data.roles || []))
      .catch(() => setRoleOptions([]));
    return () => controller.abort();
  }, [targetRole]);

  const handleNext = async () => {
    if (!selectedRole || !targetRole.trim() || isSaving) return;
    const normalizedTargetRole = targetRole.trim();
    setIsSaving(true);
    setSaveError("");
    updateState({ candidateRole: selectedRole, targetRole: normalizedTargetRole });
    markStepComplete(2);
    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { candidateRole: selectedRole, targetRole: normalizedTargetRole } }),
      });
      if (!response.ok) throw new Error("Profile save failed");
      router.push("/onboarding/personal-details");
    } catch {
      setSaveError("We could not save your role. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] min-w-0 min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35 ml-[116px]" />
        <div className="fixed inset-0 pointer-events-none -z-10 ml-[116px]" style={{ background: "radial-gradient(ellipse at 82% 16%, rgba(66,133,244,0.12) 0%, transparent 52%), radial-gradient(ellipse at 15% 85%, rgba(234,67,53,0.1) 0%, transparent 48%)" }} />

        <main className="min-h-screen px-6 py-10 lg:px-12 lg:py-14 max-w-[1120px] w-full mx-auto flex flex-col justify-center">
          <header className="text-center max-w-2xl mx-auto mb-9">
            <div className="w-16 h-16 rounded-[22px] mx-auto mb-5 flex items-center justify-center border" style={{ background: "linear-gradient(145deg, var(--primary-container-bg), var(--surface-container-high))", borderColor: "var(--outline)", boxShadow: "0 12px 26px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)" }}>
              <span className="material-symbols-outlined text-[30px]" style={{ color: "var(--primary)" }}>person_search</span>
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--primary)" }}>Your career profile</p>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>Where are you in your career?</h1>
            <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>Choose the option that best describes you today.</p>
          </header>

          <section className="rounded-[32px] p-5 sm:p-7 lg:p-8 relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--outline)", boxShadow: "0 22px 50px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)} className="min-h-[270px] p-6 rounded-[28px] border transition-all relative overflow-hidden group hover:-translate-y-1 focus:outline-none focus-visible:ring-2 text-center flex flex-col items-center justify-center" style={{ backgroundColor: isSelected ? "var(--primary-container-bg)" : "var(--surface-container-high)", borderColor: isSelected ? "var(--primary)" : "var(--outline)", boxShadow: isSelected ? "0 18px 34px rgba(230,57,70,0.2), inset 0 1px 0 rgba(255,255,255,0.12)" : "0 13px 26px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                    {isSelected && <><div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--primary)" }} /><span className="material-symbols-outlined absolute top-4 right-4 text-[22px]" style={{ color: "var(--primary)" }}>check_circle</span></>}
                    <span className="w-[76px] h-[76px] rounded-[26px] flex items-center justify-center mb-5 border transition-transform group-hover:scale-105" style={{ background: isSelected ? "linear-gradient(145deg, var(--primary), var(--primary-dim))" : "linear-gradient(145deg, var(--bg-card), var(--surface-container-high))", color: isSelected ? "#fff" : role.color, borderColor: isSelected ? "rgba(255,255,255,0.18)" : "var(--outline)", boxShadow: isSelected ? "0 12px 20px rgba(230,57,70,0.28), inset 0 1px 0 rgba(255,255,255,0.25)" : "0 10px 18px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                      <span className="material-symbols-outlined text-[35px]">{role.icon}</span>
                    </span>
                    <span>
                      <span className="block font-extrabold text-base" style={{ color: "var(--text-primary)" }}>{role.title}</span>
                      <span className="block text-xs leading-relaxed mt-2 max-w-[210px]" style={{ color: "var(--text-secondary)" }}>{role.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 pt-7 border-t relative" style={{ borderColor: "var(--outline)" }}>
              <label htmlFor="target-job-role" className="block text-center text-sm font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
                What job role should your profile target?
              </label>
              <p className="text-center text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                This role will automatically prepare relevant skill suggestions later in onboarding.
              </p>
              <div className="relative max-w-xl mx-auto">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "var(--text-muted)" }}>work</span>
                <input
                  id="target-job-role"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Search a role, e.g. Customer Support Executive"
                  autoComplete="off"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl text-sm outline-none focus:ring-2"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--outline)", color: "var(--text-primary)" }}
                />
                {targetRole.trim() && roleOptions.length > 0 && (
                  <div className="absolute z-30 top-[54px] left-0 right-0 max-h-52 overflow-y-auto rounded-2xl border shadow-2xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--outline)" }}>
                    {roleOptions.map((option) => (
                      <button
                        key={`${option.title}-${option.department}`}
                        type="button"
                        onClick={() => { setTargetRole(option.title); setRoleOptions([]); }}
                        className="w-full px-4 py-3 text-left border-b last:border-b-0 hover:opacity-80"
                        style={{ borderColor: "var(--outline)" }}
                      >
                        <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>{option.title}</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{option.department} · {option.industry}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {saveError && <p role="alert" className="text-center text-xs font-semibold mt-3" style={{ color: "var(--primary)" }}>{saveError}</p>}
            </div>
          </section>

          <footer className="flex items-center justify-between pt-7 mt-7">
            <Link href="/onboarding/welcome" className="px-6 h-12 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all border hover:-translate-y-0.5" style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)", color: "var(--text-primary)", boxShadow: "0 7px 14px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back
            </Link>
            <button onClick={() => void handleNext()} disabled={!selectedRole || !targetRole.trim() || isSaving} className="px-8 h-12 rounded-2xl text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-45 disabled:hover:translate-y-0" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))", boxShadow: "0 9px 0 rgba(126,20,29,0.95), 0 14px 25px rgba(230,57,70,0.22), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
              {isSaving ? "Saving…" : "Continue"}<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
