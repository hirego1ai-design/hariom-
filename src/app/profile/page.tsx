"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

interface CandidateProfileData {
  id?: string;
  name?: string;
  email?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  candidateSkills?: Array<{
    id: string;
    name: string;
    claimedLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    verifiedLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | null;
    verificationStatus: "SELF_DECLARED" | "ASSESSMENT_VALIDATED" | "VERIFIED" | "EXPIRED";
    latestScore?: number | null;
    verifiedAt?: string | null;
    validUntil?: string | null;
  }>;
  experienceYears?: number;
  hireGoScore?: number;
  isVerified?: boolean;
  resumeUrl?: string | null;
  education?: Array<{ degree: string; university: string; year: string; gpa?: string }>;
  experience?: Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>;
  preferences?: {
    desiredCategory?: string;
    preferredTitles?: string[];
    preferredLocations?: string[];
    salaryExpectation?: string;
  };
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"about" | "experience" | "education" | "skills" | "preferences">("about");
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  async function fetchProfile() {
    try {
      const res = await fetch("/api/candidate/profile");
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setHeadline(data.profile.headline || "");
        setBio(data.profile.bio || "");
        setLocation(data.profile.location || "");
        setSkillsInput(data.profile.skills?.join(", ") || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          bio,
          location,
          skills: skillsArray,
        }),
      });

      const data = await res.json();
      if (data.success && data.profile) {
        setProfile((prev) => ({ ...prev, ...data.profile, skills: skillsArray }));
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex text-text-primary font-sans">
      <CandidateSidebar />

      <div className="flex-1 ml-0 md:ml-[116px] min-h-screen relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <header className="sticky top-0 z-40 min-h-16 backdrop-blur-xl border-b border-outline px-4 sm:px-8 flex items-center justify-between bg-bg-page">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white">HireGo AI</h1>
            <span className="text-xs text-white/40">/</span>
            <span className="text-xs text-white/60">Candidate Profile</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6 z-10 relative">
          {saveSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-xs text-green-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Profile Header Card */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center md:items-end gap-6 shadow-xl relative overflow-hidden bg-white/5">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary">person</span>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="absolute -bottom-2 -right-2 bg-primary border border-white/20 p-2 rounded-full text-white hover:scale-110 transition-transform shadow-md"
              >
                <span className="material-symbols-outlined text-sm">
                  {isEditing ? "close" : "edit"}
                </span>
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl font-bold text-white">
                  {profile?.name || "Candidate"}
                </h2>
                {profile?.isVerified && (
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    verified
                  </span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs text-gray-400 justify-center md:justify-start">
                <span className="text-primary font-semibold">
                  {profile?.headline || "Add a professional headline"}
                </span>
                <div className="flex items-center gap-1 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-sm text-[#FF5252]">
                    location_on
                  </span>
                  <span>{profile?.location || "Add your location"}</span>
                </div>
                <span>•</span>
                <span>{profile?.email}</span>
              </div>
            </div>

            {/* Profile Completion / Hire Score */}
            <div className="w-full md:w-64 space-y-2 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">HireGo Score™</span>
                <span className="text-green-400 font-bold text-sm">
                  {typeof profile?.hireGoScore === "number" ? `${profile.hireGoScore} / 100` : "Not calculated"}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-300"
                  style={{ width: `${typeof profile?.hireGoScore === "number" ? profile.hireGoScore : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Edit Mode Form */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="glass-card p-6 rounded-3xl border border-primary/30 bg-primary/5 space-y-4"
            >
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Edit Core Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="input-pill w-full h-10 px-3 text-xs"
                    placeholder="e.g. Senior Full Stack Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-pill w-full h-10 px-3 text-xs"
                    placeholder="e.g. Bangalore, India"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="input-pill w-full h-10 px-3 text-xs"
                  placeholder="React, TypeScript, Next.js, PostgreSQL"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Bio Summary</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-primary"
                  placeholder="Write a brief professional summary..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 rounded-full text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-red px-6 py-2 rounded-full text-xs font-bold text-white shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-3 border-b border-white/10 overflow-x-auto pb-1 no-scrollbar">
            {(["about", "experience", "education", "skills", "preferences"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all capitalize ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Details Content Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {activeTab === "about" && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-base font-bold text-white">Professional Summary</h3>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                    {profile?.bio || "Add a professional summary to help employers understand your experience."}
                  </p>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-6">
                  <h3 className="text-base font-bold text-white">Work Experience</h3>
                  <div className="space-y-4">
                    {(profile?.experience || []).map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm">{exp.role}</h4>
                            <p className="text-xs text-primary">{exp.company}</p>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {exp.startDate} — {exp.endDate}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 pt-1">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "education" && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-base font-bold text-white">Education & Degrees</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(profile?.education || []).map((edu, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1"
                      >
                        <h4 className="font-bold text-xs text-white">{edu.degree}</h4>
                        <p className="text-xs text-gray-400">{edu.university}</p>
                        <div className="flex justify-between text-[11px] text-primary pt-1">
                          <span>Graduation: {edu.year}</span>
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Skills</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      Self-declared skills stay clearly separate from HireGo assessment evidence.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(profile?.candidateSkills?.length
                      ? profile.candidateSkills
                      : (profile?.skills || []).map((name) => ({
                          id: name,
                          name,
                          claimedLevel: "INTERMEDIATE" as const,
                          verificationStatus: "SELF_DECLARED" as const,
                          latestScore: null,
                        }))
                    ).map((skill) => {
                      const statusLabel = skill.verificationStatus === "VERIFIED"
                        ? "Verified"
                        : skill.verificationStatus === "ASSESSMENT_VALIDATED"
                          ? "Assessment validated"
                          : skill.verificationStatus === "EXPIRED"
                            ? "Evidence expired"
                            : "Self-declared";
                      const evidenceBacked = skill.verificationStatus === "VERIFIED"
                        || skill.verificationStatus === "ASSESSMENT_VALIDATED";
                      return (
                        <div
                          key={skill.id}
                          className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <span className="text-sm font-bold text-white">{skill.name}</span>
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            {skill.claimedLevel.toLowerCase()}
                          </span>
                          <span
                            className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                              evidenceBacked
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : "border-white/10 bg-white/5 text-gray-400"
                            }`}
                          >
                            {statusLabel}
                            {evidenceBacked && typeof skill.latestScore === "number" ? ` · ${skill.latestScore}%` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-base font-bold text-white">Job Preferences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Desired Category
                      </span>
                      <span className="text-white font-semibold">
                        {profile?.preferences?.desiredCategory || "Not set"}
                      </span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Salary Expectation
                      </span>
                      <span className="text-primary font-semibold">
                        {profile?.preferences?.salaryExpectation || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  AI Resume Score
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-text-primary">{typeof profile?.hireGoScore === "number" ? profile.hireGoScore : "—"}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Your profile matches high-growth tech opportunities. Keep your skills updated to maintain high search visibility.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
