"use client";
import React, { useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export interface Company {
  id: string;
  name: string;
  domain: string;
  plan: "Enterprise" | "Pro" | "Starter" | "Managed Hiring";
  jobs: number;
  hires: number;
  kyc: "Approved" | "Pending" | "Rejected";
  status: "Active" | "Suspended";
  joined: string;
}

const initialCompanies: Company[] = [
  { id: "EMP-101", name: "GlobalTech Solutions", domain: "globaltech.io", plan: "Enterprise", jobs: 42, hires: 184, kyc: "Approved", status: "Active", joined: "2025-11-10" },
  { id: "EMP-102", name: "Apex Cybernetics", domain: "apexcyber.com", plan: "Enterprise", jobs: 18, hires: 92, kyc: "Approved", status: "Active", joined: "2026-01-05" },
  { id: "EMP-103", name: "Nova AI Labs", domain: "novalai.ai", plan: "Pro", jobs: 9, hires: 34, kyc: "Pending", status: "Active", joined: "2026-02-14" },
  { id: "EMP-104", name: "FinFlow Technologies", domain: "finflow.in", plan: "Pro", jobs: 15, hires: 61, kyc: "Approved", status: "Active", joined: "2026-03-01" },
  { id: "EMP-105", name: "Zenith Cloud Corp", domain: "zenithcloud.org", plan: "Managed Hiring", jobs: 4, hires: 8, kyc: "Pending", status: "Active", joined: "2026-03-22" },
  { id: "EMP-106", name: "Vanguard Systems", domain: "vanguard.co", plan: "Starter", jobs: 2, hires: 3, kyc: "Rejected", status: "Suspended", joined: "2026-04-11" },
];

export default function EmployerPageE2() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Enterprise" | "Pro" | "Pending KYC" | "Suspended">("All");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [newCompany, setNewCompany] = useState({ name: "", domain: "", plan: "Pro" as Company["plan"] });

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeTab === "Enterprise") return c.plan === "Enterprise";
      if (activeTab === "Pro") return c.plan === "Pro";
      if (activeTab === "Pending KYC") return c.kyc === "Pending";
      if (activeTab === "Suspended") return c.status === "Suspended";
      return true;
    });
  }, [companies, searchQuery, activeTab]);

  const toggleKyc = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, kyc: c.kyc === "Approved" ? "Pending" : "Approved" }
          : c
      )
    );
    triggerToast("Company KYC status updated!");
  };

  const toggleStatus = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" } : c
      )
    );
    triggerToast("Company account status updated!");
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.domain) return;

    const created: Company = {
      id: `EMP-${Math.floor(200 + Math.random() * 800)}`,
      name: newCompany.name,
      domain: newCompany.domain,
      plan: newCompany.plan,
      jobs: 1,
      hires: 0,
      kyc: "Approved",
      status: "Active",
      joined: new Date().toISOString().split("T")[0],
    };

    setCompanies([created, ...companies]);
    setNewCompany({ name: "", domain: "", plan: "Pro" });
    setShowAddModal(false);
    triggerToast(`Registered employer: ${created.name}`);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />

      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="Employer & Company Management"
          subtitle="Oversee corporate accounts, subscription tiers, KYC compliance, and job quotas."
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
              {(["All", "Enterprise", "Pro", "Pending KYC", "Suspended"] as const).map((tab) => (
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies or domains..."
                className="h-10 rounded-full bg-[#1E1E1E] border border-white/10 px-4 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              />

              <button
                onClick={() => setShowAddModal(true)}
                className="h-10 px-5 rounded-full bg-primary hover:bg-primary-light text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                Add Employer
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">business</span>
              </div>
              <div>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Employers</p>
                <h3 className="font-bold text-2xl text-white">{companies.length * 410}</h3>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center text-green">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Verified Corporate</p>
                <h3 className="font-bold text-2xl text-white">94.2%</h3>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-payment/10 flex items-center justify-center text-gold-payment">
                <span className="material-symbols-outlined text-2xl">stars</span>
              </div>
              <div>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Enterprise Tiers</p>
                <h3 className="font-bold text-2xl text-white">34 Clients</h3>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow/10 flex items-center justify-center text-yellow">
                <span className="material-symbols-outlined text-2xl">pending_actions</span>
              </div>
              <div>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Pending KYC</p>
                <h3 className="font-bold text-2xl text-yellow">
                  {companies.filter((c) => c.kyc === "Pending").length}
                </h3>
              </div>
            </div>
          </div>

          {/* Companies Table */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
                Registered Companies ({filteredCompanies.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary">
                <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Company Name</th>
                    <th className="p-4">Subscription Plan</th>
                    <th className="p-4 text-center">Active Jobs</th>
                    <th className="p-4 text-center">Total Hires</th>
                    <th className="p-4 text-center">KYC Verification</th>
                    <th className="p-4 text-center">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-white">{c.name}</p>
                        <p className="text-[11px] text-text-muted">{c.domain} • {c.id}</p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                            c.plan === "Enterprise"
                              ? "bg-gold-payment/20 border-gold-payment/40 text-gold-payment"
                              : c.plan === "Pro"
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-white/10 border-white/20 text-white"
                          }`}
                        >
                          {c.plan}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-white">{c.jobs}</td>
                      <td className="p-4 text-center font-bold text-green">{c.hires}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleKyc(c.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            c.kyc === "Approved"
                              ? "bg-green/10 border-green/30 text-green"
                              : c.kyc === "Pending"
                              ? "bg-yellow/10 border-yellow/30 text-yellow"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}
                        >
                          {c.kyc}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            c.status === "Active" ? "bg-green/20 text-green" : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {c.status}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedCompany(c)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary hover:text-white text-xs font-bold transition-all border border-white/10"
                        >
                          Manage Company
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

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#17171C] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Register Employer Account</h3>
            <form onSubmit={handleAddCompany} className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="e.g. Nexus Tech Solutions"
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Domain</label>
                <input
                  type="text"
                  required
                  value={newCompany.domain}
                  onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                  placeholder="e.g. nexustech.com"
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Plan Tier</label>
                <select
                  value={newCompany.plan}
                  onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value as Company["plan"] })}
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                >
                  <option value="Enterprise">Enterprise Tier</option>
                  <option value="Pro">Pro Tier</option>
                  <option value="Starter">Starter Tier</option>
                  <option value="Managed Hiring">HireGo Managed Hiring™</option>
                </select>
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
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
