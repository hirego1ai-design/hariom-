"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import { useRouter } from "next/navigation";

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  isVerified: boolean;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  salary: string;
  experience: string;
  matchScore: number;
  postedAgo: string;
  applicantsCount: number;
  tags: string[];
  perks: string[];
  summary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  companySize: string;
  website: string;
  recruiter: {
    name: string;
    role: string;
    avatar: string;
  };
}

const mockJobsData: Job[] = [
  {
    id: "job-1",
    title: "Staff Product Designer",
    company: "Linear",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRJjB21rY_EvEv_3MTl9vW8DqdWstR591WGW3pmaPJmOR05ixcSuqukR4A1YCXtlJUXCOJLWT-_kLn_IzpJGWfG3Wz9gzbwn_yg7UdycXUI9zhMW35G7oAaqStdhiStmTp29foRCyflQKiDMaFPsjspp-uzazFZ_aLWdGCCEkqCHClZyFmnWSIiYLgkSWFsjhOnmDyRE-GJQz7jap_BdYdWus_HzgLMKHetmH1_qk7Rx08He9Cu6IH--KlV9TXJc8PoiLapwB6eAc",
    isVerified: true,
    location: "San Francisco, CA",
    workMode: "Remote",
    salary: "$180,000 - $240,000 / yr",
    experience: "5+ Years",
    matchScore: 98,
    postedAgo: "2h ago",
    applicantsCount: 42,
    tags: ["Figma", "Design Systems", "Strategy", "SaaS"],
    perks: ["🏥 Full Health Cover", "🌴 Unlimited PTO", "📈 Stock Options"],
    summary: "Lead the next evolution of productivity software. We're looking for a visionary designer to own the core interaction loops and design systems for our enterprise suite.",
    responsibilities: [
      "Architect and ship core end-to-end product features for desktop and web applications.",
      "Maintain and evolve Linear's design system tokens, components, and motion guidelines.",
      "Collaborate directly with engineering leads and product managers to balance speed and craft.",
      "Conduct customer interviews and synthesize research into actionable design roadmaps."
    ],
    requirements: [
      "5+ years designing complex SaaS products or developer productivity tools.",
      "Mastery of Figma, prototyping tools, and modern design systems.",
      "Strong portfolio demonstrating high-craft interaction and visual design.",
      "Experience working in fast-paced product teams."
    ],
    benefits: [
      "Competitive salary + equity package",
      "Full medical, dental, and vision insurance",
      "$3,000 annual learning & development stipend",
      "Home office setup budget ($2,500)"
    ],
    companySize: "50-100 Employees",
    website: "https://linear.app",
    recruiter: {
      name: "Karla Schmidt",
      role: "Head of Talent Acquisition",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    }
  },
  {
    id: "job-2",
    title: "Senior Full Stack AI Engineer",
    company: "Vercel",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ52w4a23G97JtL05P0H-g03J-j7pZ6x3T3O1j7yRz0x2W9r1Q3-y7w8E0J_o9P2u1K0l3W_y4v5Z6a7B8c9D0e1F2g3H4i5J6k7L8m9N0",
    isVerified: true,
    location: "New York, NY",
    workMode: "Hybrid",
    salary: "$190,000 - $260,000 / yr",
    experience: "4+ Years",
    matchScore: 96,
    postedAgo: "4h ago",
    applicantsCount: 68,
    tags: ["React", "TypeScript", "Next.js", "AI Agents", "Node.js"],
    perks: ["⚡ Cutting Edge Tech", "🌎 Remote Work", "🍼 Parental Leave"],
    summary: "Join the Vercel AI platform team building infrastructure for autonomous web agents and generative UI systems at global scale.",
    responsibilities: [
      "Build real-time streaming interfaces for LLMs and agentic workflows.",
      "Optimize edge serverless execution performance for low latency AI inference.",
      "Create developer SDKs and UI primitives for React 19 server components.",
      "Participate in open source contributions to Next.js and the Vercel AI SDK."
    ],
    requirements: [
      "4+ years building production web applications using React and TypeScript.",
      "Deep understanding of Next.js App Router, SSR, and Server Actions.",
      "Hands-on experience integrating OpenAI, Anthropic, or open-source LLM APIs.",
      "Track record of writing clean, maintainable code with high test coverage."
    ],
    benefits: [
      "Top percentile base compensation & equity grant",
      "Flexible working hours and remote setup support",
      "Comprehensive global healthcare plan",
      "Annual company retreats in Europe & Americas"
    ],
    companySize: "500-1000 Employees",
    website: "https://vercel.com",
    recruiter: {
      name: "Marcus Vance",
      role: "Lead Engineering Recruiter",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    }
  },
  {
    id: "job-3",
    title: "Lead Frontier AI Researcher",
    company: "Anthropic",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuF2v5Z6a7B8c9D0e1F2g3H4i5J6k7L8m9N0o1P2q3R4s5T6u7V8w9X0y1Z2a3B4c5D6e7F8g9H0i1J2k3L4m5N6o7P8q9R0s1T2u3V4w5X6",
    isVerified: true,
    location: "San Francisco, CA",
    workMode: "On-site",
    salary: "$250,000 - $380,000 / yr",
    experience: "6+ Years",
    matchScore: 95,
    postedAgo: "1d ago",
    applicantsCount: 29,
    tags: ["LLMs", "PyTorch", "Alignment", "Distributed Training"],
    perks: ["🧠 AI Research Grant", "🏥 Premium Health", "🍱 Free Daily Gourmet Catering"],
    summary: "Architect the next generation of safe and steerable AI models. We are hiring for the core alignment team to ensure frontier LLMs follow human intent reliably.",
    responsibilities: [
      "Design and train Reinforcement Learning from Human Feedback (RLHF) pipelines.",
      "Implement distributed GPU training algorithms across thousands of Nvidia H100 nodes.",
      "Conduct empirical experiments on model steerability and safety benchmarks.",
      "Publish peer-reviewed research findings in leading AI conferences."
    ],
    requirements: [
      "PhD or 6+ years equivalent experience in Machine Learning / AI Research.",
      "Extensive track record of training large transformer language models.",
      "Proficiency with PyTorch, CUDA, and distributed compute frameworks (Ray / Megatron).",
      "Strong publication record or high-impact open source ML contributions."
    ],
    benefits: [
      "Top-tier compensation with generous equity upside",
      "Unlimited compute resource allocation for research",
      "Full coverage health care + vision + dental for dependants",
      "Relocation package for San Francisco relocation"
    ],
    companySize: "200-500 Employees",
    website: "https://anthropic.com",
    recruiter: {
      name: "Dr. Elena Rostova",
      role: "Head of AI Talent",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
    }
  }
];

export default function JobsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(mockJobsData[0] || null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [apiJobs, setApiJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success && data.jobs?.length > 0 && isMounted) {
          const mappedJobs: Job[] = data.jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company?.name || "HireGo Partner",
            logo: j.company?.logoUrl || "https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=150&q=80",
            isVerified: true,
            location: j.location || "India",
            workMode: (j.type === "Remote" ? "Remote" : j.type === "Hybrid" ? "Hybrid" : "On-site") as any,
            salary: j.salaryRange || "₹18,000,000 - ₹30,000,000 / yr",
            experience: "3+ Years",
            matchScore: 92,
            postedAgo: "Recently",
            applicantsCount: 18,
            tags: j.requirements || ["React", "TypeScript", "AI"],
            perks: ["🏥 Medical Cover", "⚡ Top Equity", "🌎 Remote Option"],
            summary: j.description || "Exciting opportunity at a fast-growing AI startup.",
            responsibilities: ["Build scalable web components", "Collaborate with cross-functional teams"],
            requirements: j.requirements || ["TypeScript", "Next.js"],
            benefits: ["Health coverage", "Flexible hours"],
            companySize: "50-200 Employees",
            website: "https://hirego.ai",
            recruiter: {
              name: "HireGo Recruiter",
              role: "Talent Acquisition",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            },
          }));
          setApiJobs(mappedJobs);
        }
      } catch (err) {
        console.warn("Failed fetching live jobs, falling back to static cache:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchJobs, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const jobsList = apiJobs.length > 0 ? apiJobs : mockJobsData;

  const filteredJobs = jobsList.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === "All") return matchesSearch;
    if (activeCategory === "Remote") return matchesSearch && job.workMode === "Remote";
    if (activeCategory === "Design") return matchesSearch && job.tags.includes("Figma");
    if (activeCategory === "Engineering") return matchesSearch && (job.tags.includes("React") || job.tags.includes("TypeScript"));
    if (activeCategory === "AI & ML") return matchesSearch && job.tags.includes("LLMs");
    return matchesSearch;
  });

  const handleEasyApply = async (jobId: string) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs((prev) => [...prev, jobId]);
    }
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
    } catch {
      // Fallback
    }
    setApplySuccessMessage(`Application submitted successfully for ${selectedJob?.title || "Job"}!`);
    setShowApplyModal(false);
    setTimeout(() => setApplySuccessMessage(null), 4000);
  };

  const toggleBookmark = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  return (
    <div
      className="min-h-screen flex relative"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Jobs Layout Wrapper */}
      <div className="ml-[116px] w-full min-h-screen flex flex-col">
        {/* Top Floating Header */}
        <header
          className="sticky top-0 z-40 h-[64px] backdrop-blur-xl px-6 flex items-center justify-between"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div className="flex items-center gap-6 flex-1 max-w-xl">
            <div className="relative w-full">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              >
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, company, or skills (e.g. React, Figma)..."
                className="w-full h-[40px] rounded-full pl-11 pr-4 text-xs outline-none transition-colors"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--outline)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold items-center gap-2"
              style={{
                backgroundColor: "var(--primary-container-bg)",
                color: "var(--primary)",
                border: "1px solid var(--primary)",
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--primary)" }} />
              Proctor Active
            </span>

            <button
              onClick={() => router.push("/notifications")}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
            </button>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => router.push("/profile/public")}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary-dim p-0.5 flex items-center justify-center shadow-md"
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--primary)" }}
              >
                RV
              </div>
            </button>
          </div>
        </header>

        {/* Success Toast Banner */}
        {applySuccessMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black px-5 py-3 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {applySuccessMessage}
          </div>
        )}

        {/* Hero Section & Category Filter Bar */}
        <div className="p-6 pb-2 space-y-4" style={{ borderBottom: "1px solid var(--outline)" }}>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              Discover Your Next Opportunity
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI-matched high-density roles updated continuously based on your HireGo Score™.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Remote", "Engineering", "Design", "AI & ML"].map((category) => {
              const isSelected = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
                  style={{
                    backgroundColor: isSelected ? "var(--primary)" : "var(--surface-container-high)",
                    color: isSelected ? "#ffffff" : "var(--text-secondary)",
                    borderColor: isSelected ? "var(--primary)" : "var(--outline)",
                    boxShadow: isSelected ? "var(--shadow-btn-red)" : "none",
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split View Content: Compact Rich Cards (Left) + Interactive JD Right Drawer (Right) */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* Left Column: Compact Rich Job Cards List */}
          <div className="w-full lg:w-[48%] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {filteredJobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              const isApplied = appliedJobs.includes(job.id);
              const isBookmarked = savedJobs.includes(job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between"
                  style={{
                    backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--bg-card)",
                    borderColor: isSelected ? "var(--primary)" : "var(--outline)",
                    boxShadow: isSelected ? "var(--shadow-card-hover)" : "var(--shadow-card)",
                  }}
                >
                  <div>
                    {/* Top Row: Company Logo + Title + Bookmark Pill */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={{
                            backgroundColor: "var(--surface-container-high)",
                            border: "1px solid var(--outline)",
                          }}
                        >
                          <img src={job.logo} alt={job.company} className="w-7 h-7 object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm transition-colors line-clamp-1" style={{ color: "var(--text-primary)" }}>
                              {job.title}
                            </h3>
                            {job.isVerified && (
                              <span className="material-symbols-outlined text-[14px]" style={{ color: "var(--primary)" }} title="AI Verified Listing">
                                verified
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                            {job.company} • {job.location} ({job.workMode})
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => toggleBookmark(job.id, e)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          color: isBookmarked ? "var(--primary)" : "var(--text-muted)",
                          backgroundColor: isBookmarked ? "var(--primary-container-bg)" : "var(--surface-container-high)",
                        }}
                        title="Bookmark Job"
                      >
                        <span className="material-symbols-outlined text-base">
                          {isBookmarked ? "bookmark_added" : "bookmark"}
                        </span>
                      </button>
                    </div>

                    {/* Second Row: Rich Indicators (Match %, Salary, Experience, Time) */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full font-extrabold text-[11px]"
                        style={{
                          backgroundColor: "rgba(52,168,83,0.12)",
                          color: "var(--color-green)",
                          border: "1px solid rgba(52,168,83,0.2)",
                        }}
                      >
                        {job.matchScore}% Match
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full font-medium text-[11px]"
                        style={{
                          backgroundColor: "var(--surface-container-high)",
                          border: "1px solid var(--outline)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {job.salary}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{
                          backgroundColor: "var(--surface-container-high)",
                          border: "1px solid var(--outline)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {job.experience}
                      </span>
                      <span className="text-[11px] ml-auto font-mono" style={{ color: "var(--text-muted)" }}>
                        {job.postedAgo} • {job.applicantsCount} applicants
                      </span>
                    </div>

                    {/* Summary Excerpt */}
                    <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                      {job.summary}
                    </p>

                    {/* Skill Tech Stack Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono border"
                          style={{
                            backgroundColor: "var(--surface-container-high)",
                            borderColor: "var(--outline)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Key Perks Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.perks.map((perk) => (
                        <span
                          key={perk}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{
                            backgroundColor: "var(--primary-container-bg)",
                            color: "var(--primary)",
                            borderColor: "var(--primary)",
                          }}
                        >
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Compact Bottom Action Pill Buttons */}
                  <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--outline)" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="flex-1 py-2 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1"
                      style={{
                        backgroundColor: "var(--surface-container-high)",
                        border: "1px solid var(--outline)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowApplyModal(true);
                      }}
                      disabled={isApplied}
                      className="flex-1 py-2 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1"
                      style={
                        isApplied
                          ? {
                              backgroundColor: "rgba(52,168,83,0.15)",
                              color: "var(--color-green)",
                              border: "1px solid rgba(52,168,83,0.3)",
                            }
                          : {
                              background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                              color: "#ffffff",
                              boxShadow: "var(--shadow-btn-red)",
                            }
                      }
                    >
                      <span>{isApplied ? "Applied ✓" : "Easy Apply"}</span>
                      {!isApplied && <span className="material-symbols-outlined text-[14px]">send</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Full Interactive Job Description Drawer / Detail Panel */}
          {selectedJob && (
            <div
              className="hidden lg:flex flex-col flex-1 rounded-3xl p-6 overflow-y-auto custom-scrollbar shadow-2xl relative"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
              }}
            >
              {/* Header Banner */}
              <div className="pb-5 space-y-4" style={{ borderBottom: "1px solid var(--outline)" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: "var(--surface-container-high)",
                        border: "1px solid var(--outline)",
                      }}
                    >
                      <img src={selectedJob.logo} alt={selectedJob.company} className="w-9 h-9 object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>{selectedJob.title}</h2>
                        {selectedJob.isVerified && (
                          <span className="material-symbols-outlined text-base" style={{ color: "var(--primary)" }} title="Verified Employer">
                            verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {selectedJob.company} • {selectedJob.location} • {selectedJob.companySize}
                      </p>
                    </div>
                  </div>

                  <a
                    href={selectedJob.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      border: "1px solid var(--outline)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>Website</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>

                {/* Match Score & Quick Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5"
                    style={{
                      backgroundColor: "rgba(52,168,83,0.12)",
                      color: "var(--color-green)",
                      border: "1px solid rgba(52,168,83,0.2)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: "var(--color-green)" }} />
                    {selectedJob.matchScore}% HireGo AI Match
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      border: "1px solid var(--outline)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    💰 {selectedJob.salary}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      border: "1px solid var(--outline)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    💼 {selectedJob.experience}
                  </span>
                </div>

                {/* Primary Action Button Bar */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={appliedJobs.includes(selectedJob.id)}
                    className="flex-1 py-3 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2"
                    style={
                      appliedJobs.includes(selectedJob.id)
                        ? {
                            backgroundColor: "rgba(52,168,83,0.15)",
                            color: "var(--color-green)",
                            border: "1px solid rgba(52,168,83,0.3)",
                          }
                        : {
                            background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                            color: "#ffffff",
                            boxShadow: "var(--shadow-btn-red)",
                          }
                    }
                  >
                    <span>{appliedJobs.includes(selectedJob.id) ? "Application Submitted ✓" : "Easy Apply Now"}</span>
                    {!appliedJobs.includes(selectedJob.id) && (
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    )}
                  </button>

                  <button
                    onClick={(e) => toggleBookmark(selectedJob.id, e)}
                    className="px-5 py-3 rounded-full font-bold text-xs transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      border: "1px solid var(--outline)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span className="material-symbols-outlined text-base">
                      {savedJobs.includes(selectedJob.id) ? "bookmark_added" : "bookmark"}
                    </span>
                    <span>{savedJobs.includes(selectedJob.id) ? "Saved" : "Save Job"}</span>
                  </button>
                </div>
              </div>

              {/* Full Description Details */}
              <div className="py-6 space-y-6 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <div>
                  <h3 className="text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                    About The Role
                  </h3>
                  <p>{selectedJob.summary}</p>
                </div>

                <div>
                  <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {selectedJob.responsibilities.map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                    Requirements & Skills
                  </h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                    Benefits & Perks
                  </h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {selectedJob.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Recruiter Information Card */}
                <div
                  className="p-4 rounded-2xl flex items-center justify-between"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    border: "1px solid var(--outline)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedJob.recruiter.avatar}
                      alt={selectedJob.recruiter.name}
                      className="w-10 h-10 rounded-full object-cover"
                      style={{ border: "1px solid var(--outline)" }}
                    />
                    <div>
                      <p className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>{selectedJob.recruiter.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{selectedJob.recruiter.role}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/messages/chat")}
                    className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: "var(--primary-container-bg)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    <span>Message Recruiter</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Easy Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--outline)",
            }}
          >
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--outline)" }}>
              <div className="flex items-center gap-3">
                <img src={selectedJob.logo} alt={selectedJob.company} className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Easy Apply to {selectedJob.company}</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedJob.title}</p>
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: "var(--surface-container-high)",
                  color: "var(--text-primary)",
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs" style={{ color: "var(--text-secondary)" }}>
              <div
                className="p-4 rounded-2xl space-y-2"
                style={{
                  backgroundColor: "var(--surface-container-high)",
                  border: "1px solid var(--outline)",
                }}
              >
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>Your Profile Data Attached:</p>
                <p>✓ Universal HireGo Profile & Verified Badges</p>
                <p>✓ 2-Minute Video Resume (Communication Score: 94%)</p>
                <p>✓ HireGo Score™: 98/100</p>
              </div>

              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                By clicking submit, your HireGo vector profile will be transmitted directly to {selectedJob.recruiter.name} ({selectedJob.recruiter.role}).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2.5 rounded-full font-bold text-xs transition-all"
                style={{
                  backgroundColor: "var(--surface-container-high)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--outline)",
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleEasyApply(selectedJob.id)}
                className="flex-1 py-2.5 rounded-full text-white font-bold text-xs shadow-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "var(--shadow-btn-red)",
                }}
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}