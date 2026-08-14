"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && e.currentTarget.previousElementSibling) {
      (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-3 sm:p-5 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Google-Style Ambient Lining & Quad Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-30" />
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 15% 15%, rgba(66,133,244,0.10) 0%, transparent 45%), radial-gradient(ellipse at 85% 15%, rgba(234,67,53,0.10) 0%, transparent 45%), radial-gradient(ellipse at 85% 85%, rgba(251,188,5,0.08) 0%, transparent 45%), radial-gradient(ellipse at 15% 85%, rgba(52,168,83,0.08) 0%, transparent 45%)",
        }}
      />

      {/* Main Centered 3D Bento Card */}
      <div
        className="w-full max-w-[780px] flex flex-col md:flex-row overflow-hidden relative z-10 my-auto"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1.5px solid var(--outline)",
          borderRadius: "20px",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.12), 0 0 0 1px var(--outline)",
        }}
      >
        {/* Google 4-Color Top Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-1 z-20"
          style={{
            background:
              "linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%, #34A853 100%)",
          }}
        />

        {/* ── LEFT: Branding & Stepper (38%) ─────── */}
        <div
          className="md:w-[38%] w-full p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, var(--surface-container-low), var(--surface-container))",
            borderRight: "1px solid var(--outline)",
          }}
        >
          {/* Logo & Headline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "0 4px 12px rgba(255,82,82,0.3)",
                }}
              >
                <span className="material-symbols-outlined text-white text-[18px]">rocket_launch</span>
              </div>
              <div>
                <h1
                  className="text-base font-extrabold leading-none tracking-tight"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  HireGo AI
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                  Identity Security
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <h2
                className="text-lg font-extrabold leading-snug"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Verify your <span style={{ color: "var(--primary)" }}>Email Address.</span>
              </h2>
              <p className="text-[11px] font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                We protect your HireGo vector profile with 256-bit automated passcode security.
              </p>
            </div>

            {/* Stepper Roadmap */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                Progress
              </span>

              <div className="space-y-2">
                {/* Step 1 */}
                <div className="flex items-center gap-2.5 opacity-65">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                    style={{ backgroundColor: "var(--surface-container-high)", color: "#34A853", border: "1px solid var(--outline)" }}
                  >
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none" style={{ color: "var(--text-primary)" }}>Account Info</span>
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Completed</span>
                  </div>
                </div>

                {/* Step 2 (ACTIVE) */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] text-white shadow-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}
                  >
                    2
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none" style={{ color: "var(--primary)" }}>Passcode Check</span>
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>6-digit code</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-2.5 opacity-65">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0"
                    style={{ backgroundColor: "var(--surface-container-high)", color: "var(--text-muted)", border: "1px solid var(--outline)" }}
                  >
                    3
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none" style={{ color: "var(--text-primary)" }}>Profile Readiness</span>
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>AI mock & resume</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Support Info */}
          <div
            className="mt-5 p-2.5 rounded-xl border flex items-center gap-2"
            style={{
              backgroundColor: "var(--surface-container-high)",
              borderColor: "var(--outline)",
            }}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ color: "var(--primary)" }}>
              support_agent
            </span>
            <div className="text-[10px]">
              <span className="font-bold block" style={{ color: "var(--text-primary)" }}>Need assistance?</span>
              <span style={{ color: "var(--text-muted)" }}>AI Support is online 24/7</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Verification Form (62%) ─────────────── */}
        <div
          className="md:w-[62%] w-full p-5 sm:p-6 flex flex-col justify-center"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <div className="max-w-[340px] mx-auto w-full space-y-4">
            {/* Header */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: "var(--primary)" }}>
                Security Verification
              </span>
              <h2
                className="text-lg font-extrabold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Enter 6-Digit Code
              </h2>
              <p className="text-[11px] font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Sent to <strong style={{ color: "var(--text-primary)" }}>alex.rivera@hirego.ai</strong>
              </p>
            </div>

            {/* 6 3D Digit Inputs */}
            <div className="flex gap-2 justify-center py-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-10 h-12 rounded-xl text-center text-lg font-extrabold font-mono outline-none transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1.5px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255,82,82,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--outline)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            {/* Resend & Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/onboarding/welcome")}
                className="w-full h-10 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "0 4px 14px rgba(255,82,82,0.35)",
                }}
              >
                <span>Verify & Continue</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>

              <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                <Link
                  href="/register"
                  className="hover:underline flex items-center gap-1 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span> Change Email
                </Link>
                <button
                  type="button"
                  onClick={() => alert("Verification code re-sent to your email!")}
                  className="hover:underline transition-colors font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  Resend Code (0:45)
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t flex justify-center" style={{ borderColor: "var(--outline)" }}>
              <Link
                href="/login"
                className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-75"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="material-symbols-outlined text-[13px]">arrow_back</span>
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
