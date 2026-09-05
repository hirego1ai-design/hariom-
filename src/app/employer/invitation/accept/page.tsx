"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invitation token is missing. Please use the link provided in your email.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/employer/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Unable to accept invitation.");
      }

      setSuccess(data.message || "Invitation accepted successfully!");
      setCompanyName(data.companyName);
    } catch (err: any) {
      setError(err.message || "An error occurred while accepting the invitation.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 rounded-lg bg-zinc-900 border border-zinc-800 text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to {companyName || "the Team"}!</h2>
        <p className="text-zinc-400 mb-6">{success}</p>
        <Link 
          href="/employer/employer-sign-in" 
          className="inline-block w-full py-3 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition duration-200"
        >
          Sign In to Employer Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-2 text-center">Accept Team Invitation</h2>
      <p className="text-zinc-400 text-sm text-center mb-6">Complete your profile to join your company on HireGo.</p>

      {error && (
        <div className="p-3 mb-4 rounded bg-red-950/30 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm font-medium mb-1" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            disabled={loading || !token}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm font-medium mb-1" htmlFor="password">
            Set Password
          </label>
          <input
            id="password"
            type="password"
            required
            disabled={loading || !token}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
            placeholder="Min. 8 chars (letters & numbers)"
          />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm font-medium mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            disabled={loading || !token}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
            placeholder="Re-enter password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3 px-4 mt-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:hover:bg-emerald-600"
        >
          {loading ? "Processing..." : "Accept Invitation & Join Team"}
        </button>
      </form>
    </div>
  );
}

export default function InvitationAcceptPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-lg bg-zinc-900 border border-zinc-800 text-center shadow-xl text-zinc-400">
          Loading invitation details...
        </div>
      }>
        <InvitationAcceptContent />
      </Suspense>
    </div>
  );
}
