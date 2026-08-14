"use client";
import React, { useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";

interface JobPostRecord {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  aiMatchScore: number;
  applicants: number;
  status: "Active" | "Pending Approval" | "Flagged" | "Closed";
  boosted: boolean;
  postedAt: string;
}

const initialJobs: JobPostRecord[] = [
  { id: "JOB-4811", title: "Senior AI & LLM Systems Engineer", company: "Neural Nexus AI", department: "Engineering", location: "Bengaluru (Hybrid)", aiMatchScore: 96, applicants: 342, status: "Active", boosted: true, postedAt: "2 days ago" },
  { id: "JOB-4812", title: "Principal Product Designer", company: "Glasswing Labs", department: "Design", location: "Remote, India", aiMatchScore: 92, applicants: 189, status: "Active", boosted: false, postedAt: "3 days ago" },
  { id: "JOB-4813", title: "Full Stack Next.js & Go Developer", company: "FinFlow Technologies", department: "Engineering", location: "Hyderabad", aiMatchScore: 88, applicants: 412, status: "Active", boosted: true, postedAt: "1 day ago" },
  { id: "JOB-4814", title: "DevOps & Cloud Security Architect", company: "CyberShield Corp", department: "Security", location: "Pune", aiMatchScore: 85, applicants: 98, status: "Active", boosted: false, postedAt: "4 days ago" },
  { id: "JOB-4815", title: "Marketing & Growth Director", company: "Streamline Global", department: "Marketing", location: "Mumbai", aiMatchScore: 79, applicants: 64, status: "Pending Approval", boosted: false, postedAt: "6 hours ago" },
  { id: "JOB-4816", title: "Crypto / Web3 Smart Contract Auditor", company: "Vault Protocol", department: "Blockchain", location: "Remote", aiMatchScore: 68, applicants: 124, status: "Flagged", boosted: false, postedAt: "5 days ago" },
  { id: "JOB-4817", title: "Enterprise Account Executive", company: "Apex Solutions", department: "Sales", location: "Gurugram", aiMatchScore: 91, applicants: 85, status: "Active", boosted: false, postedAt: "1 week ago" },
  { id: "JOB-4818", title: "Data Platform Engineer (Spark & Iceberg)", company: "HyperScale Analytics", department: "Data", location: "Bengaluru", aiMatchScore: 94, applicants: 215, status: "Active", boosted: true, postedAt: "2 days ago" },
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobPostRecord[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter !== "All" && j.status !== statusFilter) return false;
      if (departmentFilter !== "All" && j.department !== departmentFilter) return false;
      return true;
    });
  }, [jobs, searchQuery, statusFilter, departmentFilter]);

  const toggleBoost = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, boosted: !j.boosted } : j))
    );
    showToast("Job sponsor boost status toggled!");
  };

  const approveJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: "Active" } : j))
    );
    showToast(`Job ${id} approved & published to feed!`);
  };

  const flagJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: "Flagged" } : j))
    );
    showToast(`Job ${id} flagged for compliance review.`);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="Active Job Posts & Matching Telemetry"
          subtitle="Platform-wide job postings, AI JD matching scores, and moderation controls."
          onSearch={(q) => setSearchQuery(q)}
        />

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {toast}
          </div>
        )}

        <main className="pt-24 p-gutter space-y-stack-lg flex-1 max-w-[1600px] w-full mx-auto">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141418] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-white transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Dashboard
              </Link>
              <span className="text-white/20">|</span>
              <span className="text-xs font-bold text-text-secondary">Platform Job Volume:</span>
              <span className="text-sm font-extrabold text-white">3,860 Active Posts</span>
            </div>

            <div className="flex items-center gap-2">
              {(["All", "Active", "Pending Approval", "Flagged"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === s ? "bg-primary text-white" : "bg-white/5 text-text-muted hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Bento Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Active Jobs</p>
              <h3 className="font-bold text-3xl text-white mt-1">3,860</h3>
              <p className="text-green text-xs mt-2 font-bold">+24% vs last month</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Avg AI JD Match Score</p>
              <h3 className="font-bold text-3xl text-primary mt-1">88.4%</h3>
              <p className="text-secondary text-xs mt-2 font-bold">Semantic Vector Matched</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Applications Ingested</p>
              <h3 className="font-bold text-3xl text-gold-payment mt-1">1.42 Lakh</h3>
              <p className="text-text-muted text-xs mt-2 font-bold">36.8 apps / job average</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Sponsored / Boosted</p>
              <h3 className="font-bold text-3xl text-emerald-400 mt-1">428</h3>
              <p className="text-emerald-400/80 text-xs mt-2 font-bold">₹10.7L Ad Boost MRR</p>
            </div>
          </div>

          {/* Job Listings Management Table */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white/5">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">work</span>
                Job Postings Ledger ({filteredJobs.length})
              </h3>
              <div className="flex items-center gap-2">
                {["All", "Engineering", "Design", "Marketing", "Security", "Sales", "Data"].map((dep) => (
                  <button
                    key={dep}
                    onClick={() => setDepartmentFilter(dep)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      departmentFilter === dep ? "bg-white/20 text-white" : "text-text-muted hover:text-white"
                    }`}
                  >
                    {dep}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary">
                <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Job Title & ID</th>
                    <th className="p-4">Employer Company</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">AI Match Score</th>
                    <th className="p-4 text-center">Applicants</th>
                    <th className="p-4 text-center">Boost</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-white flex items-center gap-2">
                          {job.title}
                          {job.boosted && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-gold-payment/20 text-gold-payment flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">bolt</span> BOOSTED
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-text-muted font-data-md">{job.id} • {job.location}</p>
                      </td>
                      <td className="p-4 font-bold text-white">{job.company}</td>
                      <td className="p-4 text-text-secondary">{job.department}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold font-data-md text-xs ${
                            job.aiMatchScore >= 90
                              ? "bg-green/20 text-green"
                              : job.aiMatchScore >= 80
                              ? "bg-primary/20 text-primary"
                              : "bg-yellow/20 text-yellow"
                          }`}
                        >
                          {job.aiMatchScore}% Match
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-white font-data-md">{job.applicants}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleBoost(job.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            job.boosted
                              ? "bg-gold-payment/10 border-gold-payment/30 text-gold-payment"
                              : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                          }`}
                        >
                          {job.boosted ? "⚡ Active Boost" : "Standard"}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                            job.status === "Active"
                              ? "bg-green/10 border-green/30 text-green"
                              : job.status === "Pending Approval"
                              ? "bg-yellow/10 border-yellow/30 text-yellow"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {job.status !== "Active" && (
                          <button
                            onClick={() => approveJob(job.id)}
                            className="px-2.5 py-1 rounded-lg bg-green/10 hover:bg-green/20 text-green font-bold text-xs transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {job.status !== "Flagged" && (
                          <button
                            onClick={() => flagJob(job.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition-colors"
                          >
                            Flag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
