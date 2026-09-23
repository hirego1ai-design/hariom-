"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SessionUser = { name?: string; email?: string; role?: string };

export default function EmployerRegistrationCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManagedHiring = searchParams.get("model") === "managed";
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success || !payload.authenticated) throw new Error(payload.error || "Unable to confirm your authenticated account.");
        if (!["EMPLOYER", "RECRUITER"].includes(payload.user?.role)) throw new Error("An employer account is required.");
        setUser(payload.user);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to confirm your account."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center p-4 text-text-primary">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121215] p-7">
        <h1 className="text-3xl font-bold text-white">Registration step completed</h1>
        <p className="mt-3 text-sm text-text-secondary">
          This page confirms only the authenticated account session. Document verification, subscription activation, credits, proctoring capability, and managed-hiring agreement status are shown only by their authoritative workflows.
        </p>

        {loading && <div role="status" className="mt-6 rounded-xl border border-white/10 p-4 text-sm text-text-muted">Confirming account session…</div>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {!loading && !error && user && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Authenticated account confirmed</p>
            <p className="mt-2 text-sm text-white">{user.name || user.email || "Employer account"}</p>
            <p className="mt-1 text-xs text-text-muted">Role: {user.role}</p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading || !!error}
            onClick={() => router.push(isManagedHiring ? "/employer/managed-hiring/request" : "/employer/dashboard")}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isManagedHiring ? "Continue to Hiring Requirement" : "Open Employer Dashboard"}
          </button>
          <button type="button" onClick={() => router.push("/employer/dashboard")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white">
            Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}
