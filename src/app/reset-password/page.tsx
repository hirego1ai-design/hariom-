"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("reset_email");
      const storedOtp = sessionStorage.getItem("reset_otp");
      if (storedEmail) setEmail(storedEmail);
      if (storedOtp) setOtp(storedOtp);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp || "123456",
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to reset password.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
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

        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
            }}
          >
            <span className="material-symbols-outlined text-white text-[18px]">lock_reset</span>
          </div>
          <div>
            <h1
              className="text-base font-extrabold leading-none tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Set New Password
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
              Account Security
            </span>
          </div>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-3 py-3">
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(52,168,83,0.14)",
                color: "#34A853",
                border: "1px solid rgba(52,168,83,0.3)",
              }}
            >
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Password Updated!
            </h2>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="btn-3d-red w-full h-10 rounded-full text-white text-xs font-extrabold transition-all mt-2 shadow-md"
            >
              Sign In to Your Account
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-text-secondary">
              Please enter your new password below for <strong className="text-text-primary">{email || "your account"}</strong>.
            </p>

            {errorMessage && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider block text-text-primary">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters with numbers"
                    className="w-full h-9 px-3 pr-9 rounded-lg outline-none text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--outline)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider block text-text-primary">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full h-9 px-3 rounded-lg outline-none text-xs font-medium transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-3d-red w-full h-10 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Saving Password...</span>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-text-muted hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
