"use client";

import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, SkillEntry } from "@/context/OnboardingContext";
import RoleSkillSelector, { SelectedRoleSkill } from "@/components/skills/RoleSkillSelector";

export default function SkillsPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();
  const [skills, setSkills] = useState<SkillEntry[]>(state.skills || []);
  const [targetRole, setTargetRole] = useState(state.targetRole || "");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/candidate/profile", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success || !body.profile || cancelled) return;
        const preferences = body.profile.preferences && typeof body.profile.preferences === "object"
          ? body.profile.preferences
          : {};
        const savedTargetRole = typeof preferences.targetRole === "string"
          ? preferences.targetRole
          : "";
        setTargetRole(savedTargetRole);

        if (Array.isArray(body.profile.candidateSkills) && body.profile.candidateSkills.length > 0) {
          setSkills(body.profile.candidateSkills.map((skill: { name: string; claimedLevel?: string }) => ({
            name: skill.name,
            level: String(skill.claimedLevel || "INTERMEDIATE").toLowerCase() as SkillEntry["level"],
          })));
        } else if (Array.isArray(body.profile.skills) && body.profile.skills.length > 0) {
          setSkills(body.profile.skills.map((name: string) => ({ name, level: "intermediate" as const })));
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const saveAndContinue = async (nextSkills: SkillEntry[]) => {
    if (!targetRole.trim() || isSaving) {
      setSaveError("Select a target job role before continuing.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: nextSkills.map((skill) => skill.name),
          skillDetails: nextSkills.map((skill) => ({ name: skill.name, claimedLevel: skill.level })),
          preferences: { targetRole: targetRole.trim() },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Profile save failed");
      updateState({ skills: nextSkills, targetRole });
      markStepComplete(6);
      router.push("/onboarding/resume-upload");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "We could not save your skills. Please try again.");
      setIsSaving(false);
    }
  };

  const selectedSkills: SelectedRoleSkill[] = skills.map((skill) => ({ ...skill, priority: "preferred" }));
  const updateSelectedSkills = (nextSkills: SelectedRoleSkill[]) => {
    setSkills(nextSkills.map(({ name, level }) => ({ name, level })));
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35 ml-0 md:ml-[116px]" />
        <header className="sticky top-0 z-40 h-20 backdrop-blur-xl px-4 sm:px-8 flex items-center" style={{ backgroundColor: "var(--bg-page)", borderBottom: "1px solid var(--outline)" }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Build a profile recruiters can understand</p>
            <h1 className="text-headline-md font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>Your skills</h1>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 max-w-[1000px] w-full mx-auto overflow-y-auto">
          <section className="rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--outline)", boxShadow: "var(--shadow-sidebar)" }}>
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }} />
            <div className="mb-6">
              <h2 className="font-extrabold text-base" style={{ color: "var(--text-primary)" }}>Choose skills you actually have</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>We show only skills related to your role. You can remove any suggestion and set your proficiency.</p>
              {targetRole.trim() && (
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Using the target role you selected earlier. Go back to Role Selection if you want to change it.
                </p>
              )}
            </div>
            <RoleSkillSelector role={targetRole} onRoleChange={setTargetRole} selectedSkills={selectedSkills} onSelectedSkillsChange={updateSelectedSkills} mode="candidate" roleEditable={!targetRole.trim()} />
            {saveError && <p role="alert" className="mt-4 text-xs font-semibold" style={{ color: "var(--primary)" }}>{saveError}</p>}
          </section>

          <div className="flex items-center justify-between pt-6 mt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link href="/onboarding/experience" className="px-6 h-11 rounded-full font-bold text-xs flex items-center gap-2 border" style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)", color: "var(--text-primary)" }}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back
            </Link>
            <div className="flex gap-3">
              <button type="button" onClick={() => void saveAndContinue([])} disabled={isSaving} className="px-5 h-11 rounded-full font-bold text-xs border disabled:opacity-50" style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)", color: "var(--text-secondary)" }}>Skip skills for now</button>
              <button type="button" onClick={() => void saveAndContinue(skills)} disabled={!targetRole.trim() || isSaving} className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))", boxShadow: "var(--shadow-btn-red)" }}>
                {isSaving ? "Saving…" : "Next: Upload Resume"}<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
