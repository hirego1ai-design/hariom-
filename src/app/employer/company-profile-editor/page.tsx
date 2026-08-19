"use client";

import React, { useState, useEffect } from "react";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import Link from "next/link";

export default function EmployerCompanyProfileEditorPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology & AI");
  const [about, setAbout] = useState("");
  const [companySize, setCompanySize] = useState("50-200 Employees");
  const [website, setWebsite] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [healthInsurance, setHealthInsurance] = useState(true);
  const [unlimitedPto, setUnlimitedPto] = useState(true);
  const [gymMembership, setGymMembership] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/employer/company")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.company) {
          setCompanyName(data.company.name || "");
          setIndustry(data.company.industry || "Technology & AI");
          setAbout(data.company.description || "");
          setCompanySize(data.company.size || "50-200 Employees");
          setWebsite(data.company.website || "");
          setHqLocation(data.company.location || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employer/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          industry,
          description: about,
          size: companySize,
          website,
          location: hqLocation,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToast("Company Profile updated successfully!");
      } else {
        setToast("Failed to save changes.");
      }
    } catch {
      setToast("Failed to save changes.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <EmployerSidebar />

      <div className="flex-1 ml-[100px] lg:ml-[116px] flex flex-col min-w-0 min-h-screen">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{toast}</span>
          </div>
        )}

        <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Company Profile Editor
            </h1>
            <p className="text-text-muted text-xs">Manage enterprise branding and verified profile details.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn-3d-red px-6 py-2.5 rounded-full text-white font-bold text-xs shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-6xl w-full mx-auto overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4 bg-[#141418]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="input-pill w-full h-11 px-4 text-xs text-white"
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="input-pill w-full h-11 px-4 text-xs text-white cursor-pointer"
                    >
                      <option value="Technology & AI" className="bg-[#141418]">Technology & AI</option>
                      <option value="Financial Services" className="bg-[#141418]">Financial Services</option>
                      <option value="Healthcare & Biotech" className="bg-[#141418]">Healthcare & Biotech</option>
                      <option value="E-Commerce & Retail" className="bg-[#141418]">E-Commerce & Retail</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    About Company
                  </label>
                  <textarea
                    rows={4}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white focus:border-primary outline-none resize-none leading-relaxed"
                    placeholder="Tell prospective candidates about your mission, culture, and achievements..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Company Size
                    </label>
                    <input
                      type="text"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="input-pill w-full h-11 px-4 text-xs text-white"
                      placeholder="e.g. 50-200 Employees"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="input-pill w-full h-11 px-4 text-xs text-white"
                      placeholder="https://company.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 bg-[#141418]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">
                  Location & Operations
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    HQ Location
                  </label>
                  <input
                    type="text"
                    value={hqLocation}
                    onChange={(e) => setHqLocation(e.target.value)}
                    className="input-pill w-full h-11 px-4 text-xs text-white"
                    placeholder="e.g. San Francisco, CA / Bangalore"
                  />
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 bg-[#141418]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">
                  Perks & Benefits Offered
                </h3>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
                    <span className="text-white font-medium">Full Health Cover</span>
                    <input
                      type="checkbox"
                      checked={healthInsurance}
                      onChange={(e) => setHealthInsurance(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
                    <span className="text-white font-medium">Unlimited PTO</span>
                    <input
                      type="checkbox"
                      checked={unlimitedPto}
                      onChange={(e) => setUnlimitedPto(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
                    <span className="text-white font-medium">Remote Stipend</span>
                    <input
                      type="checkbox"
                      checked={gymMembership}
                      onChange={(e) => setGymMembership(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
