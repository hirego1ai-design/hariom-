"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INDUSTRY_MASTER } from "@/lib/industry-master";

export default function EmployerCompanyInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companySize, setCompanySize] = useState("11-50");
  const [industry, setIndustry] = useState("Information Technology (IT)");
  const [industryQuery, setIndustryQuery] = useState("");
  const [industryOpen, setIndustryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Referral code state
  const [referralCode, setReferralCode] = useState("");
  const [refStatus, setRefStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [refMsg, setRefMsg] = useState("");
  const filteredIndustries = useMemo(() => {
    const query = industryQuery.trim().toLowerCase();
    return INDUSTRY_MASTER.filter((item) => !query || item.toLowerCase().includes(query));
  }, [industryQuery]);

  async function validateCode(code: string) {
    if (!code) { setRefStatus("idle"); setRefMsg(""); return; }
    setRefStatus("checking");
    try {
      const res = await fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.valid) {
        setRefStatus("valid");
        setRefMsg("Valid referral code applied. Your referrer will earn rewards once you post a job.");
      } else {
        setRefStatus("invalid");
        setRefMsg("This referral code is invalid or has expired.");
      }
    } catch {
      setRefStatus("invalid");
      setRefMsg("Could not validate code. You can still continue.");
    }
  }

  // Pre-fill referral code from ?ref= URL param
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.trim().toUpperCase());
      validateCode(ref.trim().toUpperCase());
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      
      <div className="w-full max-w-[980px] max-h-[calc(100vh-32px)] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-4 ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Progress */}
        <section className="hidden md:flex md:col-span-5 lg:col-span-4 bg-surface-container-low/40 border-r border-white/10 flex-col p-5 lg:p-6 justify-between relative">
          {/* Brand Logo */}
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
          </div>

          {/* Illustration Area */}
          <div className="relative flex-grow flex items-center justify-center my-2">
            <div className="relative w-full max-w-[150px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-75 animate-pulse" />
              <img
                className="relative z-10 w-full h-full object-contain"
                alt="3D Corporate Headquarters Graphic"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsxYV2aREJbeHmmorT35Kdd3Eyo3rEUnfqu8PxRQPv0VH8ujIhTLUb8DQRPXGOCON7Jwd8NgixwTtLgaXkPhyMiUFjnUPR_Xt_UFZkAUA7_YcFL6ppfQidkwR4fvvv_DpkvKSi9rWtHPc786GaIniskb5aoPGXRxexpW3BRhU7rhLu9tuFb_g8rJnv2P6R85J5SHixzoAHz333EDBu_GZ0tXCx7VDmUODACmisj7nxoRoR4uwDrQ6YZyGkmWBNnnOoeY6KghM9vyE"
              />
            </div>
          </div>

          {/* Registration progress */}
          <div className="relative z-10 space-y-2 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold">
                1
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  Step 1
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Company Profile
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
                  Identity OTP Check
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
                  Hiring Model
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
                  Plan Setup (Subscription)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                5
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Final Step
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  One-Document KYC
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-5 lg:p-6 overflow-y-auto">
          <div className="w-full max-w-[560px]">
            {/* Header */}
            <div className="mb-3">
              <h1 className="font-display-xl text-[28px] leading-tight text-primary mb-1">
                Create Employer Account
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                Start hiring elite talent with AI-driven precision.
              </p>
            </div>

            {/* Form */}
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const password = String(form.get("password") || "");
                const confirmPassword = String(form.get("confirmPassword") || "");
                if (password !== confirmPassword) { setError("Passwords do not match."); return; }
                setSubmitting(true); setError("");
                try {
                  const response = await fetch("/api/auth/employer-register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyName: form.get("companyName"), email: form.get("email"), industry: form.get("industry"), companySize, password, confirmPassword, referralCode: referralCode || undefined }) });
                  const result = await response.json();
                  if (!response.ok || !result.success) throw new Error(result.error || "Registration failed.");
                  router.push(`/employer/employer-registration-otp-verification?email=${encodeURIComponent(result.email)}${result.debugOtp ? `&debugOtp=${result.debugOtp}` : ""}`);
                } catch (err) { setError(err instanceof Error ? err.message : "Registration failed."); }
                finally { setSubmitting(false); }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Company Name *
                  </label>
                  <input
                    className="input-pill w-full h-10 text-xs text-text-primary px-4"
                    name="companyName"
                    placeholder="Acme Corp"
                    type="text"
                    required
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Work Email *
                  </label>
                  <input
                    className="input-pill w-full h-10 text-xs text-text-primary px-4"
                    name="email"
                    placeholder="name@company.com"
                    type="email"
                    required
                  />
                </div>
              </div>

              {/* Searchable global Industry directory */}
              <div className="space-y-1">
                <label className="font-label-md text-xs text-on-surface-variant ml-2">
                  Industry *
                </label>
                <div className="relative">
                  <input type="hidden" name="industry" value={industry} />
                  <input
                    value={industryQuery || industry}
                    onChange={(event) => { setIndustryQuery(event.target.value); setIndustry(event.target.value); setIndustryOpen(true); }}
                    onFocus={() => { setIndustryQuery(""); setIndustryOpen(true); }}
                    onBlur={() => setTimeout(() => setIndustryOpen(false), 150)}
                    placeholder="Search industry, e.g. Healthcare"
                    autoComplete="off"
                    required
                    className="input-pill w-full h-10 text-xs text-text-primary px-4 pr-10"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">search</span>
                  {industryOpen && filteredIndustries.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#1E1E24] shadow-2xl">
                      {filteredIndustries.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => { setIndustry(item); setIndustryQuery(item); setIndustryOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-text-primary hover:bg-primary/15 transition-colors border-b border-white/5 last:border-0"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Company Size Pills */}
              <div className="space-y-1">
                <label className="font-label-md text-xs text-on-surface-variant ml-2">
                  Company Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {["1-10", "11-50", "51-200", "201-500", "500+"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                        className={`h-8 px-3 rounded-xl text-xs font-medium border transition-all ${
                        companySize === size
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white/5 text-on-surface-variant border-white/10 hover:bg-primary/20"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Password *
                  </label>
                  <input
                    className="input-pill w-full h-10 text-xs text-text-primary px-4"
                    placeholder="••••••••"
                    name="password"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Confirm Password *
                  </label>
                  <input
                    className="input-pill w-full h-10 text-xs text-text-primary px-4"
                    placeholder="••••••••"
                    name="confirmPassword"
                    type="password"
                    required
                  />
                </div>
              </div>

              {/* Referral Code (optional) */}
              <div className="space-y-1">
                <label className="font-label-md text-xs text-on-surface-variant ml-2">
                  Referral Code <span className="text-text-muted">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setReferralCode(val);
                      setRefStatus("idle");
                      setRefMsg("");
                    }}
                    onBlur={() => validateCode(referralCode)}
                    placeholder="e.g. ACMECORP2026"
                    className={`input-pill w-full h-10 text-xs text-text-primary px-4 font-mono pr-10 ${
                      refStatus === "valid" ? "border-green-500/50" : refStatus === "invalid" ? "border-red-500/50" : ""
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[16px]">
                    {refStatus === "checking" && (
                      <span className="material-symbols-outlined text-text-muted animate-spin">progress_activity</span>
                    )}
                    {refStatus === "valid" && (
                      <span className="material-symbols-outlined text-green-400">check_circle</span>
                    )}
                    {refStatus === "invalid" && (
                      <span className="material-symbols-outlined text-red-400">cancel</span>
                    )}
                  </span>
                </div>
                {refMsg && (
                  <p className={`text-[11px] ml-2 mt-1 ${refStatus === "valid" ? "text-green-400" : "text-red-400"}`}>
                    {refMsg}
                  </p>
                )}
              </div>

              {/* Submit Action */}
              <div className="pt-1">
                <button
                  className="btn-3d-red w-full h-11 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 group"
                  type="submit"
                  disabled={submitting}
                >
                  <span>{submitting ? "Creating Account..." : "Continue to Verification"}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
              {error && <p className="text-center text-xs text-red-300">{error}</p>}

              {/* Secondary Options */}
              <p className="text-center font-body-md text-xs text-text-secondary mt-3">
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/employer/employer-sign-in")}
                  className="text-primary hover:underline font-bold cursor-pointer"
                >
                  Sign In
                </span>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
