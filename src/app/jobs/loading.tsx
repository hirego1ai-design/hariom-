export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Search Skeleton */}
      <div className="space-y-4">
        <div className="h-10 w-64 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-5 w-96 max-w-full bg-white/5 rounded animate-pulse" />
        <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-28 bg-white/5 rounded-xl flex-shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-7 w-20 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-7 w-24 bg-white/5 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
