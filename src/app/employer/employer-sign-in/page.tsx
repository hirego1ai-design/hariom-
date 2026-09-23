"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

function EmployerSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // If role=admin in URL, redirect directly to Admin Control Console
  useEffect(() => {
    if (roleParam === "admin") {
      router.replace("/admin/dashboard");
      router.refresh();
    }
  }, [roleParam, router]);

  if (roleParam === "admin") {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-amber-400 animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-bold text-amber-400">
            Redirecting to Admin Control Center...
          </p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Invalid email or password.");
        return;
      }

      const userRole = result.user?.role;
      router.replace(userRole === "ADMIN" ? "/admin/dashboard" : "/employer/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center text-text-primary px-3 sm:px-4 py-6">
      <div className="w-full max-w-[780px] mx-auto grid grid-cols-1 md:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-outline my-auto">
        {/* Left Side: Visual & Employer Features */}
        <section className="hidden md:flex md:col-span-5 bg-surface-container-low/40 border-r border-outline flex-col p-5 sm:p-6 justify-between relative">
          {/* Brand Logo */}
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-amber-400 tracking-tight font-bold">
              HireGo AI
            </span>
            <span className="block text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mt-0.5">
              Employer Workspace
            </span>
          </div>

          {/* Futuristic Isometric 3D Illustration */}
          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[180px] aspect-square">
              <div className="absolute inset-0 bg-amber-500/20 blur-[70px] rounded-full scale-75 animate-pulse"></div>
              <img
                className="relative z-10 w-full h-full object-contain"
                alt="Futuristic isometric 3D building illustration"
                src="/marketing/hirego-logo.png"
              />
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 space-y-3 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-amber-400 uppercase font-bold">
                  AI Screening
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Automated Candidate Vetting
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-amber-400 uppercase font-bold">
                  84% Faster
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  High-Velocity Hiring Pipelines
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-amber-400 uppercase font-bold">
                  Verified Talent
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Pre-screened Engineering Candidates
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Compact Sign In Form */}
        <section className="col-span-1 md:col-span-7 flex items-center justify-center p-5 sm:p-6">
          <div className="w-full max-w-[340px] mx-auto">
            
            {/* Segmented Control Pill Toggle */}
            <div className="flex justify-center mb-4">
              <div className="p-1 rounded-full flex items-center border border-outline bg-surface-container backdrop-blur-md">
                <button
                  type="button"
                  aria-pressed="false"
                  onClick={() => router.push("/login")}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-text-secondary hover:text-white transition-all"
                >
                  Candidate
                </button>
                <button
                  type="button"
                  aria-pressed="true"
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-black bg-amber-400 shadow-sm transition-all"
                >
                  Employer
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="font-headline-md font-bold text-amber-400 mb-1">
                Employer Login
              </h1>
              <p className="font-body-md text-sm text-text-secondary">
                Access your hiring workspace
              </p>
            </div>

            {/* Form */}
            <form className="space-y-3" onSubmit={handleSignIn}>
              {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</p>}
              {/* Corporate Email */}
              <div className="space-y-1">
                <label htmlFor="employer-email" className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                  Corporate Email
                </label>
                <input
                  name="email"
                  id="employer-email"
                  autoComplete="email"
                  className="input-pill w-full h-[46px] text-sm text-text-primary px-3.5"
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="employer-password" className="font-label-md text-[11px] font-bold text-on-surface-variant">
                    Password
                  </label>
                  <Link
                    href="/employer/employer-forgot-password"
                    className="text-[11px] text-amber-400 font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    id="employer-password"
                    autoComplete="current-password"
                    className="input-pill w-full h-[46px] text-sm text-text-primary px-3.5 pr-9"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-controls="employer-password"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between px-1 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[11px] text-text-secondary font-medium">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Compact Proportioned Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-md hover:shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 transition-all group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Option */}
              <p className="text-center font-body-md text-[11px] text-text-secondary mt-2">
                New to HireGo?{" "}
                <Link
                  href="/employer/employer-registration-company-info"
                  className="text-amber-400 hover:underline font-bold"
                >
                  Create Employer Account
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function EmployerSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
      <EmployerSignInContent />
    </Suspense>
  );
}
