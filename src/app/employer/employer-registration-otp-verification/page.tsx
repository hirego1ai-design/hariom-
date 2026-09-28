"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, HelpCircle } from "lucide-react";

export default function EmployerOTPVerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
    if (params.get("sent") === "0") {
      setNotice("Your account was created, but the verification email provider did not accept the first code. Use Resend Code to try again.");
    }
  }, []);

  async function resendCode() {
    if (!email || resending) return;
    setResending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to resend verification code.");
      }
      setNotice(result.message || "A new verification code was requested.");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend verification code.");
    } finally {
      setResending(false);
    }
  }

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
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-text-primary px-3 sm:px-4 py-6">
      <div className="w-full max-w-[800px] mx-auto grid grid-cols-1 md:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto">
        {/* Left Side: Visual & Progress */}
        <section className="hidden md:flex md:col-span-5 lg:col-span-4 bg-surface-container-low/40 border-r border-white/10 flex-col p-5 sm:p-6 justify-between relative">
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
                src="/marketing/hirego-logo.png"
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
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[420px]">
            {/* Header */}
            <div className="mb-4">
              <h1 className="font-display-xl text-[26px] leading-tight font-bold text-primary mb-1">
                Verify Your Identity
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                Enter the 6-digit verification code for{" "}
                <span className="text-primary font-bold">{email || "your email address"}</span>. If delivery failed, request a new code below.
              </p>
            </div>

            {/* OTP Form */}
            <form
              className="space-y-4"
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
                  disabled={!email || resending}
                  className="text-xs text-primary font-bold hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void resendCode()}
                >
                  {resending ? "Resending…" : "Resend Code"}
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  className="btn-3d-red w-full h-11 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 group shadow-md"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify and Continue</span>
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {notice && (
              <p role="status" className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-text-secondary">{notice}</p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>
            )}
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[11px] text-text-secondary">
                  If verification remains unavailable, return to sign in and retry verification after the email service recovers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
