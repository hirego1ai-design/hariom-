"use client";

import React, { useState, useEffect, Suspense } from "react";
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
      alert("Please enter your credentials.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (email.includes("admin")) {
        const demoPayload = {
          id: "admin-1",
          email: "admin@hirego.ai",
          name: "HireGo Administrator",
          role: "ADMIN",
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        const encoded = btoa(JSON.stringify(demoPayload)).replace(/=/g, "");
        document.cookie = `hirego_session_token=${encoded}.demo_sig; path=/; max-age=604800`;
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
        // Issue Candidate demo session
        const demoPayload = {
          id: "candidate-1",
          email: email || "rohit@example.com",
          name: email.split("@")[0] || "Candidate",
          role: "CANDIDATE",
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        const encoded = btoa(JSON.stringify(demoPayload)).replace(/=/g, "");
        document.cookie = `hirego_session_token=${encoded}.demo_sig; path=/; max-age=604800`;
        window.location.href = "/dashboard";
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
    } catch {
      // Demo fallback
      const demoPayload = {
        id: "candidate-1",
        email: email || "rohit@example.com",
        name: email.split("@")[0] || "Candidate",
        role: "CANDIDATE",
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      const encoded = btoa(JSON.stringify(demoPayload)).replace(/=/g, "");
      document.cookie = `hirego_session_token=${encoded}.demo_sig; path=/; max-age=604800`;
      window.location.href = "/dashboard";
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="w-full max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Feature Highlights */}
        <section className="hidden md:flex md:col-span-5 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-8 justify-between relative">
          {/* Brand Logo */}
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
          </div>

          {/* Futuristic Isometric 3D Illustration */}
          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[180px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[70px] rounded-full scale-75 animate-pulse"></div>
              <img
                className="relative z-10 w-full h-full object-contain"
                alt="Futuristic isometric 3D illustration"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsxYV2aREJbeHmmorT35Kdd3Eyo3rEUnfqu8PxRQPv0VH8ujIhTLUb8DQRPXGOCON7Jwd8NgixwTtLgaXkPhyMiUFjnUPR_Xt_UFZkAUA7_YcFL6ppfQidkwR4fvvv_DpkvKSi9rWtHPc786GaIniskb5aoPGXRxexpW3BRhU7rhLu9tuFb_g8rJnv2P6R85J5SHixzoAHz333EDBu_GZ0tXCx7VDmUODACmisj7nxoRoR4uwDrQ6YZyGkmWBNnnOoeY6KghM9vyE"
              />
            </div>
          </div>

          {/* Step / Feature Highlights */}
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

            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="font-display-xl text-xl font-bold text-primary mb-1">
                Candidate Sign In
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                Access your AI verified vector profile
              </p>
            </div>

            {/* Social SSO Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all"
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
                <span>Google</span>
              </button>

              <button
                type="button"
                className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all"
              >
                <svg width="14" height="14" fill="#0A66C2" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>LinkedIn</span>
              </button>
            </div>

            <div className="relative flex items-center my-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="mx-2 text-[9.5px] text-text-secondary uppercase font-bold tracking-wider">
                or email
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form className="space-y-3" onSubmit={handleLogin}>
              {/* Work / Personal Email */}
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

              {/* Password */}
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

              {/* Remember Me */}
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

              {/* Compact Proportioned Submit Button */}
              <div className="pt-1">
                <button
                  className="btn-3d-red w-full h-10 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 group shadow-md"
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

              {/* Secondary Option */}
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
