"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployerOTPVerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") || "");
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

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
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      
      <div className="w-full max-w-[1050px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Progress */}
        <section className="hidden md:flex md:col-span-5 lg:col-span-4 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-8 justify-between relative">
          {/* Brand Logo */}
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
          </div>

          {/* Futuristic Isometric 3D Illustration */}
          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[200px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-75 animate-pulse"></div>
              <img
                className="relative z-10 w-full h-full object-contain"
                alt="Futuristic isometric 3D illustration"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsxYV2aREJbeHmmorT35Kdd3Eyo3rEUnfqu8PxRQPv0VH8ujIhTLUb8DQRPXGOCON7Jwd8NgixwTtLgaXkPhyMiUFjnUPR_Xt_UFZkAUA7_YcFL6ppfQidkwR4fvvv_DpkvKSi9rWtHPc786GaIniskb5aoPGXRxexpW3BRhU7rhLu9tuFb_g8rJnv2P6R85J5SHixzoAHz333EDBu_GZ0tXCx7VDmUODACmisj7nxoRoR4uwDrQ6YZyGkmWBNnnOoeY6KghM9vyE"
              />
            </div>
          </div>

          {/* Registration progress */}
          <div className="relative z-10 space-y-3 pl-1">
            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 1
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  Company Profile
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold">
                2
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  Step 2
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Verify Identity
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

        {/* Right Side: OTP Input Form */}
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-[560px]">
            {/* Header */}
            <div className="mb-5">
              <h1 className="font-display-xl text-headline-md text-primary mb-1">
                Verify Your Identity
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                We've sent a 6-digit verification code to{" "}
                <span className="text-primary font-bold">{email || "your corporate email"}</span>
              </p>
            </div>

            {/* OTP Form */}
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const code = otp.join("");
                if (!email || code.length !== 6) { setError("Enter the six-digit verification code."); return; }
                setSubmitting(true); setError("");
                try {
                  const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp: code, type: "VERIFY_EMAIL" }) });
                  const result = await response.json();
                  if (!response.ok || !result.success) throw new Error(result.error || "Verification failed.");
                  router.push("/employer/employer-registration-business-model");
                } catch (err) { setError(err instanceof Error ? err.message : "Verification failed."); }
                finally { setSubmitting(false); }
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-xs text-on-surface-variant ml-1">
                  6-Digit Verification Passcode
                </label>

                {/* 6 Digit Inputs */}
                <div className="flex gap-2.5 justify-center py-2">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={data}
                      onChange={(e) => handleChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-11 h-12 rounded-xl text-center text-lg font-bold font-mono outline-none transition-all bg-white/5 border border-white/10 text-white focus:border-primary focus:bg-white/10"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code */}
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-text-secondary">Didn't receive the code?</p>
                <button
                  type="button"
                  className="text-xs text-primary font-bold hover:underline"
                  onClick={() => alert("Passcode re-sent to your corporate email!")}
                >
                  Resend Code (0:45)
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  className="btn-3d-red w-full h-12 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 group"
                  type="submit"
                  disabled={submitting}
                >
                  <span>{submitting ? "Verifying..." : "Verify and Continue"}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Support Box */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    contact_support
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">
                    Need help with registration?
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Our support team is online 24/7.{" "}
                    <a className="text-primary hover:underline font-bold" href="#">
                      Contact Support →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
