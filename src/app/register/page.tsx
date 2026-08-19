"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import { syncCandidateRegistrationData } from "@/services/candidateProfileService";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    country: "United States",
    city: "",
    password: "",
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
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
          role: "CANDIDATE",
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Synchronize client profile data
      syncCandidateRegistrationData({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.city ? `${formData.city}, ${formData.country}` : formData.country,
        userId: data.user?.id || `USR-${Date.now()}`,
      });

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
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="w-full max-w-[1050px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Progress */}
        <section className="hidden md:flex md:col-span-5 lg:col-span-4 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-8 justify-between relative">
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
          </div>

          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[200px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-75 animate-pulse"></div>
              <div className="relative z-10 w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-[64px] text-primary mb-2">person_add</span>
                <span className="text-xs font-bold text-primary">HireGo AI Pass</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pl-1">
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
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-[560px]">
            <div className="mb-5">
              <h1 className="font-display-xl text-headline-md text-primary mb-1">
                Create Account
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                Start building your AI verified vector profile.
              </p>
            </div>

            {referralCode && (
              <div className="mb-4 p-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Referral Invite Applied: <span className="font-mono text-white">{referralCode}</span></span>
                </span>
                <span className="text-[10px] text-green-300 font-medium">₹250 Welcome Bonus Active</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="+1 555-0199"
                    type="tel"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Date of Birth
                  </label>
                  <input
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    type="date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input-pill w-full h-11 text-xs text-text-primary px-4 appearance-none cursor-pointer"
                    >
                      <option value="United States" className="bg-[#181818] text-white">United States</option>
                      <option value="India" className="bg-[#181818] text-white">India</option>
                      <option value="United Kingdom" className="bg-[#181818] text-white">United Kingdom</option>
                      <option value="Canada" className="bg-[#181818] text-white">Canada</option>
                      <option value="Germany" className="bg-[#181818] text-white">Germany</option>
                      <option value="Singapore" className="bg-[#181818] text-white">Singapore</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    City
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="e.g. San Francisco"
                    type="text"
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
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="btn-3d-red w-full h-12 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 group disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Continue to Verification</span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center font-body-md text-xs text-text-secondary mt-3">
                Already have an account?{" "}
                <Link
                  href="/login"
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
