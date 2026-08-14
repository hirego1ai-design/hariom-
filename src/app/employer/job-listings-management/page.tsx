"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

// Design Token Colors matching full candidate profile view
const T = {
  pageBg: "#0E0E10",
  card: "#16161B",
  cardAlt: "#242430",
  border: "#333333",
  borderLight: "#262626",
  blue: "#82B1FF",
  blueDark: "#448AFF",
  green: "#4CAF50",
  greenDark: "#2E7D32",
  yellow: "#F57F17",
  red: "#FF5252",
  purple: "#40C4FF",
  purpleDark: "#0068B0",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
};

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  applications: {
    total: number;
    qualified: number;
    interviews: number;
    offers: number;
    hires: number;
  };
  aiMatch: number;
  aiGrade: string;
  aiStars: number;
  funnel: {
    applied: number;
    screened: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
  status: "Active" | "Draft" | "Paused" | "Closed" | "Expired" | "Archived";
  postedDate: string;
  lastApplication: string;
  lastUpdated: string;
  expiryDate: string;
  recruiter: {
    name: string;
    avatar: string;
    progress: number;
  };
  experience: string;
  salaryRange: string;
  description: string;
  skills: string[];
  hiringManager: string;
  avatarSeed: number;
}

export default function EmployerJobListingsPolishedPage() {
  const router = useRouter();

  // Core state variables
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive drawer, expanding rows and tooltip overlays
  const [activeDrawerJob, setActiveDrawerJob] = useState<JobListing | null>(null);
  const [expandedJobRowId, setExpandedJobRowId] = useState<string | null>(null);
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);
  const [optimizedOutput, setOptimizedOutput] = useState<any | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JobListing>>({});
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  
  // Fetch real jobs on mount
  useEffect(() => {
    fetch("/api/employer/jobs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.jobs) {
          // Map DB models to component models if necessary, or just use directly
          // We'll trust they mostly match. If not, map fields.
          setJobs(data.jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || "General",
            location: j.location,
            type: j.type,
            applications: { total: 0, qualified: 0, interviews: 0, offers: 0, hires: 0 },
            aiMatch: 0,
            aiGrade: "N/A",
            aiStars: 0,
            funnel: { applied: 0, screened: 0, shortlisted: 0, interviewed: 0, offered: 0, hired: 0 },
            status: j.status === "ACTIVE" ? "Active" : j.status === "DRAFT" ? "Draft" : j.status === "CLOSED" ? "Closed" : "Active",
            postedDate: j.createdAt || new Date().toISOString(),
            lastApplication: "Never",
            lastUpdated: "Just now",
            expiryDate: "N/A",
            recruiter: { name: "System", avatar: "SY", progress: 0 },
            experience: "1+ Years",
            salaryRange: j.salaryRange || "Not Specified",
            description: j.description || "",
            skills: j.requirements || [],
            hiringManager: "Manager",
            avatarSeed: 1
          })));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Enterprise editing workflow states
  const [activeDraftTab, setActiveDraftTab] = useState<Record<string, "edit" | "review" | "timeline" | "preview">>({});
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [draftVersions, setDraftVersions] = useState<Record<string, string>>({
    "HGO-2941": "v1.3",
    "HGO-2938": "v1.1",
    "HGO-2935": "v1.1",
    "HGO-2930": "v1.1",
    "HGO-2928": "v1.3",
    "HGO-2925": "v1.1"
  });
  const [jobVersions, setJobVersions] = useState<Record<string, { version: string; change: string; date: string; status: string }[]>>({
    "HGO-2941": [
      { version: "v1.0", change: "Position created & published", date: "2026-06-15", status: "Published" },
      { version: "v1.1", change: "Updated remote work mode parameters", date: "2026-07-10", status: "Approved" },
      { version: "v1.2", change: "Optimized title keyword density", date: "2026-08-01", status: "Approved" }
    ],
    "HGO-2938": [
      { version: "v1.0", change: "Created & published", date: "2026-06-20", status: "Published" }
    ],
    "HGO-2935": [
      { version: "v1.0", change: "Created & published", date: "2026-05-10", status: "Published" }
    ],
    "HGO-2930": [
      { version: "v1.0", change: "Created & published", date: "2026-06-22", status: "Published" }
    ],
    "HGO-2928": [
      { version: "v1.0", change: "Created & published", date: "2026-04-01", status: "Published" },
      { version: "v1.1", change: "Added database query details", date: "2026-05-02", status: "Approved" },
      { version: "v1.2", change: "Corrected base manager credentials", date: "2026-06-12", status: "Approved" }
    ],
    "HGO-2925": [
      { version: "v1.0", change: "Created draft template", date: "2026-06-30", status: "Draft" }
    ]
  });
  
  // Custom tooltips and hovered previews
  const [hoveredJobPreview, setHoveredJobPreview] = useState<JobListing | null>(null);
  const [hoveredPreviewPos, setHoveredPreviewPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTooltipContent, setActiveTooltipContent] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Recent searches simulation
  const [recentSearches, setRecentSearches] = useState<string[]>(["AI Engineer", "Remote", "Engineering"]);
  const [savedFilters, setSavedFilters] = useState<string[]>(["Engineering Only", "Active Hybrid Roles"]);

  // Track applied filter count
  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "All") count++;
    if (departmentFilter !== "All") count++;
    if (locationFilter !== "All") count++;
    if (typeFilter !== "All") count++;
    if (experienceFilter !== "All") count++;
    return count;
  }, [searchQuery, statusFilter, departmentFilter, locationFilter, typeFilter, experienceFilter]);

  // Stats computation
  const stats = useMemo(() => {
    const active = jobs.filter(j => j.status === "Active").length;
    const totalApps = jobs.reduce((sum, j) => sum + j.applications.total, 0);
    const newApps = 14; 
    const interviews = 8; 
    const hires = jobs.reduce((sum, j) => sum + j.applications.hires, 0);
    return {
      activeJobs: active,
      totalApplications: totalApps,
      newApplications: newApps,
      interviewsToday: interviews,
      totalHires: hires,
    };
  }, [jobs]);

  // Unique departments & locations for filter dropdowns
  const departments = useMemo(() => ["All", ...Array.from(new Set(jobs.map(j => j.department)))], [jobs]);
  const locations = useMemo(() => {
    const list = Array.from(new Set(jobs.map(j => j.location.split(" (")[0])));
    return ["All", ...list];
  }, [jobs]);

  // Handle keypress / search persistence
  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    if (val && !recentSearches.includes(val)) {
      setRecentSearches(prev => [val, ...prev.slice(0, 2)]);
    }
  };

  // Filtered and sorted jobs list
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" ? true : job.status === statusFilter;
        const matchesDept = departmentFilter === "All" ? true : job.department === departmentFilter;
        const matchesLoc = locationFilter === "All" ? true : job.location.includes(locationFilter);
        const matchesType = typeFilter === "All" ? true : job.type === typeFilter;
        const matchesExp = experienceFilter === "All" ? true : job.experience.includes(experienceFilter);
        return matchesSearch && matchesStatus && matchesDept && matchesLoc && matchesType && matchesExp;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.postedDate.localeCompare(a.postedDate);
        if (sortBy === "oldest") return a.postedDate.localeCompare(b.postedDate);
        if (sortBy === "applications") return b.applications.total - a.applications.total;
        if (sortBy === "match") return b.aiMatch - a.aiMatch;
        return 0;
      });
  }, [jobs, searchQuery, statusFilter, departmentFilter, locationFilter, typeFilter, experienceFilter, sortBy]);

  // AI Optimizer Simulation
  const runAIOptimizer = (job: JobListing) => {
    setIsOptimizing(true);
    setTimeout(() => {
      setOptimizedOutput({
        originalTitle: job.title,
        recommendedTitle: `Lead ${job.title} - Large Scale Systems`,
        recommendedSkills: ["Rust / Go", "Deep Learning Architectures", "PyTorch / JAX", "LLM Fine-tuning Pipelines", "Kubernetes"],
        descriptionScoreChange: "+18% Applicant Quality Score",
        recommendations: [
          { type: "Salary Range", text: "Add competitive scale of $190,000 - $235,000 to increase application rate by 24%." },
          { type: "Experience Guardrail", text: "Lower minimum experience requirement to 4+ Years. Estimate +35% qualified candidates pool expansion." },
          { type: "Remote Policy", text: "Enable fully remote applications to scale applicant pool capacity by +41%." }
        ]
      });
      setIsOptimizing(false);
      setIsOptimizeOpen(true);
    }, 1200);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setLocationFilter("All");
    setTypeFilter("All");
    setExperienceFilter("All");
    setSortBy("newest");
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedJobIds(filteredJobs.map(j => j.id));
    } else {
      setSelectedJobIds([]);
    }
  };

  const handleSelectJob = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedJobIds(prev => [...prev, id]);
    } else {
      setSelectedJobIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk actions handlers
  const handleBulkStatusChange = (status: JobListing["status"]) => {
    setJobs(prev => prev.map(j => selectedJobIds.includes(j.id) ? { ...j, status } : j));
    setSelectedJobIds([]);
  };

  const handleBulkDelete = () => {
    setJobs(prev => prev.filter(j => !selectedJobIds.includes(j.id)));
    setSelectedJobIds([]);
  };

  const handleTriggerStatus = (id: string, newStatus: JobListing["status"]) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
    if (activeDrawerJob?.id === id) {
      setActiveDrawerJob(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleDeleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    if (activeDrawerJob?.id === id) {
      setActiveDrawerJob(null);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 p-gutter max-w-container-max mx-auto space-y-9 relative pb-12" style={{ backgroundColor: T.pageBg }}>
      
      {/* ─── HEADER ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Job Listings</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1" style={{ fontFamily: "var(--font-body)" }}>
            Manage, monitor and optimize all your hiring positions from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => router.push("/employer/create-job-basic-info")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform text-white shadow-lg"
            style={{ background: T.red }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Post New Job
          </button>
          <button className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 border" style={{ background: T.cardAlt, borderColor: T.border }}>
            <span className="material-symbols-outlined text-sm">publish</span> Import Jobs
          </button>
          <button className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 border" style={{ background: T.cardAlt, borderColor: T.border }}>
            <span className="material-symbols-outlined text-sm">download</span> Export
          </button>
          <button onClick={() => {
            setIsLoading(true);
            fetch("/api/employer/jobs")
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.jobs) {
                  setJobs(data.jobs.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    department: j.department || "General",
                    location: j.location,
                    type: j.type,
                    applications: { total: 0, qualified: 0, interviews: 0, offers: 0, hires: 0 },
                    aiMatch: 0,
                    aiGrade: "N/A",
                    aiStars: 0,
                    funnel: { applied: 0, screened: 0, shortlisted: 0, interviewed: 0, offered: 0, hired: 0 },
                    status: j.status === "ACTIVE" ? "Active" : j.status === "DRAFT" ? "Draft" : j.status === "CLOSED" ? "Closed" : "Active",
                    postedDate: j.createdAt || new Date().toISOString(),
                    lastApplication: "Never",
                    lastUpdated: "Just now",
                    expiryDate: "N/A",
                    recruiter: { name: "System", avatar: "SY", progress: 0 },
                    experience: "1+ Years",
                    salaryRange: j.salaryRange || "Not Specified",
                    description: j.description || "",
                    skills: j.requirements || [],
                    hiringManager: "Manager",
                    avatarSeed: 1
                  })));
                }
              })
              .catch((err) => console.error(err))
              .finally(() => setIsLoading(false));
          }} className="p-2 rounded-xl hover:bg-slate-800 border flex items-center justify-center" style={{ background: T.cardAlt, borderColor: T.border }} title="Refresh Listings">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </header>

      {/* ─── LEVEL 1: KPI CARDS WITH SPARKLINE METRICS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div 
          className="p-5 rounded-[20px] border flex flex-col gap-3 transition-transform hover:-translate-y-0.5 shadow-md relative group cursor-pointer" 
          style={{ background: T.card, borderColor: T.border }}
        >
          <div className="flex justify-between items-start text-slate-400">
            <p className="text-[10px] font-bold uppercase tracking-widest">Open Jobs</p>
            <span className="material-symbols-outlined text-sm text-sky-400">work</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>{stats.activeJobs}</p>
            <span className="text-xs font-bold text-emerald-400">+1 Today</span>
          </div>
          {/* Sparkline & Compare */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Weekly Trend</span>
            <svg className="w-16 h-5 stroke-sky-400 fill-none stroke-[2]" viewBox="0 0 100 25">
              <path d="M0,20 Q15,5 30,18 T60,5 T90,20" />
            </svg>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          className="p-5 rounded-[20px] border flex flex-col gap-3 transition-transform hover:-translate-y-0.5 shadow-md relative group cursor-pointer" 
          style={{ background: T.card, borderColor: T.border }}
        >
          <div className="flex justify-between items-start text-slate-400">
            <p className="text-[10px] font-bold uppercase tracking-widest">Applications</p>
            <span className="material-symbols-outlined text-sm text-sky-400">people</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>1,046</p>
            <span className="text-xs font-bold text-emerald-400">+12.5%</span>
          </div>
          {/* Sparkline & Compare */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">+14 Today</span>
            <svg className="w-16 h-5 stroke-emerald-400 fill-none stroke-[2]" viewBox="0 0 100 25">
              <path d="M0,22 L20,18 L40,15 L60,10 L80,8 L100,2" />
            </svg>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          className="p-5 rounded-[20px] border flex flex-col gap-3 transition-transform hover:-translate-y-0.5 shadow-md relative group cursor-pointer" 
          style={{ background: T.card, borderColor: T.border }}
        >
          <div className="flex justify-between items-start text-slate-400">
            <p className="text-[10px] font-bold uppercase tracking-widest">Interviews Today</p>
            <span className="material-symbols-outlined text-sm text-sky-400">calendar_today</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>{stats.interviewsToday}</p>
            <span className="text-[11px] font-bold text-slate-400">Upcoming: 24</span>
          </div>
          {/* Sparkline & Compare */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Rate: 94.2%</span>
            <svg className="w-16 h-5 stroke-purple fill-none stroke-[2]" viewBox="0 0 100 25">
              <path d="M0,15 L25,12 L50,18 L75,5 L100,8" />
            </svg>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          className="p-5 rounded-[20px] border flex flex-col gap-3 transition-transform hover:-translate-y-0.5 shadow-md relative group cursor-pointer" 
          style={{ background: T.card, borderColor: T.border }}
        >
          <div className="flex justify-between items-start text-slate-400">
            <p className="text-[10px] font-bold uppercase tracking-widest">Successful Hires</p>
            <span className="material-symbols-outlined text-sm text-sky-400">verified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>{stats.totalHires}</p>
            <span className="text-xs font-bold text-emerald-400">+2 This Mo.</span>
          </div>
          {/* Sparkline & Compare */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Success: 87%</span>
            <svg className="w-16 h-5 stroke-yellow fill-none stroke-[2]" viewBox="0 0 100 25">
              <path d="M0,20 L30,12 L60,10 L100,4" />
            </svg>
          </div>
        </div>
      </section>

      {/* ─── LEVEL 2: AI HIRING HEALTH + RECOMMENDATIONS SIDE-BY-SIDE ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Widget: Health Score */}
        <div className="lg:col-span-2 p-5 rounded-[20px] border bg-gradient-to-br from-slate-900 to-black flex flex-col justify-between gap-5" style={{ borderColor: T.border }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400">psychology</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display" style={{ fontFamily: "var(--font-display)" }}>AI Hiring Health Index</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Your hiring processes perform better than <span className="text-sky-400 font-bold">87% of companies</span> in your industry. Candidate conversion metrics, AI matching alignments, and pipeline processing speeds are optimal.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Hiring Health Score</span>
              <span className="text-sky-400 font-display">92 / 100</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
              <div className="h-full rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" style={{ width: "92%" }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>+3.2% Weekly Improvement</span>
              <span>Top 5% Benchmark</span>
            </div>
          </div>
        </div>

        {/* Right Widget: Today's AI Recommendations Summary */}
        <div className="p-5 rounded-[20px] border flex flex-col justify-between bg-surface-container gap-4" style={{ borderColor: T.border }}>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Today's AI Recommendations</p>
            <ul className="space-y-2.5 text-xs">
              <li onClick={() => setStatusFilter("Active")} className="cursor-pointer flex items-center gap-2 text-slate-200 hover:text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                <span>2 Jobs need optimization suggestions</span>
              </li>
              <li onClick={() => setStatusFilter("Paused")} className="cursor-pointer flex items-center gap-2 text-slate-200 hover:text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow flex-shrink-0" />
                <span>1 Job expires tomorrow (Marketing Lead)</span>
              </li>
              <li onClick={() => setSortBy("match")} className="cursor-pointer flex items-center gap-2 text-slate-200 hover:text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>18 High Match Candidates waiting review</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-purple flex-shrink-0" />
                <span>Average Hiring Health improved 3%</span>
              </li>
            </ul>
          </div>
          <div className="text-[9px] text-slate-500 font-bold uppercase pt-2 border-t border-white/5">
            Click recommendations to filter
          </div>
        </div>
      </section>

      {/* ─── LEVEL 2B: TODAY'S PRIORITIES AI PANEL ─── */}
      <section className="p-4 rounded-[16px] border bg-slate-900/60" style={{ borderColor: T.border }}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Today's Priorities (Hiring Assistant)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold text-slate-300">
          <div className="p-3 rounded-xl border bg-slate-950 border-white/5 hover:border-sky-400 transition-colors cursor-pointer flex items-start gap-2">
            <span className="material-symbols-outlined text-sky-400 text-sm mt-0.5">notification_important</span>
            <div>
              <p className="text-white">Senior AI Engineer</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Received 23 new qualified applicants matching criteria.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-slate-950 border-white/5 hover:border-yellow transition-colors cursor-pointer flex items-start gap-2">
            <span className="material-symbols-outlined text-yellow text-sm mt-0.5">schedule</span>
            <div>
              <p className="text-white">Marketing Lead (EMEA)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Expires in 2 days. AI recommends extending or closing.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-slate-950 border-white/5 hover:border-purple transition-colors cursor-pointer flex items-start gap-2">
            <span className="material-symbols-outlined text-purple text-sm mt-0.5">psychology</span>
            <div>
              <p className="text-white">Blockchain Architect</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Should be AI Optimized to balance missing EVM skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LEVEL 3: SEARCH, FILTER, AND TABS STICKY CONTAINER ─── */}
      <div className="sticky top-0 z-40 bg-[#0E0E10] pt-2 pb-2 space-y-4">
        
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center border rounded-xl" style={{ borderColor: T.border, background: T.card }}>
            <span className="material-symbols-outlined text-4xl mb-2 text-slate-500">work_off</span>
            <h3 className="text-lg font-bold text-white">No job listings created</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">You haven't posted any jobs yet. Create one to get started.</p>
            <button 
              onClick={() => router.push("/employer/create-job-basic-info")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5252] text-white shadow-lg mx-auto"
            >
              Post New Job
            </button>
          </div>
        ) : (
          <>
        {/* Sticky tabs filter row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-2">
          <div className="flex gap-2.5 overflow-x-auto">
            {["All", "Active", "Draft", "Paused", "Closed", "Expired", "Archived"].map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button 
                  key={tab} 
                  onClick={() => setStatusFilter(tab)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 relative"
                  style={{
                    background: isActive ? T.cardAlt : "transparent",
                    color: isActive ? T.blue : T.textMuted,
                    border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
                  }}
                >
                  {tab}
                  {tab === "Active" && <span className="ml-1.5 w-1.5 h-1.5 rounded-full inline-block bg-emerald-400 shadow-sm" />}
                </button>
              );
            })}
          </div>

          {/* Quick info widgets line */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Velocity: <span className="text-emerald-400">High</span></span>
            <span>Avg Match: <span className="text-sky-400">88%</span></span>
            <span>Expiring: <span className="text-yellow">1 Job</span></span>
          </div>
        </div>

        {/* Sticky search/filters toolbar */}
        <section className="p-4 rounded-[16px] border bg-surface-container space-y-3.5 shadow-xl" style={{ borderColor: T.border }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-base">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] pl-9 pr-4 rounded-xl bg-slate-950 border border-white/10 focus:border-sky-400 transition-colors text-xs text-white placeholder:text-slate-400 outline-none" 
                placeholder="Search jobs, departments..." 
                type="text" 
              />
            </div>

            {/* Department */}
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-[38px] px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== "All").map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Location */}
            <select 
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-[38px] px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="All">All Locations</option>
              {locations.filter(l => l !== "All").map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Type */}
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-[38px] px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
            </select>

            {/* Experience */}
            <select 
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="h-[38px] px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="All">All Experience</option>
              <option value="3+">3+ Years</option>
              <option value="5+">5+ Years</option>
              <option value="8+">8+ Years</option>
            </select>

          </div>

          {/* Row actions & counters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
            <div className="flex flex-wrap items-center gap-3.5">
              
              {/* Filter Counter */}
              <span className="font-bold text-slate-300">
                Filters {appliedFiltersCount > 0 ? `(${appliedFiltersCount} Applied)` : ""}
              </span>

              {/* Saved Filters Dropdown */}
              <select 
                onChange={(e) => {
                  if (e.target.value === "Engineering Only") {
                    setDepartmentFilter("Engineering");
                  } else if (e.target.value === "Active Hybrid Roles") {
                    setStatusFilter("Active");
                    setLocationFilter("Hybrid");
                  }
                }}
                className="h-8 px-2 rounded-lg bg-slate-950 border border-white/10 text-[11px] text-slate-400 outline-none cursor-pointer"
              >
                <option value="">Saved Filters</option>
                {savedFilters.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              {/* Recent Searches */}
              <select 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 px-2 rounded-lg bg-slate-950 border border-white/10 text-[11px] text-slate-400 outline-none cursor-pointer"
              >
                <option value="">Recent Searches</option>
                {recentSearches.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {appliedFiltersCount > 0 && (
                <button onClick={handleResetFilters} className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span> Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk actions */}
              {selectedJobIds.length > 0 && (
                <div className="flex items-center gap-1.5 animate-in fade-in bg-slate-900 px-3 py-1 rounded-xl border border-white/5">
                  <span className="text-[11px] text-slate-300 font-bold mr-1.5">{selectedJobIds.length} Selected</span>
                  <button onClick={() => handleBulkStatusChange("Active")} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-emerald-400">Activate</button>
                  <button onClick={() => handleBulkStatusChange("Paused")} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-yellow">Pause</button>
                  <button onClick={handleBulkDelete} className="px-2 py-0.5 rounded bg-red-500/20 text-[10px] font-bold text-red">Delete</button>
                </div>
              )}
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-2 rounded-lg bg-slate-950 border border-white/10 text-[11px] text-white outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="applications">Sort: Apps Count</option>
                <option value="match">Sort: AI Match %</option>
              </select>
            </div>
          </div>
        </section>
          </>
        )}
      </div>

      {/* ─── LEVEL 4: POLISHED JOB TABLE ─── */}
      <section className="rounded-[20px] border shadow-xl bg-surface-container overflow-hidden" style={{ borderColor: T.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 font-bold text-slate-400 bg-white/[0.01]">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0} 
                    className="rounded accent-sky-400 cursor-pointer" 
                  />
                </th>
                <th className="p-4">Job Details</th>
                <th className="p-4">Department &amp; Location</th>
                <th className="p-4">Application Metrics</th>
                <th className="p-4">AI Score</th>
                <th className="p-4">Pipeline Funnel</th>
                <th className="p-4">Candidate preview</th>
                <th className="p-4">Status</th>
                <th className="p-4">Timeline</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredJobs.length === 0 ? (
                /* Empty state */
                <tr>
                  <td colSpan={10} className="p-12 text-center space-y-4">
                    <span className="material-symbols-outlined text-4xl text-slate-500">work_off</span>
                    <p className="text-sm font-bold text-slate-300">No Jobs Posted Yet</p>
                    <p className="text-xs text-slate-400">Start hiring by creating your first AI-powered job posting.</p>
                    <button 
                      onClick={() => router.push("/employer/create-job-basic-info")}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white mt-2 inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Create Job
                    </button>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const isChecked = selectedJobIds.includes(job.id);
                  const isExpanded = expandedJobRowId === job.id;

                  return (
                    <React.Fragment key={job.id}>
                      <tr 
                        onClick={() => setExpandedJobRowId(isExpanded ? null : job.id)}
                        className={`hover:bg-white/[0.02] cursor-pointer transition-colors duration-150 border-l-2 ${isExpanded ? "bg-white/[0.01]" : "border-l-transparent"}`}
                        style={{ borderLeftColor: isExpanded ? T.blue : "transparent" }}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                            className="rounded accent-sky-400 cursor-pointer" 
                          />
                        </td>

                        {/* Title with Hover Details trigger */}
                        <td className="p-4 max-w-[200px]">
                          <div 
                            className="font-bold text-white text-sm hover:text-sky-400 transition-colors"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredJobPreview(job);
                              setHoveredPreviewPos({ x: rect.left, y: rect.bottom + window.scrollY });
                            }}
                            onMouseLeave={() => setHoveredJobPreview(null)}
                          >
                            {job.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{job.id} · {job.type}</div>
                        </td>

                        {/* Department & Location */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{job.department}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{job.location}</div>
                        </td>

                        {/* Applications Metrics */}
                        <td className="p-4">
                          <div 
                            className="font-extrabold text-white hover:underline cursor-help"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveTooltipContent(`Applications Breakdown:\n- Total: ${job.applications.total}\n- Screened: ${job.applications.qualified} Qualified\n- Interviews: ${job.applications.interviews}\n- Offers: ${job.applications.offers}`);
                              setTooltipPos({ x: rect.left, y: rect.top + window.scrollY - 100 });
                            }}
                            onMouseLeave={() => setActiveTooltipContent(null)}
                          >
                            {job.applications.total} Apps
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{job.applications.qualified} AI Screened</div>
                        </td>

                        {/* AI Match rating */}
                        <td className="p-4">
                          {job.aiMatch > 0 ? (
                            <div 
                              className="inline-flex flex-col cursor-help hover:opacity-85 transition-opacity"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltipContent(`AI Match Breakdown:\n- Skills Match: 95%\n- Experience Match: 90%\n- Location Match: 98%\n- Salary Match: 88%`);
                                setTooltipPos({ x: rect.left, y: rect.top + window.scrollY - 110 });
                              }}
                              onMouseLeave={() => setActiveTooltipContent(null)}
                            >
                              <div className="flex items-center gap-1 font-extrabold text-white">
                                <span>{job.aiMatch}%</span>
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">{job.aiGrade}</span>
                              </div>
                              <span className="text-[9px] text-yellow font-bold mt-0.5">
                                {"★".repeat(job.aiStars)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No Data</span>
                          )}
                        </td>

                        {/* Funnel progression simplified */}
                        <td className="p-4">
                          <div 
                            className="flex items-center gap-1 cursor-help"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveTooltipContent(`Pipeline conversion details:\nScreening: ${job.funnel.screened}\nShortlisted: ${job.funnel.shortlisted}\nInterview: ${job.funnel.interviewed}\nOffer: ${job.funnel.offered}\nHires: ${job.funnel.hired}`);
                              setTooltipPos({ x: rect.left, y: rect.top + window.scrollY - 120 });
                            }}
                            onMouseLeave={() => setActiveTooltipContent(null)}
                          >
                            <span className="text-[10px] text-slate-200 font-bold">{job.funnel.applied}</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-[10px] text-sky-400 font-bold">{job.funnel.screened}</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-[10px] text-emerald-400 font-bold">{job.funnel.hired}</span>
                          </div>
                        </td>

                        {/* Candidate preview avatar stack */}
                        <td className="p-4">
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {[1, 2, 3].map((num) => (
                              <div 
                                key={num} 
                                className="w-5 h-5 rounded-full border border-slate-900 bg-slate-800 text-[8px] font-bold flex items-center justify-center text-white flex-shrink-0"
                              >
                                {String.fromCharCode(65 + num + job.avatarSeed)}
                              </div>
                            ))}
                            <div className="text-[9px] text-slate-400 font-bold pl-1.5">+{job.applications.total - 3}</div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              backgroundColor: 
                                job.status === "Active" ? `${T.green}1A` :
                                job.status === "Paused" ? `${T.yellow}1A` :
                                job.status === "Draft" ? `${T.blue}1A` : `${T.red}1A`,
                              color: 
                                job.status === "Active" ? T.green :
                                job.status === "Paused" ? T.yellow :
                                job.status === "Draft" ? T.blue : T.red,
                              borderColor: 
                                job.status === "Active" ? `${T.green}40` :
                                job.status === "Paused" ? `${T.yellow}40` :
                                job.status === "Draft" ? `${T.blue}40` : `${T.red}40`,
                            }}
                          >
                            {job.status}
                          </span>
                        </td>

                        {/* Timeline activity lifecycle */}
                        <td className="p-4 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[12px] text-slate-500">calendar_today</span>
                            <span>Posted {job.postedDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-[12px] text-slate-500">person</span>
                            <span>App {job.lastApplication}</span>
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => router.push(`/employer/edit-job-post?id=${job.id}`)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Edit Job"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button 
                              onClick={() => router.push(`/employer/job-boost-promote?id=${job.id}`)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Boost/Promote Job"
                            >
                              <span className="material-symbols-outlined text-base">rocket_launch</span>
                            </button>
                            <button 
                              onClick={() => router.push(`/employer/job-performance-analytics?id=${job.id}`)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Job Analytics"
                            >
                              <span className="material-symbols-outlined text-base">bar_chart</span>
                            </button>
                            <button 
                              onClick={() => { setActiveDrawerJob(job); }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="View Analytics Drawer"
                            >
                              <span className="material-symbols-outlined text-base">analytics</span>
                            </button>
                            <button 
                              onClick={() => runAIOptimizer(job)}
                              className="p-1 rounded hover:bg-sky-500/10 text-sky-400"
                              title="AI Optimize Job"
                            >
                              <span className="material-symbols-outlined text-base">psychology</span>
                            </button>
                            <button 
                              onClick={() => handleTriggerStatus(job.id, job.status === "Active" ? "Paused" : "Active")}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400"
                              title={job.status === "Active" ? "Pause" : "Activate"}
                            >
                              <span className="material-symbols-outlined text-base">
                                {job.status === "Active" ? "pause" : "play_arrow"}
                              </span>
                            </button>
                            <button 
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-red"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ─── ROW EXPANSION: INLINE ROW DRAWER ─── */}
                      {isExpanded && (
                        <tr className="bg-slate-900/40">
                          <td colSpan={10} className="p-5 border-b border-white/5">
                            {editingJobId === job.id ? (
                              /* ─── ENTERPRISE EDIT JOB WORKSPACE ─── */
                              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                
                                {/* Workspace Header */}
                                <div className="p-4 rounded-xl border bg-slate-950 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Hiring Command Workspace</span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                      <span className="text-[10px] text-slate-400">Live: v1.2</span>
                                      <span className="text-[10px] text-yellow font-bold bg-yellow/10 px-1.5 py-0.2 rounded border border-yellow/30">Draft: {draftVersions[job.id] || "v1.3"}</span>
                                    </div>
                                    <h4 className="text-sm font-extrabold text-white mt-1">Editing Draft Version for: {job.title}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px] text-yellow">warning</span>
                                      Changes will not affect the live job until submitted and approved.
                                    </p>
                                  </div>

                                  {/* Workspace Tabs */}
                                  <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 text-[10px] font-bold">
                                    {[
                                      { id: "edit", label: "Edit Workspace" },
                                      { id: "review", label: "Review Diff" },
                                      { id: "timeline", label: "Version & Timeline" },
                                      { id: "preview", label: "Candidate Preview" }
                                    ].map((tab) => {
                                      const isTabActive = (activeDraftTab[job.id] || "edit") === tab.id;
                                      return (
                                        <button 
                                          key={tab.id}
                                          onClick={() => setActiveDraftTab(prev => ({ ...prev, [job.id]: tab.id as any }))}
                                          className={`px-3 py-1.5 rounded-lg transition-all ${isTabActive ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-white"}`}
                                        >
                                          {tab.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Active Tab Contents */}
                                {(activeDraftTab[job.id] || "edit") === "edit" && (
                                  /* TAB 1: EDIT FORM + AI RECOMMENDATIONS */
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    <div className="lg:col-span-2 space-y-3.5">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Draft Form Fields</span>
                                        <span className="text-emerald-400 flex items-center gap-1">
                                          <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                                          Draft Auto-Saved (12:40 PM)
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Job Title</label>
                                          <input 
                                            type="text" 
                                            value={editForm.title || ""} 
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Hiring Manager</label>
                                          <input 
                                            type="text" 
                                            value={editForm.hiringManager || ""} 
                                            onChange={(e) => setEditForm({ ...editForm, hiringManager: e.target.value })}
                                            className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                                          <input 
                                            type="text" 
                                            value={editForm.department || ""} 
                                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                            className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                                          <input 
                                            type="text" 
                                            value={editForm.location || ""} 
                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                            className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Salary Range Target</label>
                                          <input 
                                            type="text" 
                                            value={editForm.salaryRange || ""} 
                                            onChange={(e) => setEditForm({ ...editForm, salaryRange: e.target.value })}
                                            className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Experience Requirement</label>
                                          <input 
                                            type="text" 
                                            value={editForm.experience || ""} 
                                            onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                                            className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Job Description Outline</label>
                                        <textarea 
                                          value={editForm.description || ""} 
                                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                          rows={4}
                                          className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white mt-1 outline-none focus:border-sky-400 resize-none leading-relaxed"
                                        />
                                      </div>
                                    </div>

                                    {/* Right AI Suggestions Sidebar */}
                                    <div className="p-4 rounded-xl border bg-slate-950 border-white/5 space-y-4">
                                      <div className="flex items-center gap-1.5 text-sky-400 border-b border-white/5 pb-2">
                                        <span className="material-symbols-outlined text-sm">psychology</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">AI Content Optimizations</span>
                                      </div>

                                      {/* Suggestion 1: Title */}
                                      <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-white/5">
                                        <div className="flex justify-between items-start">
                                          <span className="text-[9px] font-bold text-sky-400 uppercase">Title Suggestion</span>
                                          <span className="text-[8px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 rounded">High Match</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300">Change "{job.title}" to <span className="text-white font-bold">"Senior Staff AI Engineer (Rust/CUDA)"</span></p>
                                        <p className="text-[9px] text-slate-500 leading-normal">Reason: Uses search keywords with 40% higher organic candidate query volume.</p>
                                        <button 
                                          onClick={() => setEditForm(prev => ({ ...prev, title: "Senior Staff AI Engineer (Rust/CUDA)" }))}
                                          className="px-2 py-1 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[9px] uppercase tracking-wider"
                                        >
                                          Apply Suggestion
                                        </button>
                                      </div>

                                      {/* Suggestion 2: Salary benchmark */}
                                      <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-white/5">
                                        <div className="flex justify-between items-start">
                                          <span className="text-[9px] font-bold text-yellow uppercase font-display">Salary Benchmark</span>
                                          <span className="text-[8px] font-bold text-slate-400">Medium</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300">Set Range to <span className="text-white font-bold">"$190,000 - $235,000"</span> to match regional standard.</p>
                                        <p className="text-[9px] text-slate-500 leading-normal">Benefit: Expected +24% qualified candidate conversion matching current expectations.</p>
                                        <button 
                                          onClick={() => setEditForm(prev => ({ ...prev, salaryRange: "$190,000 - $235,000" }))}
                                          className="px-2 py-1 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[9px] uppercase tracking-wider"
                                        >
                                          Apply Suggestion
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/********************* TAB 2: REVIEW DIFF *********************/}
                                {(activeDraftTab[job.id] || "edit") === "review" && (
                                  <div className="space-y-5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Side-by-Side Version Comparison (v1.2 Live → Draft v1.3)</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Live Version Column */}
                                      <div className="p-4 rounded-xl border bg-slate-950 border-white/5 space-y-3.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Live Version (v1.2)</p>
                                        
                                        <div className="space-y-2 text-xs">
                                          <div>
                                            <span className="text-slate-500">Job Title:</span>
                                            <p className="text-white font-semibold">{job.title}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Salary Target:</span>
                                            <p className="text-white font-semibold">{job.salaryRange}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Location:</span>
                                            <p className="text-white font-semibold">{job.location}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Hiring Manager:</span>
                                            <p className="text-white font-semibold">{job.hiringManager}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Description:</span>
                                            <p className="text-slate-300 leading-relaxed truncate">{job.description}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Draft Changes Column */}
                                      <div className="p-4 rounded-xl border bg-slate-950 border-white/5 space-y-3.5" style={{ borderColor: `${T.blue}40` }}>
                                        <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Editing Draft Changes (v1.3)</p>
                                        
                                        <div className="space-y-2 text-xs">
                                          <div>
                                            <span className="text-slate-500">Job Title:</span>
                                            <p className="text-emerald-400 font-bold">{editForm.title || job.title}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Salary Target:</span>
                                            <p className="text-emerald-400 font-bold">{editForm.salaryRange || job.salaryRange}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Location:</span>
                                            <p className="text-emerald-400 font-bold">{editForm.location || job.location}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Hiring Manager:</span>
                                            <p className="text-emerald-400 font-bold">{editForm.hiringManager || job.hiringManager}</p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Description:</span>
                                            <p className="text-emerald-400 leading-relaxed font-semibold truncate">{editForm.description || job.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* AI Change Impact Analysis */}
                                    <div className="p-4 rounded-xl border bg-slate-950 border-white/5 space-y-3">
                                      <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">AI Change Impact &amp; Reach Projections</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="p-3 rounded bg-slate-900 border border-white/5">
                                          <p className="text-slate-400 text-[10px]">Expected Candidate Reach</p>
                                          <p className="text-white font-extrabold mt-0.5 text-sm">+28% Views Projection</p>
                                          <p className="text-[9px] text-emerald-400 font-bold uppercase mt-1">Medium Confidence</p>
                                        </div>
                                        <div className="p-3 rounded bg-slate-900 border border-white/5">
                                          <p className="text-slate-400 text-[10px]">EVM Skill Alignment Match</p>
                                          <p className="text-white font-extrabold mt-0.5 text-sm">+18% Quality Level</p>
                                          <p className="text-[9px] text-sky-400 font-bold uppercase mt-1">High Confidence</p>
                                        </div>
                                        <div className="p-3 rounded bg-slate-900 border border-white/5">
                                          <p className="text-slate-400 text-[10px]">Estimated Approval Route</p>
                                          <p className="text-white font-extrabold mt-0.5 text-sm">Requires Admin Review</p>
                                          <p className="text-[9px] text-yellow font-bold uppercase mt-1">Salary Changes Flagged</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Submit action block */}
                                    <div className="flex gap-2 justify-end border-t border-white/5 pt-4">
                                      <button 
                                        onClick={() => setEditingJobId(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                                      >
                                        Discard Changes
                                      </button>
                                      <button 
                                        onClick={() => {
                                          // Check if major fields are edited (e.g. salary, title, location) to decide if admin review is triggered
                                          const requiresReview = editForm.title !== job.title || editForm.salaryRange !== job.salaryRange || editForm.location !== job.location;
                                          if (requiresReview) {
                                            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "Paused" } : j)); // Simulate pending review in table
                                            triggerToast("Changes Submitted! Estimated Admin Review Time: 15 minutes.");
                                          } else {
                                            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...editForm, status: "Active" } as JobListing : j));
                                            triggerToast("Minor updates auto-approved! Job v1.3 is now live.");
                                          }
                                          setEditingJobId(null);
                                        }}
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg"
                                      >
                                        Submit Changes For Review
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/********************* TAB 3: TIMELINE & HISTORY *********************/}
                                {(activeDraftTab[job.id] || "edit") === "timeline" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Approval Timeline tracking */}
                                    <div className="p-4 rounded-xl border bg-slate-950 border-white/5 space-y-4">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Timeline (v1.3)</p>
                                      
                                      <div className="space-y-4">
                                        {[
                                          { stage: "Draft Version Created", active: true, done: true, desc: "Draft v1.3 initialized on edit click" },
                                          { stage: "AI Smart Validation Check", active: true, done: true, desc: "Grammar, spelling & compliance verified" },
                                          { stage: "Pending Internal Sign-off", active: true, done: false, desc: "Hiring Manager approval awaited" },
                                          { stage: "Admin Review Submission", active: false, done: false, desc: "Required for core salary adjustments" },
                                          { stage: "Release & Publish Live", active: false, done: false, desc: "v1.3 becomes the live job version" }
                                        ].map((t, idx) => (
                                          <div key={idx} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${t.done ? "bg-emerald-400 text-slate-950" : t.active ? "bg-sky-500 text-white animate-pulse" : "bg-slate-800 text-slate-500"}`}>
                                                {t.done ? "✓" : idx + 1}
                                              </span>
                                              {idx < 4 && <div className="w-0.5 h-10 bg-slate-800" />}
                                            </div>
                                            <div>
                                              <p className={`text-xs font-bold ${t.active ? "text-white" : "text-slate-500"}`}>{t.stage}</p>
                                              <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Version history logs */}
                                    <div className="p-4 rounded-xl border bg-slate-950 border-white/5 space-y-4">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Trails &amp; Version History</p>
                                      
                                      <div className="divide-y divide-white/5 text-xs">
                                        {(jobVersions[job.id] || []).map((ver) => (
                                          <div key={ver.version} className="py-2.5 flex items-center justify-between first:pt-0">
                                            <div>
                                              <p className="font-bold text-white">{ver.version} · <span className="text-[10px] font-normal text-slate-400">{ver.date}</span></p>
                                              <p className="text-[10px] text-slate-300 mt-0.5">{ver.change}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">{ver.status}</span>
                                              <button 
                                                onClick={() => {
                                                  // Simulate restore parameters
                                                  if (ver.change.includes("remote") || ver.change.includes("mode")) {
                                                    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, location: "Remote (Global)" } : j));
                                                  }
                                                  triggerToast(`Version ${ver.version} restored successfully!`);
                                                }}
                                                className="px-2 py-0.5 rounded bg-slate-900 border text-[9px] font-bold text-slate-300 hover:bg-slate-800 border-white/5"
                                              >
                                                Restore
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/********************* TAB 4: PREVIEW SIMULATOR *********************/}
                                {(activeDraftTab[job.id] || "edit") === "preview" && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate View Preview Simulator</p>
                                      <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5 text-[9px] font-bold">
                                        <button 
                                          onClick={() => setPreviewMode("desktop")}
                                          className={`px-3 py-1 rounded transition-all ${previewMode === "desktop" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-white"}`}
                                        >
                                          Desktop Simulator
                                        </button>
                                        <button 
                                          onClick={() => setPreviewMode("mobile")}
                                          className={`px-3 py-1 rounded transition-all ${previewMode === "mobile" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-white"}`}
                                        >
                                          Mobile Simulator
                                        </button>
                                      </div>
                                    </div>

                                    {/* Simulator Box */}
                                    <div className="p-4 rounded-xl border bg-slate-950 border-white/5 flex justify-center">
                                      <div 
                                        className="transition-all duration-300 bg-slate-900 border rounded-xl overflow-hidden shadow-2xl p-5"
                                        style={{ 
                                          width: previewMode === "mobile" ? "320px" : "100%", 
                                          borderColor: T.border 
                                        }}
                                      >
                                        {/* Simulated UI */}
                                        <div className="space-y-3.5 text-xs text-slate-200">
                                          <div>
                                            <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest">HireGo verified job listing</span>
                                            <h4 className="text-sm font-extrabold text-white mt-0.5">{editForm.title || job.title}</h4>
                                            <p className="text-[10px] text-slate-400">{editForm.department || job.department} · {editForm.location || job.location} · {editForm.experience || job.experience}</p>
                                          </div>
                                          
                                          <div className="p-3 rounded bg-slate-950/60 border border-white/5 space-y-1.5">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Target Compensation Range</p>
                                            <p className="text-white font-extrabold text-xs">{editForm.salaryRange || job.salaryRange}</p>
                                          </div>

                                          <div className="space-y-2 border-t border-white/5 pt-3">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Role Description</p>
                                            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{editForm.description || job.description}</p>
                                          </div>

                                          <button className="w-full py-2.5 rounded bg-sky-500 font-bold text-white text-[10px] uppercase tracking-wider text-center">
                                            Apply For This Position
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            ) : (
                              /* Standard View Mode */
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Left panel: Info & description */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Description</p>
                                    <p className="text-slate-300 mt-1 leading-relaxed">{job.description}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Range &amp; Exp</p>
                                    <p className="text-white mt-0.5 font-semibold">{job.salaryRange} · {job.experience}</p>
                                  </div>
                                </div>

                                {/* Center panel: Skills gap & manager */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Skills Matrix</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {job.skills.map(s => (
                                        <span key={s} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 border border-white/5">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiring Manager</p>
                                    <p className="text-white font-semibold mt-0.5">{job.hiringManager}</p>
                                  </div>
                                </div>

                                {/* Right panel: AI Suggestions & Edit option */}
                                <div className="p-4 rounded-xl border bg-slate-950 border-white/5 flex flex-col justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-1.5 text-sky-400">
                                      <span className="material-symbols-outlined text-sm">psychology</span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider">AI Suggestions Available</span>
                                    </div>
                                    <ul className="space-y-1.5 text-[11px] text-slate-300 mt-2">
                                      <li className="flex items-start gap-1"><span className="text-emerald-400">✓</span> Add Salary: Expected +22% Applications</li>
                                      <li className="flex items-start gap-1"><span className="text-emerald-400">✓</span> Improve Title: Higher Search Visibility</li>
                                    </ul>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); runAIOptimizer(job); }}
                                      className="flex-1 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[10px] uppercase tracking-wider shadow"
                                    >
                                      Optimize
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setEditingJobId(job.id); setEditForm({ ...job }); }}
                                      className="flex-1 py-1.5 rounded bg-slate-850 hover:bg-slate-750 text-slate-300 font-bold text-[10px] uppercase tracking-wider border border-white/10"
                                    >
                                      Edit Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── HOVER TITLE PREVIEW FLOATING OVERLAY ─── */}
      {hoveredJobPreview && (
        <div 
          className="absolute z-50 p-4 rounded-xl border shadow-2xl space-y-3 bg-slate-950 border-white/10 w-64 pointer-events-none animate-in fade-in duration-100"
          style={{ left: `${hoveredPreviewPos.x}px`, top: `${hoveredPreviewPos.y}px` }}
        >
          <div>
            <h4 className="text-xs font-bold text-white">{hoveredJobPreview.title}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{hoveredJobPreview.department} · {hoveredJobPreview.location}</p>
          </div>
          <div className="text-[10px] space-y-1 text-slate-300 border-t border-white/5 pt-2">
            <div><span className="text-slate-400">Salary:</span> {hoveredJobPreview.salaryRange}</div>
            <div><span className="text-slate-400">Experience:</span> {hoveredJobPreview.experience}</div>
            <div><span className="text-slate-400">Hiring Manager:</span> {hoveredJobPreview.hiringManager}</div>
            <div><span className="text-slate-400">AI Match Grade:</span> {hoveredJobPreview.aiGrade}</div>
          </div>
        </div>
      )}

      {/* ─── HELPER MOCKUP TOOLTIPS ─── */}
      {activeTooltipContent && (
        <div 
          className="absolute z-50 p-3 rounded bg-slate-900 border text-[11px] text-slate-200 border-white/10 shadow-2xl pointer-events-none whitespace-pre-line leading-relaxed max-w-xs"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          {activeTooltipContent}
        </div>
      )}

      {/* ─── DETAIL DRAWER (RIGHT SIDE COLLAPSIBLE PANEL) ─── */}
      {activeDrawerJob && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-250 bg-slate-950" style={{ borderColor: T.border }}>
          {/* Drawer Header */}
          <div className="p-5 border-b flex items-center justify-between bg-slate-900" style={{ borderColor: T.border }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>{activeDrawerJob.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400">{activeDrawerJob.id}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeDrawerJob.department} · {activeDrawerJob.location}</p>
            </div>
            <button onClick={() => setActiveDrawerJob(null)} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Performance Analytics */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Job Performance Analytics</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border bg-slate-900/60" style={{ borderColor: T.border }}>
                  <p className="text-[10px] text-slate-400 uppercase">Job Views</p>
                  <p className="text-lg font-extrabold text-white mt-1">1,842</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-slate-900/60" style={{ borderColor: T.border }}>
                  <p className="text-[10px] text-slate-400 uppercase">Application Conversion</p>
                  <p className="text-lg font-extrabold text-white mt-1">22.4%</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-slate-900/60" style={{ borderColor: T.border }}>
                  <p className="text-[10px] text-slate-400 uppercase">Qualified Candidate %</p>
                  <p className="text-lg font-extrabold text-white mt-1">20.6%</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-slate-900/60" style={{ borderColor: T.border }}>
                  <p className="text-[10px] text-slate-400 uppercase">Avg. Time To Hire</p>
                  <p className="text-lg font-extrabold text-white mt-1">18.2 Days</p>
                </div>
              </div>
            </div>

            {/* Funnel Breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Hiring Funnel</p>
              <div className="p-4 rounded-xl border bg-surface-container space-y-4" style={{ borderColor: T.border }}>
                {[
                  { stage: "Applications Received", count: activeDrawerJob.funnel.applied, color: T.blue },
                  { stage: "AI Smart Screened", count: activeDrawerJob.funnel.screened, color: T.green },
                  { stage: "Recruiter Shortlisted", count: activeDrawerJob.funnel.shortlisted, color: T.purple },
                  { stage: "Interview Stage", count: activeDrawerJob.funnel.interviewed, color: T.yellow },
                  { stage: "Offer Released", count: activeDrawerJob.funnel.offered, color: T.purple },
                  { stage: "Successful Hire", count: activeDrawerJob.funnel.hired, color: T.green },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">{item.stage}</span>
                      <span className="text-white font-extrabold">{item.count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
                      <div className="h-full rounded-full" style={{ background: item.color, width: `${activeDrawerJob.funnel.applied > 0 ? (item.count / activeDrawerJob.funnel.applied) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart AI Job Insights */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Smart AI Insights &amp; Suggestions</p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 flex gap-2.5">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">trending_up</span>
                  <div className="text-xs text-slate-200">
                    <span className="font-bold text-emerald-400">Optimize Required Skills:</span> Focus heavily on PyTorch and LLMs instead of general coding. Est. matching quality <span className="font-bold text-emerald-400">+18%</span>.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── AI OPTIMIZATION MODAL / WIDGET OVERLAY ─── */}
      {isOptimizeOpen && optimizedOutput && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[20px] border shadow-2xl overflow-hidden bg-slate-950 animate-in zoom-in-95 duration-200" style={{ borderColor: T.border }}>
            <div className="p-5 border-b bg-slate-900 flex items-center justify-between" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2 text-sky-400">
                <span className="material-symbols-outlined">psychology</span>
                <h3 className="text-base font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>AI Job Optimization Report</h3>
              </div>
              <button onClick={() => setIsOptimizeOpen(false)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Optimized Job Title</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 line-through">{optimizedOutput.originalTitle}</span>
                  <span className="material-symbols-outlined text-xs text-slate-500">arrow_right_alt</span>
                  <span className="text-sm font-extrabold text-emerald-400">{optimizedOutput.recommendedTitle}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Keywords &amp; Core Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {optimizedOutput.recommendedSkills.map((sk: string) => (
                    <span key={sk} className="px-2.5 py-1 rounded bg-sky-950 border border-sky-800 text-[10px] text-sky-300 font-semibold font-mono">
                      + {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Smart Recommendations</p>
                {optimizedOutput.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border bg-slate-900 border-white/5 space-y-1">
                    <p className="text-xs font-bold text-sky-400">{rec.type}</p>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-slate-900/60 flex justify-end gap-2" style={{ borderColor: T.border }}>
              <button onClick={() => setIsOptimizeOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10">
                Cancel
              </button>
              <button 
                onClick={() => {
                  setJobs(prev => prev.map(j => j.title === optimizedOutput.originalTitle ? { ...j, title: optimizedOutput.recommendedTitle, aiMatch: 99 } : j));
                  if (activeDrawerJob?.title === optimizedOutput.originalTitle) {
                    setActiveDrawerJob(prev => prev ? { ...prev, title: optimizedOutput.recommendedTitle, aiMatch: 99 } : null);
                  }
                  setIsOptimizeOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg"
              >
                Apply AI Suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay spinner for AI Analysis */}
      {isOptimizing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="p-5 rounded-xl bg-slate-900 border border-white/10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider animate-pulse">Running AI Smart Analyzer...</p>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {toast}
        </div>
      )}

    </div>
  );
}
