"use client";
import React, { useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number;
  verified: boolean;
  status: "Active" | "Suspended" | "Pending";
  riskFlagged: boolean;
  joined: string;
  avatar: string;
}

const initialCandidates: Candidate[] = [
  { id: "CND-901", name: "Aarav Sharma", email: "aarav.sharma@example.com", role: "Senior Full Stack Dev", score: 94, verified: true, status: "Active", riskFlagged: false, joined: "2026-01-12", avatar: "AS" },
  { id: "CND-902", name: "Priya Patel", email: "priya.p@tech.io", role: "AI / ML Engineer", score: 98, verified: true, status: "Active", riskFlagged: false, joined: "2026-02-01", avatar: "PP" },
  { id: "CND-903", name: "Rohan Verma", email: "rohan.v@gmail.com", role: "Frontend Developer", score: 76, verified: false, status: "Active", riskFlagged: true, joined: "2026-02-18", avatar: "RV" },
  { id: "CND-904", name: "Ananya Iyer", email: "ananya.iyer@cloud.in", role: "DevOps Specialist", score: 91, verified: true, status: "Active", riskFlagged: false, joined: "2026-03-04", avatar: "AI" },
  { id: "CND-905", name: "Vikram Malhotra", email: "vikram.m@domain.com", role: "Data Scientist", score: 62, verified: false, status: "Suspended", riskFlagged: true, joined: "2026-03-10", avatar: "VM" },
  { id: "CND-906", name: "Neha Gupta", email: "neha.gupta@corp.org", role: "Product Designer", score: 88, verified: true, status: "Active", riskFlagged: false, joined: "2026-04-02", avatar: "NG" },
  { id: "CND-907", name: "Siddharth Rao", email: "siddharth@coder.dev", role: "Backend Engineer (Go)", score: 83, verified: true, status: "Active", riskFlagged: false, joined: "2026-04-15", avatar: "SR" },
  { id: "CND-908", name: "Kavya Nair", email: "kavya.nair@ai.org", role: "NLP Specialist", score: 96, verified: true, status: "Active", riskFlagged: false, joined: "2026-05-01", avatar: "KN" },
];

export default function EmployerPageE1() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Active" | "Suspended" | "Risk Flagged">("All");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New Candidate Form State
  const [newCandidate, setNewCandidate] = useState({ name: "", email: "", role: "Full Stack Engineer" });

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeTab === "Active") return c.status === "Active";
      if (activeTab === "Suspended") return c.status === "Suspended";
      if (activeTab === "Risk Flagged") return c.riskFlagged;
      return true;
    });
  }, [candidates, searchQuery, activeTab]);

  const toggleVerification = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, verified: !c.verified } : c))
    );
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate((prev) => (prev ? { ...prev, verified: !prev.verified } : null));
    }
    triggerToast("Candidate verification status updated!");
  };

  const toggleStatus = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" } : c
      )
    );
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate((prev) =>
        prev ? { ...prev, status: prev.status === "Active" ? "Suspended" : "Active" } : null
      );
    }
    triggerToast("User account status toggled!");
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email) return;

    const created: Candidate = {
      id: `CND-${Math.floor(100 + Math.random() * 900)}`,
      name: newCandidate.name,
      email: newCandidate.email,
      role: newCandidate.role,
      score: 85,
      verified: true,
      status: "Active",
      riskFlagged: false,
      joined: new Date().toISOString().split("T")[0],
      avatar: newCandidate.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    };

    setCandidates([created, ...candidates]);
    setNewCandidate({ name: "", email: "", role: "Full Stack Engineer" });
    setShowAddModal(false);
    triggerToast(`Added candidate: ${created.name}`);
  };

  const exportCSV = () => {
    const headers = "ID,Name,Email,Role,AI Score,Verified,Status,Joined\n";
    const rows = candidates
      .map((c) => `"${c.id}","${c.name}","${c.email}","${c.role}",${c.score},${c.verified},"${c.status}","${c.joined}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HireGo_Candidates_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    triggerToast("CSV Export downloaded!");
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />

      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="Candidate User Management"
          subtitle="Review, manage, and verify all talent profiles across the platform."
          onSearch={(q) => setSearchQuery(q)}
        />

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {toast}
          </div>
        )}

        <main className="pt-24 p-gutter space-y-stack-lg flex-1 max-w-[1600px] w-full mx-auto">
          {/* Action Bar & Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#141418] p-1.5 rounded-full border border-white/10">
              {(["All", "Active", "Suspended", "Risk Flagged"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter candidate profiles..."
                  className="h-10 rounded-full bg-[#1E1E1E] border border-white/10 pl-10 pr-4 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                />
              </div>

              <button
                onClick={exportCSV}
                className="h-10 px-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export CSV
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="h-10 px-5 rounded-full bg-primary hover:bg-primary-light text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Add Candidate
              </button>
            </div>
          </div>

          {/* Stats Overview Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Candidates</p>
              <h3 className="font-bold text-3xl text-white mt-1">{candidates.length * 1560}</h3>
              <p className="text-green text-xs mt-2 flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> +12% this month
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">AI Verified Talent</p>
              <h3 className="font-bold text-3xl text-primary mt-1">
                {candidates.filter((c) => c.verified).length * 1100}
              </h3>
              <p className="text-secondary text-xs mt-2 font-bold">78.4% verification rate</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Active Live Sessions</p>
              <h3 className="font-bold text-3xl text-yellow mt-1">1,102</h3>
              <p className="text-text-muted text-xs mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow animate-pulse" /> Live in tests
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Risk Flagged</p>
              <h3 className="font-bold text-3xl text-red-400 mt-1">
                {candidates.filter((c) => c.riskFlagged).length}
              </h3>
              <p className="text-red-400/80 text-xs mt-2 font-bold">Requires Admin Review</p>
            </div>
          </div>

          {/* Candidates Data Table */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                Candidate Records ({filteredCandidates.length})
              </h3>
              <span className="text-xs text-text-muted">Showing page 1 of 1</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary">
                <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Target Role</th>
                    <th className="p-4 text-center">HireGo AI Score</th>
                    <th className="p-4 text-center">AI Verified</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
                            <div className="w-full h-full rounded-full bg-[#1A1A20] flex items-center justify-center font-bold text-white text-xs">
                              {candidate.avatar}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {candidate.name}
                              {candidate.riskFlagged && (
                                <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[9px] rounded font-bold">
                                  RISK
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-text-muted">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-white">{candidate.role}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold font-data-md text-xs ${
                            candidate.score >= 90
                              ? "bg-green/20 text-green"
                              : candidate.score >= 80
                              ? "bg-primary/20 text-primary"
                              : "bg-yellow/20 text-yellow"
                          }`}
                        >
                          {candidate.score} / 100
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleVerification(candidate.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            candidate.verified
                              ? "bg-green/10 border-green/30 text-green hover:bg-green/20"
                              : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                          }`}
                        >
                          {candidate.verified ? "Verified ✓" : "Unverified"}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus(candidate.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            candidate.status === "Active"
                              ? "bg-green/20 text-green"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {candidate.status}
                        </button>
                      </td>
                      <td className="p-4 text-text-muted font-data-md">{candidate.joined}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedCandidate(candidate)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary hover:text-white text-xs font-bold transition-all border border-white/10"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#17171C] border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {selectedCandidate.avatar}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{selectedCandidate.name}</h3>
                <p className="text-xs text-text-muted">{selectedCandidate.email} • ID: {selectedCandidate.id}</p>
                <p className="text-xs text-primary font-bold mt-1">{selectedCandidate.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">AI HireScore</p>
                <p className="text-xl font-bold text-green font-data-md">{selectedCandidate.score}/100</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Verification</p>
                <p className={`text-xs font-bold mt-1 ${selectedCandidate.verified ? "text-green" : "text-text-muted"}`}>
                  {selectedCandidate.verified ? "Verified ✓" : "Pending"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Account Status</p>
                <p className={`text-xs font-bold mt-1 ${selectedCandidate.status === "Active" ? "text-green" : "text-red-400"}`}>
                  {selectedCandidate.status}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Admin Controls</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleVerification(selectedCandidate.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all"
                >
                  {selectedCandidate.verified ? "Revoke Verification" : "Grant AI Verification"}
                </button>
                <button
                  onClick={() => toggleStatus(selectedCandidate.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    selectedCandidate.status === "Active"
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-green/20 text-green hover:bg-green/30"
                  }`}
                >
                  {selectedCandidate.status === "Active" ? "Suspend Candidate" : "Reactivate Candidate"}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-light transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#17171C] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Provision New Candidate</h3>
            <form onSubmit={handleAddCandidate} className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  placeholder="e.g. Vikram Seth"
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  placeholder="e.g. vikram@domain.com"
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Primary Role</label>
                <input
                  type="text"
                  required
                  value={newCandidate.role}
                  onChange={(e) => setNewCandidate({ ...newCandidate, role: e.target.value })}
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-text-muted hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
