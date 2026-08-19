"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide both email and system security key.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "admin" }),
      });
      const result = await response.json().catch(() => ({ success: false, error: "The sign-in service returned an invalid response." }));

      if (!response.ok || !result.success) {
        setError(result.error || "Invalid Admin security credentials.");
        return;
      }

      const requestedRedirect = new URLSearchParams(window.location.search).get("redirect");
      const destination = requestedRedirect?.startsWith("/admin/") && requestedRedirect !== "/admin/login"
        ? requestedRedirect
        : "/admin/dashboard";
      window.location.assign(destination);
    } catch {
      setError("Unable to reach the admin sign-in service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4 relative overflow-hidden flex-1">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-[440px] flex flex-col items-center z-10">
          {/* Brand Anchor */}
          <div className="mb-6 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-2xl border border-white/10 mb-2">
              <span className="material-symbols-outlined text-white text-[32px]">shield_person</span>
            </div>
            <h1 className="font-display-lg text-2xl font-bold text-text-primary tracking-tight text-center">
              HireGo AI <span className="text-primary font-extrabold">Admin</span>
            </h1>
            <p className="font-body-md text-xs text-text-secondary text-center max-w-[300px]">
              Authorized systems personnel only. Access is monitored and logged.
            </p>
          </div>

          {/* Login Form Card */}
          <div className="glass-card w-full p-6 lg:p-8 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-1">
                <label className="font-label-md text-xs font-bold text-text-secondary ml-3" htmlFor="email">
                  System Admin Email
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[18px]">
                    alternate_email
                  </span>
                  <input
                    className="w-full h-11 rounded-full bg-[#1E1E1E] border border-white/10 pl-11 pr-5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all duration-300"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hirego.ai"
                    required
                    type="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-3">
                  <label className="font-label-md text-xs font-bold text-text-secondary" htmlFor="password">
                    Security Key
                  </label>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[18px]">
                    lock_reset
                  </span>
                  <input
                    className="w-full h-11 rounded-full bg-[#1E1E1E] border border-white/10 pl-11 pr-11 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all duration-300"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* CTA Action */}
              <div className="pt-2">
                <button
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-primary hover:bg-primary-light font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  type="submit"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin Console</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Note */}
              <div className="pt-3 border-t border-white/5 text-center">
                <p className="text-[11px] text-text-muted italic flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Admin System Active. All session logs recorded.
                </p>
              </div>
            </form>
          </div>

          {/* Back Link */}
          <div className="mt-4">
            <Link href="/" className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1">
              ← Return to Public Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
