"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import AdminLoginPage from "@/app/admin/login/page";
import { POST_AUTH_REDIRECT_STORAGE_KEY, safeInternalRedirect } from "@/lib/clientRedirect";

function CandidateLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const requestedRedirect = safeInternalRedirect(searchParams.get("redirect"), "/dashboard");

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
        body: JSON.stringify({ email, password, portal: "candidate" }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.requiresEmailVerification) {
          sessionStorage.setItem("pending_otp_email", email);
          if (requestedRedirect !== "/dashboard") {
            sessionStorage.setItem(POST_AUTH_REDIRECT_STORAGE_KEY, requestedRedirect);
          }
          router.push("/otp");
          return;
        }
        setErrorMessage(result.error || "Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
        window.location.href = requestedRedirect;
        return;
      }
      router.replace(requestedRedirect);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to sign in. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center text-text-primary px-3 sm:px-4 py-6">
      <div className="auth-login-card w-full max-w-[780px] mx-auto grid grid-cols-1 md:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-outline my-auto">
        {/* Left Side: Visual & Feature Highlights */}
        <section className="hidden md:flex md:col-span-5 bg-surface-container-low/40 border-r border-outline flex-col p-5 sm:p-6 justify-between relative">
          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[180px] aspect-square">
              <div className="absolute inset-3 rounded-full bg-[linear-gradient(105deg,#ff4e57,#ffcf45,#49cf78,#4285ff,#ff4e57)] blur-[34px] opacity-75 logo-color-flow" />
              <Image src="/marketing/hirego-logo-hd.png" alt="HireGo" width={660} height={220} priority className="relative z-10 w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative z-10 space-y-3 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-black font-bold">
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
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-black font-bold">
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
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-black font-bold">
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
        <section className="col-span-1 md:col-span-7 flex items-center justify-center p-5 sm:p-6">
          <div className="w-full max-w-[340px] mx-auto">
            <div className="mb-5 flex justify-center md:hidden">
              <span className="relative inline-flex"><span className="absolute inset-1 rounded-full bg-[linear-gradient(105deg,#ff4e57,#ffcf45,#49cf78,#4285ff,#ff4e57)] blur-xl opacity-70 logo-color-flow" /><Image src="/marketing/hirego-logo-hd.png" alt="HireGo" width={660} height={220} priority className="relative h-auto w-32 object-contain" /></span>
            </div>
            {/* Clean Segmented Control Pill Toggle (Candidate | Employer) */}
            <div className="flex justify-center mb-4">
              <div className="p-1 rounded-full flex items-center border border-outline bg-surface-container backdrop-blur-md">
                <button
                  type="button"
                  aria-pressed="true"
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-black bg-primary shadow-md transition-all"
                >
                  Candidate
                </button>
                <button
                  type="button"
                  aria-pressed="false"
                  onClick={() => router.push("/employer/employer-sign-in")}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-text-secondary hover:text-white transition-all"
                >
                  Employer
                </button>
              </div>
            </div>

            <div className="mb-4 text-center">
              <h1 className="font-headline-md font-bold text-primary mb-1">
                Candidate Sign In
              </h1>
              <p className="font-body-md text-sm text-text-secondary">
                Access your AI verified vector profile
              </p>
            </div>

            {errorMessage && (
              <div role="alert" className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="space-y-3" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label htmlFor="candidate-email" className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                  Email Address
                </label>
                <input
                  name="email"
                  id="candidate-email"
                  autoComplete="email"
                  className="input-pill w-full h-[46px] text-sm text-text-primary px-3.5"
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="candidate-password" className="font-label-md text-[11px] font-bold text-on-surface-variant">
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
                    id="candidate-password"
                    autoComplete="current-password"
                    className="input-pill w-full h-[46px] text-sm text-text-primary px-3.5 pr-9"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-controls="candidate-password"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  className="btn-3d-red w-full h-11 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 group shadow-md disabled:opacity-50"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center font-body-md text-[11px] text-text-secondary mt-2">
                Don't have an account?{" "}
                <Link
                  href={requestedRedirect !== "/dashboard"
                    ? `/register?redirect=${encodeURIComponent(requestedRedirect)}`
                    : "/register"}
                  className="text-primary hover:underline font-bold"
                >
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
    <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
      <CandidateLoginContent />
    </Suspense>
  );
}
