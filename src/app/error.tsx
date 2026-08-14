"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5252]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-white/10 text-center relative z-10 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FF5252]/10 border border-[#FF5252]/20 text-[#FF5252] flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-white">System Exception Encountered</h1>
          <p className="text-sm text-gray-400">
            An unforeseen runtime error occurred. Our automated telemetry logs have captured this incident.
          </p>
          {error?.digest && (
            <p className="text-xs text-gray-500 font-mono pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 rounded-xl bg-[#FF5252] text-white font-semibold text-sm hover:bg-[#FF5252]/90 transition-all duration-200 shadow-lg shadow-[#FF5252]/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </button>
          
          <Link
            href="/employer/dashboard"
            className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
