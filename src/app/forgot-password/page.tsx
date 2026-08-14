"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1000);
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

      {/* Main Centered 3D Card */}
      <div
        className="w-full max-w-[400px] overflow-hidden relative z-10 my-auto p-6 sm:p-7 space-y-4"
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

        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
              boxShadow: "0 4px 12px rgba(255,82,82,0.3)",
            }}
          >
            <span className="material-symbols-outlined text-white text-[18px]">lock_reset</span>
          </div>
          <div>
            <h1
              className="text-base font-extrabold leading-none tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              HireGo AI
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
              Account Recovery
            </span>
          </div>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-3 py-2">
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(52,168,83,0.14)",
                color: "#34A853",
                border: "1px solid rgba(52,168,83,0.3)",
              }}
            >
              <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
            </div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Reset Link Sent!
            </h2>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
              We've dispatched a password reset link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full h-10 rounded-full text-white text-xs font-extrabold transition-all mt-2 shadow-md"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "0 4px 14px rgba(255,82,82,0.35)",
              }}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2
                className="text-lg font-extrabold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Forgot Password?
              </h2>
              <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                Enter your email address to receive a secure recovery link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                  Email Address
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  >
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-9 pl-9 pr-3 rounded-lg outline-none text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--outline)",
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
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: isSubmitting
                      ? "var(--surface-container-high)"
                      : "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(255,82,82,0.35)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </>
                  )}
                </button>

                <Link
                  href="/login"
                  className="w-full h-9 rounded-full font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all border"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    borderColor: "var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
