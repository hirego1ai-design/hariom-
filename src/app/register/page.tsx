"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, Home } from "lucide-react";
import { POST_AUTH_REDIRECT_STORAGE_KEY, safeInternalRedirect } from "@/lib/clientRedirect";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [postAuthRedirect, setPostAuthRedirect] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      const requestedRedirect = safeInternalRedirect(params.get("redirect"), "");
      setPostAuthRedirect(requestedRedirect);
      if (requestedRedirect) {
        sessionStorage.setItem(POST_AUTH_REDIRECT_STORAGE_KEY, requestedRedirect);
      } else {
        sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
      }
      if (ref) {
        setReferralCode(ref.toUpperCase());
        document.cookie = `hirego_ref=${ref.toUpperCase()}; path=/; max-age=${30 * 86400}`;
      }
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending_otp_email", formData.email);
      }

      router.push("/otp");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-registration-page min-h-screen bg-bg-page flex items-center justify-center text-text-primary px-3 sm:px-4 py-2">
      <div className="auth-registration-card w-full max-w-[1060px] mx-auto grid grid-cols-1 glass-card rounded-2xl overflow-hidden shadow-2xl border border-outline my-auto">
        {/* Left Side: Visual & Progress */}
        <section className="auth-registration-sidebar hidden md:flex bg-surface-container-low/40 border-r border-outline flex-col p-6 lg:p-8 justify-between relative">
          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="auth-brand-block relative w-full max-w-[230px]">
              <div className="absolute inset-3 rounded-full bg-[linear-gradient(105deg,#ff4e57,#ffcf45,#49cf78,#4285ff,#ff4e57)] blur-[34px] opacity-75 logo-color-flow" />
              <Image src="/marketing/hirego-logo-hd.png" alt="HireGo" width={660} height={220} priority className="relative z-10 w-full h-auto object-contain" />
              <p className="auth-brand-tagline">The world’s fastest<br />hiring platform.</p>
            </div>
          </div>

          <div className="auth-progress-list relative z-10 space-y-3 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  Step 1
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Account Details
                </p>
                <p className="auth-step-description">Create your secure account</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                2
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 2
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  Email Passcode Check
                </p>
                <p className="auth-step-description">Verify your email</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                3
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 3
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  AI Practice & Mock
                </p>
                <p className="auth-step-description">Try AI mock interview</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                4
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 4
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  Job Match Vectoring
                </p>
                <p className="auth-step-description">Get personalised matches</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="flex items-start justify-center p-5 sm:p-7 lg:p-9">
          <div className="w-full max-w-[560px]">
            <div className="mb-5 flex justify-center md:hidden">
              <span className="relative inline-flex"><span className="absolute inset-1 rounded-full bg-[linear-gradient(105deg,#ff4e57,#ffcf45,#49cf78,#4285ff,#ff4e57)] blur-xl opacity-70 logo-color-flow" /><Image src="/marketing/hirego-logo-hd.png" alt="HireGo" width={660} height={220} priority className="relative h-auto w-32 object-contain" /></span>
            </div>
            <nav className="registration-nav mb-4" aria-label="Registration navigation">
              <Link
                href={postAuthRedirect ? `/login?redirect=${encodeURIComponent(postAuthRedirect)}` : "/login"}
                className="registration-nav-link"
              >
                <ArrowLeft size={15} aria-hidden="true" /> Back to sign in
              </Link>
              <Link href="/" className="registration-nav-link"><Home size={15} aria-hidden="true" /> Home</Link>
            </nav>
            <div className="mb-4 text-center">
              <h1 className="auth-registration-title font-headline-md font-bold text-white mb-1">
                Create <span className="auth-gradient-word">Account</span>
              </h1>
              <p className="font-body-md text-sm text-text-secondary">
                Start building your AI verified vector profile.
              </p>
            </div>

            {referralCode && (
              <div className="mb-4 p-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Referral code captured: <span className="font-mono text-white">{referralCode}</span></span>
                </span>
                <span className="text-[10px] text-green-300 font-medium">Eligibility is checked by the server</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Full Name *
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="e.g. Rahul Verma"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Work / Personal Email *
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="rahul@example.com"
                    type="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs text-on-surface-variant ml-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-pill w-full h-11 text-xs text-text-primary px-4 pr-10"
                    placeholder="Create a strong password"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="btn-3d-red w-full h-11 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 group disabled:opacity-50 shadow-md"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Verification</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center font-body-md text-xs text-text-secondary mt-3">
                Already have an account?{" "}
                <Link
                  href={postAuthRedirect ? `/login?redirect=${encodeURIComponent(postAuthRedirect)}` : "/login"}
                  className="text-primary hover:underline font-bold"
                >
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
