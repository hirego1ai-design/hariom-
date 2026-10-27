export default function EmployerDashboardLoading() {
  return (
    <div className="min-h-screen flex bg-[#0A0A0C] text-white">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r border-white/5 p-4 space-y-6">
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        <div className="space-y-3 pt-4">
          <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between">
          <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        {/* Dashboard Content Skeleton */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Welcome Banner Skeleton */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3">
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-96 max-w-full bg-white/5 rounded animate-pulse" />
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Jobs & Pipeline Section */}
          <div className="h-80 rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
