export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow pulse */}
      <div className="absolute w-72 h-72 bg-[#448AFF]/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#448AFF] animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          Loading HireGo AI...
        </p>
      </div>
    </div>
  );
}
