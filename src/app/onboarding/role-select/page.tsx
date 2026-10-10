"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, type CandidateRole } from "@/context/OnboardingContext";
import { searchRoles } from "@/lib/skill-master";

const roles: { id: CandidateRole; title: string; desc: string; icon: string; color: string }[] = [
  { id: "fresher", title: "Fresher / Graduate", desc: "Starting my professional career", icon: "workspace_premium", color: "#EA4335" },
  { id: "experienced", title: "Experienced Professional", desc: "Ready for my next career move", icon: "work", color: "#FBBC05" },
  { id: "intern", title: "Internship Seeker", desc: "Looking for hands-on experience", icon: "badge", color: "#AB47BC" },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<CandidateRole | null>(state.candidateRole);
  const [targetRole, setTargetRole] = useState(state.targetRole);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const hasEdited = useRef(false);

  // Only fetch the small role preferences, not applications or assessment evidence.
  // Never overwrite a field the candidate has already started editing.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/candidate/profile?view=role", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success || !body.profile || hasEdited.current) return;
        const preferences = body.profile.preferences && typeof body.profile.preferences === "object"
          && !Array.isArray(body.profile.preferences) ? body.profile.preferences : {};
        if (roles.some((option) => option.id === preferences.candidateRole)) {
          setSelectedRole(preferences.candidateRole as CandidateRole);
        }
        if (typeof preferences.targetRole === "string") setTargetRole(preferences.targetRole);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // The catalog is already bundled with the skill mapping. Search it instantly
  // in the browser instead of starting a request for every keystroke.
  const roleOptions = useMemo(
    () => targetRole.trim() ? searchRoles(targetRole) : [],
    [targetRole],
  );

  const chooseRole = (value: string) => {
    hasEdited.current = true;
    setTargetRole(value);
    setRoleMenuOpen(false);
    setActiveOption(0);
  };

  const handleRoleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setRoleMenuOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!roleOptions.length) return;
      event.preventDefault();
      setRoleMenuOpen(true);
      setActiveOption((index) => event.key === "ArrowDown"
        ? (index + 1) % roleOptions.length
        : (index - 1 + roleOptions.length) % roleOptions.length);
    }
    if (event.key === "Enter" && roleMenuOpen && roleOptions.length) {
      event.preventDefault();
      chooseRole(roleOptions[Math.min(activeOption, roleOptions.length - 1)].title);
    }
  };

  const handleNext = async () => {
    if (!selectedRole || !targetRole.trim() || isSaving) return;
    const normalizedTargetRole = targetRole.trim();
    setIsSaving(true);
    setSaveError("");
    setRoleMenuOpen(false);
    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { candidateRole: selectedRole, targetRole: normalizedTargetRole } }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error("Profile save failed");
      updateState({ candidateRole: selectedRole, targetRole: normalizedTargetRole });
      markStepComplete(2);
      router.push("/onboarding/personal-details");
    } catch {
      setSaveError("We could not save your role. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <div className="flex-1 min-w-0 min-h-[100dvh] relative">
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35" />
        <main className="min-h-[100dvh] max-w-[1080px] w-full mx-auto flex flex-col justify-center px-4 py-5 sm:px-6 lg:px-8 lg:py-4">
          <header className="text-center mx-auto mb-4 lg:mb-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--primary)" }}>Your career profile · Step 2</p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>Where are you in your career?</h1>
            <p className="text-xs sm:text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>Choose your career stage and search for your job role.</p>
          </header>

          <section className="rounded-[24px] p-4 sm:p-5 lg:p-6 relative" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--outline)", boxShadow: "0 14px 35px rgba(0,0,0,0.2)" }}>
            <div className="absolute top-0 left-4 right-4 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }} />
            <p className="text-xs font-extrabold mb-3" style={{ color: "var(--text-secondary)" }}>1. Select your career stage</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:gap-3">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { hasEdited.current = true; setSelectedRole(role.id); }}
                    className="min-h-[74px] sm:min-h-[146px] lg:min-h-[150px] p-3 sm:p-4 rounded-[18px] border transition-colors relative focus:outline-none focus-visible:ring-2 text-left sm:text-center flex sm:flex-col items-center sm:justify-center gap-3"
                    style={{ backgroundColor: isSelected ? "var(--primary-container-bg)" : "var(--surface-container-high)", borderColor: isSelected ? "var(--primary)" : "var(--outline)" }}
                  >
                    {isSelected && <span className="material-symbols-outlined absolute top-2 right-2 text-[18px]" style={{ color: "var(--primary)" }}>check_circle</span>}
                    <span className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl flex items-center justify-center border" style={{ background: isSelected ? "var(--primary)" : "var(--bg-card)", borderColor: "var(--outline)", color: isSelected ? "#fff" : role.color }}>
                      <span className="material-symbols-outlined text-[25px]">{role.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>{role.title}</span>
                      <span className="block text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{role.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t relative" style={{ borderColor: "var(--outline)" }}>
              <label htmlFor="target-job-role" className="block text-xs font-extrabold mb-1.5" style={{ color: "var(--text-primary)" }}>
                2. Target or current job role
              </label>
              <p className="text-xs mb-2.5" style={{ color: "var(--text-muted)" }}>
                Start typing (e.g. “software”, “HR”, “sales”). Pick a suggested role to prepare relevant skills automatically.
              </p>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[19px]" style={{ color: "var(--text-muted)" }}>search</span>
                <input
                  id="target-job-role"
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="target-role-options"
                  aria-expanded={roleMenuOpen && roleOptions.length > 0}
                  aria-activedescendant={roleMenuOpen && roleOptions.length ? "target-role-option-" + Math.min(activeOption, roleOptions.length - 1) : undefined}
                  value={targetRole}
                  onChange={(event) => { hasEdited.current = true; setTargetRole(event.target.value); setRoleMenuOpen(true); setActiveOption(0); }}
                  onFocus={() => setRoleMenuOpen(true)}
                  onBlur={() => setRoleMenuOpen(false)}
                  onKeyDown={handleRoleKeyDown}
                  placeholder="Start typing a job role"
                  autoComplete="off"
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none focus:ring-2"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--outline)", color: "var(--text-primary)" }}
                />
                {roleMenuOpen && targetRole.trim() && (
                  <div id="target-role-options" role="listbox" aria-label="Matching job roles" className="absolute z-30 top-[48px] left-0 right-0 max-h-48 overflow-y-auto rounded-xl border shadow-2xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--outline)" }}>
                    {roleOptions.length ? roleOptions.map((option, index) => (
                      <button
                        id={"target-role-option-" + index}
                        key={option.title}
                        role="option"
                        aria-selected={activeOption === index}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseRole(option.title)}
                        className="w-full px-4 py-2.5 text-left border-b last:border-b-0 focus:outline-none"
                        style={{ borderColor: "var(--outline)", backgroundColor: activeOption === index ? "var(--surface-container-high)" : "var(--bg-card)" }}
                      >
                        <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>{option.title}</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{option.department} · {option.industry}</span>
                      </button>
                    )) : <p className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>No exact match. You can still enter your own job title.</p>}
                  </div>
                )}
              </div>
              {saveError && <p role="alert" className="text-xs font-semibold mt-2" style={{ color: "var(--primary)" }}>{saveError}</p>}
            </div>
          </section>

          <footer className="flex items-center justify-between gap-3 pt-4">
            <Link href="/onboarding/welcome" className="px-5 h-11 rounded-xl font-bold text-xs flex items-center gap-2 border" style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)", color: "var(--text-primary)" }}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back
            </Link>
            <button type="button" onClick={() => void handleNext()} disabled={!selectedRole || !targetRole.trim() || isSaving} className="px-6 h-11 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 disabled:opacity-45 focus-visible:ring-2" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}>
              {isSaving ? "Saving…" : "Continue"}<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
