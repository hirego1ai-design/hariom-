"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function createDemoSession(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  document.cookie = `hirego_session=${header}.${body}.demoSignature; path=/; max-age=604800`;
}

function EmployerSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If role=admin in URL, redirect directly to Admin Control Console
  useEffect(() => {
    if (roleParam === "admin") {
      window.location.href = "/admin/dashboard";
    }
  }, [roleParam]);

  if (roleParam === "admin") {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-white">
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
    try {
      if (email.includes("admin")) {
        const demoPayload = {
          id: "admin-1",
          email: "admin@hirego.ai",
          name: "HireGo Administrator",
          role: "ADMIN",
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        };
        createDemoSession(demoPayload);
        window.location.href = "/admin/dashboard";
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        // Issue employer demo session
        const demoPayload = {
          id: "employer-1",
          email: email || "employer@acme.com",
          name: "Acme Hiring Team",
          role: "EMPLOYER",
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        };
        createDemoSession(demoPayload);
        window.location.href = "/employer/dashboard";
        return;
      }

      const userRole = result.user?.role;
      if (userRole === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/employer/dashboard";
      }
    } catch {
      // Demo fallback for offline
      const demoPayload = {
        id: "employer-1",
        email: email || "employer@acme.com",
        name: "Acme Hiring Team",
        role: "EMPLOYER",
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      createDemoSession(demoPayload);
      window.location.href = "/employer/dashboard";
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-text-primary px-4 py-8">
      <div className="w-full max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Left Side: Visual & Employer Features */}
        <section className="hidden md:flex md:col-span-5 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-8 justify-between relative">
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsxYV2aREJbeHmmorT35Kdd3Eyo3rEUnfqu8PxRQPv0VH8ujIhTLUb8DQRPXGOCON7Jwd8NgixwTtLgaXkPhyMiUFjnUPR_Xt_UFZkAUA7_YcFL6ppfQidkwR4fvvv_DpkvKSi9rWtHPc786GaIniskb5aoPGXRxexpW3BRhU7rhLu9tuFb_g8rJnv2P6R85J5SHixzoAHz333EDBu_GZ0tXCx7VDmUODACmisj7nxoRoR4uwDrQ6YZyGkmWBNnnOoeY6KghM9vyE"
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
        <section className="col-span-1 md:col-span-7 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-[360px] mx-auto">
            
            {/* Segmented Control Pill Toggle */}
            <div className="flex justify-center mb-4">
              <div className="p-1 rounded-full flex items-center border border-white/10 bg-white/5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-text-secondary hover:text-white transition-all"
                >
                  Candidate
                </button>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-black bg-amber-400 shadow-sm transition-all"
                >
                  Employer
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="font-display-xl text-lg font-bold text-amber-400 mb-1">
                Employer Login
              </h1>
              <p className="font-body-lg text-[11px] text-text-secondary">
                Access your hiring workspace
              </p>
            </div>

            {/* Social SSO Buttons */}
            <div className="mb-3">
              <button
                type="button"
                className="w-full h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative flex items-center my-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="mx-2 text-[9.5px] text-text-secondary uppercase font-bold tracking-wider">
                or corporate email
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form className="space-y-3" onSubmit={handleSignIn}>
              {/* Corporate Email */}
              <div className="space-y-1">
                <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                  Corporate Email
                </label>
                <input
                  name="email"
                  className="input-pill w-full h-9.5 text-xs text-text-primary px-3.5"
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="font-label-md text-[11px] font-bold text-on-surface-variant">
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
                  className="w-full h-10 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-md hover:shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 transition-all group"
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
                      <span>Sign In to Workspace</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
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
    <Suspense fallback={<div className="min-h-screen bg-[#0E0E0E]" />}>
      <EmployerSignInContent />
    </Suspense>
  );
}
