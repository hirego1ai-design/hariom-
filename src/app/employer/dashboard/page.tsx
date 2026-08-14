"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer, PageHeader, Card, StatusBadge } from "@/components/employer/LayoutSystem";
import { useEmployer } from "@/context/EmployerContext";

// Local theme tokens matching premium enterprise dark aesthetics
const T = {
  pageBg: "#0A0A0C",
  card: "#121215",
  cardAlt: "#16161B",
  border: "rgba(255, 255, 255, 0.06)",
  red: "#FF5252",
  green: "#26A69A",
  blue: "#29B6F6",
  yellow: "#FFCA28",
  purple: "#AB47BC",
  slateSecondary: "#94A3B8",
  sky: "#00BCD4"
};

export default function EmployerDashboard() {
  const router = useRouter();
  const { dashboardStats, candidates, jobs, interviews } = useEmployer();

  // Dashboard Personalization states
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [pinnedWidgets, setPinnedWidgets] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global filters
  const [dateRange, setDateRange] = useState("30");
  const [selectedDept, setSelectedDept] = useState("All");

  // Temporary toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleHideWidget = (id: string) => {
    setHiddenWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
    triggerToast(hiddenWidgets.includes(id) ? "Widget restored to view." : "Widget hidden from layout.");
  };

  const togglePinWidget = (id: string) => {
    setPinnedWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
    triggerToast(pinnedWidgets.includes(id) ? "Widget unpinned." : "Widget pinned to priority section.");
  };

  const isWidgetVisible = (id: string) => !hiddenWidgets.includes(id);
  const isWidgetPinned = (id: string) => pinnedWidgets.includes(id);

  // Helper to extract department
  const getJobDept = (job: any) => {
    if (job.department) return job.department;
    if (job.title.includes("Product Designer") || job.title.includes("Design")) return "Design";
    if (job.title.includes("Marketing")) return "Marketing";
    return "Engineering";
  };

  // Helper to extract hiring manager
  const getHiringManager = (job: any) => {
    if (job.hiringManager) return job.hiringManager;
    if (job.id === "J1001") return "Sarah Jenkins";
    return "David O'Connor";
  };

  // Active jobs filter
  const activeJobsList = useMemo(() => {
    return jobs.filter(j => {
      const dept = getJobDept(j);
      if (selectedDept !== "All" && dept !== selectedDept) return false;
      return j.status === "Active";
    });
  }, [jobs, selectedDept]);

  // Unique departments for filter dropdown
  const uniqueDepts = useMemo(() => {
    const list = Array.from(new Set(jobs.map(j => getJobDept(j))));
    return ["All", ...list];
  }, [jobs]);

  return (
    <div className="min-h-screen">
        <PageHeader 
          title="Dashboard Overview" 
          subtitle="Welcome back, Talent Acquisition Team." 
        />

        <PageContainer>

      {/* ─── TOAST BANNERS ─── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-sky-400/30 text-sky-400 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm">info</span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER / BUSINESS INTEL BANNER ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-5 rounded-[20px] bg-slate-900/40 border border-white/5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Welcome Back</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-sky-400 font-display">Acme Corporation Recruiting</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-yellow bg-yellow/10 px-2 py-0.5 rounded border border-yellow/20 text-[10px]">Enterprise Plan</span>
          </div>
          <h2 className="text-lg font-extrabold text-white mt-1" style={{ fontFamily: "var(--font-display)" }}>AI Hiring Operating System Dashboard</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 text-xs">
          {/* Notification Bell */}
          <Link 
            href="/employer/employer-notifications-center" 
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors relative"
            title="Notifications Center"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red animate-pulse" />
          </Link>
          {/* Dashboard Level Filter Bars */}
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-slate-300 outline-none cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-slate-300 outline-none cursor-pointer"
          >
            {uniqueDepts.map(d => (
              <option key={d} value={d}>{d} Roles</option>
            ))}
          </select>

          {hiddenWidgets.length > 0 && (
            <button 
              onClick={() => { setHiddenWidgets([]); setPinnedWidgets([]); }}
              className="px-3.5 h-9 rounded-xl border border-dashed border-white/10 hover:bg-slate-800 text-[10px] uppercase font-bold text-slate-400"
            >
              Reset Layout ({hiddenWidgets.length})
            </button>
          )}
        </div>
      </div>

      {/* ─── HIREGO USAGE & CREDITS CARD ─── */}
      <section className="p-5 rounded-[20px] border relative space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-400">account_balance_wallet</span>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">HireGo Usage &amp; Credits</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Your active subscription quotas and remaining usage balance</p>
          </div>
          <Link
            href="/employer/subscriptions"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5252] text-white hover:bg-[#E53935] transition-colors shadow flex items-center gap-2"
          >
            <span>Manage Subscription &amp; Credits</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Job Posts Quota */}
          <div className="p-4 rounded-xl border bg-white/[0.02]" style={{ borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Posts</span>
              <span className="material-symbols-outlined text-red text-sm">work</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-mono">{dashboardStats.companyCredits?.jobPostsLeft ?? 0}</span>
              <span className="text-xs text-slate-400 font-semibold">Remaining</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-red rounded-full" style={{ width: `${Math.min(100, ((dashboardStats.companyCredits?.jobPostsLeft ?? 0) / 10) * 100)}%` }} />
            </div>
          </div>

          {/* Candidate Unlocks Quota */}
          <div className="p-4 rounded-xl border bg-white/[0.02]" style={{ borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Unlocks</span>
              <span className="material-symbols-outlined text-blue text-sm">lock_open</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-mono">{dashboardStats.companyCredits?.resumeUnlocksLeft ?? 0}</span>
              <span className="text-xs text-slate-400 font-semibold">Remaining</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue rounded-full" style={{ width: `${Math.min(100, ((dashboardStats.companyCredits?.resumeUnlocksLeft ?? 0) / 100) * 100)}%` }} />
            </div>
          </div>

          {/* AI Interviews Quota */}
          <div className="p-4 rounded-xl border bg-white/[0.02]" style={{ borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Interviews</span>
              <span className="material-symbols-outlined text-purple text-sm">smart_toy</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-mono">{dashboardStats.companyCredits?.aiInterviewsLeft ?? 0}</span>
              <span className="text-xs text-slate-400 font-semibold">Remaining</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-purple rounded-full" style={{ width: `${Math.min(100, ((dashboardStats.companyCredits?.aiInterviewsLeft ?? 0) / 50) * 100)}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK ACTIONS GRID ─── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: "stars", label: "HireGo Managed Hiring™", href: "/employer/managed-hiring/request", color: T.yellow },
          { icon: "add_box", label: "Post New Job", href: "/employer/create-job-basic-info", color: T.red },
          { icon: "person_search", label: "Search Candidates", href: "/employer/proactive-candidate-search", color: T.blue },
          { icon: "cloud_upload", label: "Import Jobs", href: "/employer/import-jobs", color: T.green },
          { icon: "calendar_month", label: "Schedule Interview", href: "/employer/interview-scheduler", color: T.yellow },
          { icon: "group_add", label: "Invite Recruiter", href: "/employer/team-members-management", color: T.purple },
          { icon: "analytics", label: "Hiring Report", href: "/employer/employer-analytics-dashboard", color: T.slateSecondary },
          { icon: "smart_toy", label: "AI Copilot Hub", href: "/employer/ai-hiring-copilot-hub", color: T.sky },
          { icon: "insights", label: "AI Insights", href: "/employer/ai-hiring-insights", color: T.purple },
          { icon: "command", label: "Command Center", href: "/employer/career-command-center", color: T.red }
        ].map((act, i) => (
          <button 
            key={i}
            onClick={() => router.push(act.href)}
            className="p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-0.5 hover:bg-slate-900/60 transition-all shadow cursor-pointer group"
            style={{ backgroundColor: act.label.includes("Managed") ? `${T.yellow}10` : T.card, borderColor: act.label.includes("Managed") ? `${T.yellow}40` : T.border }}
          >
            <span className="material-symbols-outlined text-[22px] group-hover:scale-105 transition-transform" style={{ color: act.color }}>{act.icon}</span>
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">{act.label}</span>
          </button>
        ))}
      </section>

      {/* ─── TODAY'S PRIORITIES (AI AUTOPILOT ALERTS) ─── */}
      {isWidgetVisible("priorities") && (
        <section className={`p-5 rounded-[20px] border relative space-y-4`} style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-red animate-pulse">crisis_alert</span>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Today's Urgent Priorities</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => togglePinWidget("priorities")} className="p-1 rounded text-slate-400 hover:text-white" title="Pin Widget">
                <span className="material-symbols-outlined text-sm">{isWidgetPinned("priorities") ? "keep_off" : "keep"}</span>
              </button>
              <button onClick={() => toggleHideWidget("priorities")} className="p-1 rounded text-slate-400 hover:text-white" title="Hide Widget">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 1, title: "23 qualified candidates waiting review", role: "AI Screen Completed", action: "Review", href: "/employer/proactive-candidate-search", border: "rgba(38,166,154,0.3)" },
              { id: 2, title: "2 jobs require title/description updates", role: "Lower SEO visibility index", action: "Optimize", href: "/employer/job-listings-management", border: "rgba(255,202,40,0.3)" },
              { id: 3, title: "1 key candidate offer awaiting final signoff", role: "Lead Dev position", action: "Signoff", href: "/employer/offer-management-dashboard", border: "rgba(255,82,82,0.3)" },
              { id: 4, title: "Marketing Manager position expires tomorrow", role: "Nearing 30-day live limit", action: "Extend", href: "/employer/job-listings-management", border: "rgba(171,71,188,0.3)" }
            ].map((prio) => (
              <div 
                key={prio.id} 
                className="p-4 rounded-xl border flex flex-col justify-between gap-3 text-xs"
                style={{ backgroundColor: T.cardAlt, borderColor: prio.border }}
              >
                <div>
                  <p className="font-bold text-white leading-snug">{prio.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">{prio.role}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => router.push(prio.href)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white transition-all"
                  >
                    {prio.action}
                  </button>
                  <button onClick={() => triggerToast("Task dismissed")} className="px-3 py-1 rounded hover:bg-slate-800 text-[10px] font-bold text-slate-500">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── LEVEL 1: KPI CARDS WITH SPARKLINE METRICS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* KPI 1 */}
        <div className="p-5 rounded-[20px] border flex flex-col gap-3 relative" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Open Live Jobs</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-display">{dashboardStats?.activeJobs || 0}</h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">{dashboardStats?.activeJobsGrowth || "+0"}</span>
          </div>
          
          <div className="h-8 flex items-end">
            {/* Sparkline */}
            <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-400 stroke-current stroke-2 fill-none">
              <path d="M0,25 Q15,20 30,22 T60,10 T90,5 L100,8" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold italic">AI Insight: Active jobs volume up 14% matching Q3 hiring target velocity.</p>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-[20px] border flex flex-col gap-3 relative" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Applications Received</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-display">{dashboardStats?.totalApplications || 0}</h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">{dashboardStats?.totalApplicationsGrowth || "+0"}</span>
          </div>

          <div className="h-8 flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-400 stroke-current stroke-2 fill-none">
              <path d="M0,28 C20,20 40,25 60,12 C80,3 90,8 100,5" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold italic">AI Insight: High search index optimization boosting organic visibility.</p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-[20px] border flex flex-col gap-3 relative" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Shortlisted Candidates</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-display">{dashboardStats?.shortlisted || 0}</h3>
            </div>
            <span className="text-[10px] text-yellow bg-yellow/10 px-1.5 py-0.5 rounded font-bold">Awaiting Feedback</span>
          </div>

          <div className="h-8 flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full text-yellow stroke-current stroke-2 fill-none">
              <path d="M0,15 C20,18 40,10 60,18 C80,22 90,8 100,12" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold italic">AI Insight: Bottleneck detected at candidate screening stages.</p>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-[20px] border flex flex-col gap-3 relative" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Interviews</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-display">{interviews?.length || 0}</h3>
            </div>
            <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded font-bold">Scheduled</span>
          </div>

          <div className="h-8 flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full text-sky-400 stroke-current stroke-2 fill-none">
              <path d="M0,25 C30,20 50,5 70,12 C90,20 100,5 100,5" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold italic">AI Insight: Interview completion rate remains constant at 94%.</p>
        </div>

        {/* KPI 5 */}
        <div className="p-5 rounded-[20px] border flex flex-col gap-3 relative" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Offers Sent</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-display">{dashboardStats?.funnel?.offer || 0}</h3>
            </div>
            <span className="text-[10px] text-purple bg-purple/10 px-1.5 py-0.5 rounded font-bold">Pending</span>
          </div>

          <div className="h-8 flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full text-purple stroke-current stroke-2 fill-none">
              <path d="M0,20 C30,20 50,22 70,8 C90,15 100,3 100,3" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold italic">AI Insight: Offer acceptance velocity is 8 days faster than market average.</p>
        </div>

        {/* KPI 6 */}
        <div className="p-5 rounded-[20px] border flex flex-col gap-3 relative" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Successful Hires</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-display">{dashboardStats?.hired || 0}</h3>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-bold">{dashboardStats?.hiredPeriod || "Hired"}</span>
          </div>

          <div className="h-8 flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full text-slate-400 stroke-current stroke-2 fill-none">
              <path d="M0,28 L20,25 L45,18 L70,12 L90,8 L100,5" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold italic">AI Insight: Cost per hire reduced by 11% using local sourcing models.</p>
        </div>

      </section>

      {/* ─── HIRING GOAL TRACKER & PIPELINE HEALTH INDEX ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Hiring Goal Tracker */}
        <div className="p-5 rounded-[20px] border flex flex-col justify-between gap-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Goal Tracker</span>
              <span className="text-emerald-400 font-display flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> On Track
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white mt-1">Monthly Recruitment Goal</h4>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Hires Completed: 12</span>
              <span>Target: 20 Hires</span>
            </div>
            {/* Progress Bar Container */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: "60%" }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Remaining: 8 Hires</span>
              <span>Projected Date: August 18</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-lg border border-white/5 leading-normal">
            AI Projection: Predicts target will be met 2 days ahead of schedule based on candidate pipeline flow volume.
          </p>
        </div>

        {/* AI Hiring Health Index Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiring Health Index</p>
              <h3 className="text-lg font-extrabold text-white mt-0.5">Overall Index Rating: <span className="text-sky-400">92/100</span></h3>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Optimal Performance</span>
          </div>

          {/* Index breakdown grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Job Quality Score", val: 95, color: T.green },
              { label: "Candidate Quality", val: 90, color: T.green },
              { label: "Response Speed", val: 91, color: T.green },
              { label: "Interview Success", val: 94, color: T.green },
              { label: "Offer Acceptance", val: 89, color: T.yellow },
              { label: "Recruiter Activity", val: 96, color: T.green }
            ].map((idx, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-snug">{idx.label}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white font-extrabold text-sm">{idx.val}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: idx.val > 90 ? T.green : T.yellow }} />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-white/5">
            <span className="font-semibold text-white">AI Suggestion: Increase interview feedback speed in Eng dept to gain +3 score.</span>
            <button className="text-sky-400 hover:underline font-bold text-[10px] uppercase tracking-wider">Optimize</button>
          </div>
        </div>

      </section>

      {/* ─── PIPELINE & AI ASSISTANT PANEL ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Full hiring funnel visualization */}
        <div className="lg:col-span-2 p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiring Pipeline Funnel</p>
              <h3 className="text-sm font-extrabold text-white mt-1">Recruitment Funnel Velocity &amp; Conversion Rates</h3>
            </div>
            <span className="text-[10px] text-slate-400">Total volume: {dashboardStats?.funnel?.sourcing || 0} applicants</span>
          </div>

          <div className="space-y-2">
            {[
              { stage: "Applications Received", count: dashboardStats?.funnel?.sourcing || 0, conv: "100%", time: "Instant", width: "100%" },
              { stage: "AI Screen Passed", count: dashboardStats?.funnel?.screening || 0, conv: "67%", time: "4.2 mins", width: "85%" },
              { stage: "Screening Cleared", count: dashboardStats?.funnel?.screening || 0, conv: "45%", time: "1 day", width: "70%" },
              { stage: "Shortlisted Teams", count: dashboardStats?.shortlisted || 0, conv: "41%", time: "2 days", width: "55%" },
              { stage: "Interviews Conducted", count: dashboardStats?.interviews || 0, conv: "26%", time: "5 days", width: "40%" },
              { stage: "Offers Formulated", count: dashboardStats?.funnel?.offer || 0, conv: "42%", time: "3 days", width: "25%" },
              { stage: "Successful Hires", count: dashboardStats?.hired || 0, conv: "27%", time: "8 days", width: "12%" }
            ].map((fun, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <div className="w-32 text-slate-400 font-medium truncate">{fun.stage}</div>
                <div className="flex-1 h-8 bg-slate-900 rounded-lg relative overflow-hidden flex items-center px-4 border border-white/5">
                  <div className="absolute inset-y-0 left-0 bg-sky-500/10 border-r border-sky-400/20" style={{ width: fun.width }} />
                  <div className="relative z-10 flex justify-between w-full text-[10px] font-bold">
                    <span className="text-white">{fun.count.toLocaleString()}</span>
                    <span className="text-slate-400">{fun.conv} conv · avg {fun.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations Command Hub */}
        <div className="p-5 rounded-[20px] border flex flex-col justify-between gap-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div>
            <div className="flex items-center gap-1.5 text-sky-400 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-sm">psychology</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">AI Recruiter Assistant</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold">Active Suggestions</p>
          </div>

          <div className="space-y-3.5 flex-1">
            {[
              { title: "Review Senior Backend Engineer applicants", desc: "18 High Match candidates have cleared the technical smart code screening.", action: "Review", priority: "High Priority", color: T.red },
              { title: "Increase Solidity salary scale range", desc: "Competitors are offering 8% higher base salaries for Ethereum developers.", action: "Optimize", priority: "Medium Priority", color: T.yellow },
              { title: "Close inactive expired marketing role", desc: "Zero applicant activity for over 14 days. Free up license pipeline cap.", action: "Deactivate", priority: "Low Priority", color: T.slateSecondary }
            ].map((rec, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-900 border border-white/5 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase" style={{ color: rec.color }}>{rec.priority}</span>
                  <button 
                    onClick={() => triggerToast(`Initiated action: ${rec.action}`)}
                    className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[9px] uppercase tracking-wider"
                  >
                    {rec.action}
                  </button>
                </div>
                <p className="font-bold text-white mt-1">{rec.title}</p>
                <p className="text-[10px] text-slate-400 leading-normal">{rec.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ─── UPCOMING INTERVIEWS & SMART ALERTS HUB ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Upcoming Interview Schedule */}
        <div className="lg:col-span-2 p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Today's Interview Schedule</h3>
            <span className="text-[10px] text-slate-400">Total Interviews: 8 today</span>
          </div>

          <div className="space-y-2.5">
            {interviews?.length === 0 ? (
              <div className="p-5 text-center text-slate-400 bg-slate-900/50 rounded-xl">No interviews scheduled yet.</div>
            ) : interviews?.map((meet, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                    {meet.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white">{meet.candidateName} <span className="text-[10px] font-normal text-slate-400">({meet.time})</span></p>
                    <p className="text-[10px] text-slate-400 truncate">{meet.jobTitle} · {meet.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => triggerToast("Launching video meeting portal...")} className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 font-bold text-white text-[9px] uppercase tracking-wider">Join</button>
                  <button onClick={() => triggerToast("Reschedule request generated")} className="px-2.5 py-1 rounded hover:bg-slate-800 font-semibold text-slate-400 text-[9px] uppercase tracking-wider border border-white/5">Reschedule</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Smart Alerts Panel */}
        <div className="p-5 rounded-[20px] border flex flex-col justify-between gap-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alerts &amp; Notifications</p>
            <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
          </div>

          <div className="space-y-3 divide-y divide-white/5 text-xs flex-1">
            {[
              { type: "accept", msg: "Candidate Alex Rivera accepted the Solidity Architect offer.", time: "12 mins ago", color: T.green },
              { type: "expiry", msg: "Front-end Developer salary benchmark scale details missing.", time: "1 hour ago", color: T.yellow },
              { type: "complete", msg: "Assessment code challenges completed by 4 applicants.", time: "3 hours ago", color: T.blue },
              { type: "warning", msg: "Dev Ops job listing expiring within the next 24 hours.", time: "Yesterday", color: T.red }
            ].map((ntf, i) => (
              <div key={i} className="pt-2.5 first:pt-0 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ntf.color }} />
                <div>
                  <p className="text-slate-300 leading-snug">{ntf.msg}</p>
                  <span className="text-[9px] text-slate-500 font-semibold">{ntf.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ─── APPLICATION ANALYTICS (CUSTOM RENDERED CHARTS) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Application Source Distribution */}
        <div className="p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiring Sourcing Channels</p>
          
          <div className="space-y-3.5">
            {[
              { source: "LinkedIn Recruiter Network", count: 124, pct: 44, color: T.blue },
              { source: "Acme Careers Portal Hub", count: 80, pct: 28, color: T.green },
              { source: "Internal Team Referral Program", count: 34, pct: 12, color: T.yellow },
              { source: "HireGo AI Smart Sourcing", count: 28, pct: 10, color: T.sky },
              { source: "Other Channels (Indeed, Glassdoor)", count: 18, pct: 6, color: T.purple }
            ].map((src, i) => (
              <div key={i} className="text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="font-semibold">{src.source}</span>
                  <span>{src.count} ({src.pct}%)</span>
                </div>
                {/* Channel Bar Chart */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${src.pct}%`, backgroundColor: src.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offer acceptance rate statistics */}
        <div className="lg:col-span-2 p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compensation Offer Pipeline</p>
              <h3 className="text-sm font-extrabold text-white mt-1">Average Acceptance Yield: <span className="text-emerald-400">84.2%</span></h3>
            </div>
            <span className="text-slate-400 text-xs">Total: 7 Offers issued</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs">
            {[
              { label: "Offers Issued", count: 7, sub: "Last 30 Days", border: "rgba(255,255,255,0.05)" },
              { label: "Accepted Hires", count: 5, sub: "Onboard Process", border: "rgba(38,166,154,0.2)" },
              { label: "Under Review", count: 2, sub: "Pending Decisions", border: "rgba(255,202,40,0.2)" },
              { label: "Offer Rejections", count: 0, sub: "Negotiations Awaited", border: "rgba(255,82,82,0.1)" },
              { label: "Expired Offers", count: 0, sub: "Awaiting Renewal", border: "rgba(255,255,255,0.05)" }
            ].map((off, i) => (
              <div key={i} className="p-3.5 rounded-xl border bg-slate-900/60" style={{ borderColor: off.border }}>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{off.label}</p>
                <h4 className="text-xl font-extrabold text-white mt-1">{off.count}</h4>
                <p className="text-[8px] text-slate-500 mt-0.5">{off.sub}</p>
              </div>
            ))}
          </div>

          <div className="h-10 bg-slate-900 border border-white/5 rounded-xl p-3 flex justify-between items-center text-[10px] text-slate-400">
            <span>Market Acceptance Benchmark for SaaS companies in California: 78.4%</span>
            <span className="text-emerald-400 font-bold">Acme Corp exceeds benchmark by +5.8%</span>
          </div>
        </div>

      </section>

      {/* ─── ACTIVE JOBS WORKSPACE MODULE ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recruiting Pipeline</p>
            <h3 className="text-sm font-extrabold text-white mt-1">Active Positions Dashboard</h3>
          </div>
          <Link href="/employer/job-listings-management" className="text-sky-400 text-xs font-bold hover:underline">
            Go to Command Center
          </Link>
        </div>

        <div className="space-y-3.5">
          {activeJobsList.length === 0 ? (
            <div className="p-10 rounded-[20px] border flex items-center justify-center text-slate-400 text-sm font-semibold" style={{ backgroundColor: T.card, borderColor: T.border }}>
              No active jobs yet.
            </div>
          ) : activeJobsList.map(job => (
            <div 
              key={job.id} 
              className="p-5 rounded-[20px] border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              style={{ backgroundColor: T.card, borderColor: T.border }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-sky-400">
                  <span className="material-symbols-outlined text-[20px]">code</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">{job.title}</h4>
                  <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1">
                    <span>{getJobDept(job)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{job.location}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-sky-400 font-bold">{job.applications} Applicants</span>
                  </div>
                </div>
              </div>

              {/* Status information block */}
              <div className="flex items-center gap-6 text-xs text-right">
                <div className="hidden sm:block">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Hiring Manager</p>
                  <p className="text-slate-300 mt-0.5">{getHiringManager(job)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Hiring Velocity</p>
                  <p className="text-emerald-400 mt-0.5 font-bold">{job.activityLevel}</p>
                </div>
                <button 
                  onClick={() => router.push("/employer/job-listings-management")}
                  className="px-4.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TEAM & RECRUITER PERFORMANCE ─── */}
      <section className="p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recruiting Operations</p>
            <h3 className="text-sm font-extrabold text-white mt-1">Hiring Team Productivity &amp; Metrics</h3>
          </div>
          <span className="text-[10px] text-slate-400">Team Size: 3 active recruiters</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-bold">
                <th className="pb-2.5">Recruiter</th>
                <th className="pb-2.5">Jobs Managed</th>
                <th className="pb-2.5">Reviewed Candidates</th>
                <th className="pb-2.5">Interviews Set</th>
                <th className="pb-2.5">Hires Completed</th>
                <th className="pb-2.5">Avg Response Time</th>
                <th className="pb-2.5 text-right">Activity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No recruiters or team members added yet.</td>
                </tr>
              ) : (
                [
                  { name: "Elena Rostova", jobs: 4, candidates: 112, interviews: 14, hires: 2, response: "2.4 hours", score: "96/100", color: T.green },
                  { name: "Sarah Connor", jobs: 3, candidates: 94, interviews: 8, hires: 1, response: "3.1 hours", score: "91/100", color: T.green },
                  { name: "David O'Connor", jobs: 5, candidates: 78, interviews: 12, hires: 2, response: "4.8 hours", score: "88/100", color: T.yellow }
                ].map((rec, i) => (
                  <tr key={i} className="text-slate-300 hover:bg-slate-900/20">
                    <td className="py-3 font-bold text-white">{rec.name}</td>
                    <td className="py-3">{rec.jobs}</td>
                    <td className="py-3">{rec.candidates}</td>
                    <td className="py-3">{rec.interviews}</td>
                    <td className="py-3 font-semibold text-white">{rec.hires}</td>
                    <td className="py-3">{rec.response}</td>
                    <td className="py-3 text-right font-extrabold" style={{ color: rec.color }}>{rec.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── RECENT ACTIVITY TIMELINE & MARKET INTELLIGENCE ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recruiter Activity Timeline */}
        <div className="lg:col-span-2 p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recruitment Operations Audit Log</p>
          
          <div className="space-y-4">
            {[
              { type: "hire", icon: "stars", title: "Candidate Alex Rivera accepted Lead Solidity Architect offer", time: "12 minutes ago", color: T.green },
              { type: "schedule", icon: "calendar_month", title: "HR Interview scheduled with candidate Sarah Jenkins", time: "1 hour ago", color: T.blue },
              { type: "optimize", icon: "psychology", title: "AI suggestions applied to Marketing Lead job details", time: "3 hours ago", color: T.sky },
              { type: "publish", icon: "publish", title: "New job published: Senior DevOps Engineer", time: "Yesterday", color: T.purple }
            ].map((act, i) => (
              <div key={i} className="flex gap-3.5 text-xs items-start">
                <div className="w-7 h-7 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shrink-0" style={{ color: act.color }}>
                  <span className="material-symbols-outlined text-[15px]">{act.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{act.title}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Market intelligence */}
        <div className="p-5 rounded-[20px] border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <div className="flex items-center gap-1.5 text-yellow border-b border-white/5 pb-2">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">AI Market Intel</span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-1">
              <p className="font-bold text-white">🔥 Software Engineer demand up 8%</p>
              <p className="text-[10px] text-slate-400">Average base compensations in California are moving upward. Adjust budgets accordingly.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">✈ Remote roles lead response volume</p>
              <p className="text-[10px] text-slate-400">Jobs with Hybrid/Remote parameter settings receive 32% more applicants than office-only postings.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">🛡 EVM Rust libraries are trending</p>
              <p className="text-[10px] text-slate-400">Skills criteria alignment search queries are increasingly indexing Rust blockchain profiles.</p>
            </div>
          </div>
        </div>

      </section>

      {/* ─── FOOTER & EXPORT UTILITIES ─── */}
      <footer className="flex flex-col sm:flex-row justify-between items-center p-5 rounded-[20px] bg-slate-900/40 border border-white/5 text-xs gap-4">
        <span className="text-slate-500 font-medium">© 2026 HireGo AI Recruiter Command. All rights reserved.</span>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Export Dashboard Summary:</span>
          <button onClick={() => triggerToast("Generating CSV Report...")} className="px-2.5 py-1 rounded bg-slate-950 border border-white/5 hover:bg-slate-900 text-[10px] font-bold text-slate-300">CSV</button>
          <button onClick={() => triggerToast("Generating Excel Sheet...")} className="px-2.5 py-1 rounded bg-slate-950 border border-white/5 hover:bg-slate-900 text-[10px] font-bold text-slate-300">Excel</button>
          <button onClick={() => triggerToast("Compiling PDF Executive Report...")} className="px-2.5 py-1 rounded bg-slate-950 border border-white/5 hover:bg-slate-900 text-[10px] font-bold text-slate-300">PDF</button>
        </div>
      </footer>

        </PageContainer>
    </div>
  );
}
