"use client";

import React, { useState } from "react";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import Link from "next/link";

export default function EmployerPageE10() {
  const [companyName, setCompanyName] = useState("HireGo AI");
  const [industry, setIndustry] = useState("Technology & AI");
  const [about, setAbout] = useState(
    "HireGo AI is revolutionizing the talent acquisition landscape with cutting-edge neural matching. We believe in high-trust connections between global enterprises and top-tier talent."
  );
  const [companySize, setCompanySize] = useState("500-1000 Employees");
  const [website, setWebsite] = useState("https://hirego.ai");
  const [foundedYear, setFoundedYear] = useState("2022");
  const [hqLocation, setHqLocation] = useState("San Francisco, CA");
  const [taxNumber, setTaxNumber] = useState("22AAAAA0000A1Z5");
  const [healthInsurance, setHealthInsurance] = useState(true);
  const [unlimitedPto, setUnlimitedPto] = useState(true);
  const [gymMembership, setGymMembership] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = () => {
    setToast("Company Profile updated successfully!");
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      {/* Floating Rail Navigation */}
      <EmployerSidebar />

      {/* Main Workspace Canvas */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs">
            {toast}
          </div>
        )}

        {/* Fixed Header */}
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
              Company Profile Editor
            </h1>
            <p className="text-text-muted text-xs">Manage enterprise branding, culture tags, and public profile details.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/employer/company-reviews-management"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">reviews</span>
              Reviews
            </Link>
            <Link
              href="/employer/employer-company-settings-hub"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              Settings
            </Link>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/30 hover:scale-105 transition-all"
            >
              Save Profile
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-gutter pt-24 pb-20 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {/* Basic Information Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Left Column: Core Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#141418]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-[#141418] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      <option value="Technology & AI">Technology & AI</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">About Company</label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-primary/50 resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Company Size</label>
                    <input
                      type="text"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Website URL</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Founded Year</label>
                    <input
                      type="text"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Legal & Culture */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#141418]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Legal & HQ Location</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">HQ Location</label>
                  <input
                    type="text"
                    value={hqLocation}
                    onChange={(e) => setHqLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">GST / Tax Identification</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#141418]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Benefits & Perks</h3>
                
                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <span className="text-white font-medium">Premium Health Insurance</span>
                    <input
                      type="checkbox"
                      checked={healthInsurance}
                      onChange={(e) => setHealthInsurance(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-black/40"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <span className="text-white font-medium">Unlimited PTO</span>
                    <input
                      type="checkbox"
                      checked={unlimitedPto}
                      onChange={(e) => setUnlimitedPto(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-black/40"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <span className="text-white font-medium">Gym & Wellness Stipend</span>
                    <input
                      type="checkbox"
                      checked={gymMembership}
                      onChange={(e) => setGymMembership(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-black/40"
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
