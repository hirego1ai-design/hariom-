import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#448AFF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-white/10 text-center relative z-10 space-y-6">
        <div className="text-6xl font-bold font-mono text-[#448AFF]">404</div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold font-heading text-white">Route Not Found</h1>
          <p className="text-sm text-gray-400">
            The page or workspace location you requested does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/employer/dashboard"
            className="w-full py-3 px-6 rounded-xl bg-[#448AFF] text-white font-semibold text-sm hover:bg-[#448AFF]/90 transition-all duration-200 shadow-lg shadow-[#448AFF]/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Employer Dashboard
          </Link>
          <Link
            href="/"
            className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
