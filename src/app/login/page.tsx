"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import AdminLoginPage from "@/app/admin/login/page";

function CandidateLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // If role=admin in URL parameter, render official Admin Login Portal directly
  if (roleParam === "admin") {
    return <AdminLoginPage />;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.requiresEmailVerification) {
          sessionStorage.setItem("pending_otp_email", email);
          router.push("/otp");
          return;
        }
        setErrorMessage(result.error || "Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      const userRole = result.user?.role;
      if (userRole === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (userRole === "EMPLOYER" || userRole === "RECRUITER") {
        window.location.href = "/employer/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="w-full max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Feature Highlights */}
        <section className="hidden md:flex md:col-span-5 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-8 justify-between relative">
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
          </div>

          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[180px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[70px] rounded-full scale-75 animate-pulse"></div>
              <div className="relative z-10 w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-[56px] text-primary mb-2">lock</span>
                <span className="text-xs font-bold text-primary">Secure Auth Portal</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  AI Practice
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Real-time Mock Interviews
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  Hire Score™
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Verified Skill Matrix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  Direct Pipelines
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Top Tech Recruiter Match
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Compact Login Form */}
        <section className="col-span-1 md:col-span-7 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-[360px] mx-auto">
            {/* Clean Segmented Control Pill Toggle (Candidate | Employer) */}
            <div className="flex justify-center mb-4">
              <div className="p-1 rounded-full flex items-center border border-white/10 bg-white/5 backdrop-blur-md">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-primary shadow-md transition-all"
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/employer/employer-sign-in")}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-text-secondary hover:text-white transition-all"
                >
                  Employer
                </button>
              </div>
            </div>

            <div className="mb-4 text-center">
              <h1 className="font-display-xl text-xl font-bold text-primary mb-1">
                Candidate Sign In
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                Access your AI verified vector profile
              </p>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="space-y-3" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                  Email Address
                </label>
                <input
                  name="email"
                  className="input-pill w-full h-9.5 text-xs text-text-primary px-3.5"
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="font-label-md text-[11px] font-bold text-on-surface-variant">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-primary font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    className="input-pill w-full h-9.5 text-xs text-text-primary px-3.5 pr-9"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-text-secondary font-medium">
                    Keep me signed in
                  </span>
                </label>
              </div>

              <div className="pt-1">
                <button
                  className="btn-3d-red w-full h-10 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 group shadow-md disabled:opacity-50"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center font-body-md text-[11px] text-text-secondary mt-2">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-bold">
                  Create Account
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CandidateLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E0E0E]" />}>
      <CandidateLoginContent />
    </Suspense>
  );
}
