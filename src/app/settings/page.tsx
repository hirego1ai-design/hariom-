"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function CandidateSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidate/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setName(data.profile.name || "");
          setEmail(data.profile.email || "");
          setHeadline(data.profile.headline || "");
          setLocation(data.profile.location || "");
          setBio(data.profile.bio || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          location,
          bio,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage("Settings updated successfully!");
      } else {
        setToastMessage("Failed to update settings.");
      }
    } catch {
      setToastMessage("Failed to update settings.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[100px] lg:ml-[116px] flex flex-col min-w-0 min-h-screen">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Personal Settings
            </h1>
            <p className="text-text-muted text-xs">Manage your account profile and matching preferences.</p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-4xl w-full mx-auto overflow-y-auto">
          <form onSubmit={handleSave} className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center gap-5 pb-6 border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-primary text-3xl">
                <span className="material-symbols-outlined text-[32px]">person</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{name || "Candidate"}</h3>
                <p className="text-xs text-text-muted">{email || "candidate@hirego.ai"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={name}
                  className="input-pill w-full h-11 px-4 text-xs text-text-muted opacity-60 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="input-pill w-full h-11 px-4 text-xs text-text-muted opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Software Architect"
                  className="input-pill w-full h-11 px-4 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted">Current Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA / Bangalore"
                  className="input-pill w-full h-11 px-4 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted">Professional Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your experience, technical leadership, and goals..."
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-3d-red px-8 py-3 rounded-full text-xs font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}