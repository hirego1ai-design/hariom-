"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [targetEmail, setTargetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("reset_email");
      if (stored) {
        setTargetEmail(stored);
      } else {
        router.push("/forgot-password");
      }
    }
  }, [router]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;
    if (errorMessage) setErrorMessage("");

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && e.currentTarget.previousElementSibling) {
      (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("").trim();
    if (code.length < 6) {
      setErrorMessage("Please enter all 6 digits of the recovery code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp: code,
          type: "RESET_PASSWORD",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Invalid or expired recovery code.");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("reset_otp", code);
      }

      router.push("/reset-password");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus("Sending new code...");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      if (res.ok) {
        setResendStatus("New code sent to your email!");
      } else {
        setResendStatus("Failed to resend code.");
      }
    } catch {
      setResendStatus("Failed to resend code.");
    }
    setTimeout(() => setResendStatus(""), 4000);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-3 sm:p-5 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-30" />
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 15% 15%, rgba(66,133,244,0.10) 0%, transparent 45%), radial-gradient(ellipse at 85% 15%, rgba(234,67,53,0.10) 0%, transparent 45%), radial-gradient(ellipse at 85% 85%, rgba(251,188,5,0.08) 0%, transparent 45%), radial-gradient(ellipse at 15% 85%, rgba(52,168,83,0.08) 0%, transparent 45%)",
        }}
      />

      <div
        className="w-full max-w-[440px] overflow-hidden relative z-10 my-auto p-6 sm:p-7 space-y-4"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1.5px solid var(--outline)",
          borderRadius: "20px",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.12), 0 0 0 1px var(--outline)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 z-20"
          style={{
            background:
              "linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%, #34A853 100%)",
          }}
        />

        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-2"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
            }}
          >
            <span className="material-symbols-outlined text-white text-[24px]">mark_email_read</span>
          </div>
          <h1
            className="text-lg font-extrabold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Check Your Email
          </h1>
          <p className="text-xs text-text-secondary">
            We sent a 6-digit recovery code to <br />
            <strong className="text-text-primary">{targetEmail}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {resendStatus && (
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400 text-center">
            {resendStatus}
          </div>
        )}

        <div className="flex gap-2 justify-center py-2">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-10 h-12 rounded-xl text-center text-lg font-extrabold font-mono outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1.5px solid var(--outline)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255,82,82,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--outline)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          ))}
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isLoading}
            className="btn-3d-red w-full h-10 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Verify Code</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] font-semibold">
            <Link
              href="/forgot-password"
              className="text-text-muted hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">arrow_back</span>
              <span>Change Email</span>
            </Link>
            <button
              type="button"
              onClick={handleResend}
              className="text-primary hover:underline font-bold"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
