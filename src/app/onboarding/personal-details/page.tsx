"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

export default function PersonalDetailsPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [formData, setFormData] = useState({
    fullName: state.personalDetails?.fullName || "",
    email: state.personalDetails?.email || "",
    phone: state.personalDetails?.phone || "",
    location: state.personalDetails?.location || "",
    dateOfBirth: state.personalDetails?.dateOfBirth || "",
    linkedinUrl: state.personalDetails?.linkedinUrl || "",
  });

  React.useEffect(() => {
    fetch("/api/candidate/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || data.profile.name || "",
            email: prev.email || data.profile.email || "",
            location: prev.location || data.profile.location || "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ personalDetails: formData });
    markStepComplete(3);

    // Persist to backend
    fetch("/api/candidate/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        linkedinUrl: formData.linkedinUrl,
        bio: formData.location ? `Professional based in ${formData.location}` : "",
      }),
    }).catch(() => {});

    router.push("/onboarding/education");
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
        {/* Premium Ambient Background Grid & Dual Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-30 ml-[116px]" />
        <div
          className="fixed inset-0 pointer-events-none -z-10 ml-[116px]"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(255,82,82,0.09) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(68,138,255,0.09) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(156,39,176,0.05) 0%, transparent 60%)",
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
                Profile setup
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Personal Profile Verification
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Personal Identity & Contact Information
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
              Your details
            </span>
          </div>
        </header>

        {/* Main Form Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          <form
            onSubmit={handleNext}
            className="rounded-3xl p-8 lg:p-10 space-y-6 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-sidebar)",
            }}
          >
            {/* Multi-Color Top Border Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 z-20"
              style={{ background: "linear-gradient(90deg, var(--primary), #AB47BC, var(--secondary), var(--color-green-light, #2E7D32))" }}
            />

            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline)" }}>
              <h2
                className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>person</span>
                Candidate Contact Details
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Verified for Enterprise Recruiters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold block tracking-wide" style={{ color: "var(--text-primary)" }}>
                  FULL LEGAL NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                  EMAIL ADDRESS · VERIFIED
                </label>
                <input
                  type="email"
                  required
                  readOnly
                  value={formData.email}
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
                  MOBILE NUMBER · OPTIONAL
                </label>
                <input
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  CURRENT LOCATION
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  LINKEDIN PROFILE URL · OPTIONAL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
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

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
              <Link
                href="/onboarding/role-select"
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
                type="submit"
                className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "var(--shadow-btn-red)",
                }}
              >
                <span>Next: Education History</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
