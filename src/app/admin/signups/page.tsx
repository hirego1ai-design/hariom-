"use client";
import React, { useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";

interface SignupRecord {
  id: string;
  name: string;
  email: string;
  platform: "Android" | "iOS" | "Web" | "WhatsApp";
  device: string;
  location: string;
  status: "Verified" | "Pending OTP" | "Dropoff";
  registeredAt: string;
  utmSource: string;
}

const initialSignups: SignupRecord[] = [
  { id: "SGN-10921", name: "Aarav Sharma", email: "aarav.s@gmail.com", platform: "Android", device: "Samsung Galaxy S24", location: "Bengaluru, IN", status: "Verified", registeredAt: "2 mins ago", utmSource: "PlayStore Organic" },
  { id: "SGN-10922", name: "Tanvi Saxena", email: "tanvi.saxena@outlook.com", platform: "iOS", device: "iPhone 15 Pro", location: "Mumbai, IN", status: "Verified", registeredAt: "7 mins ago", utmSource: "App Store Search" },
  { id: "SGN-10923", name: "Rohan Varma", email: "rohan.v@tech.io", platform: "WhatsApp", device: "WhatsApp Business API", location: "Hyderabad, IN", status: "Verified", registeredAt: "14 mins ago", utmSource: "WA Bot Quick-Apply" },
  { id: "SGN-10924", name: "Kavya Menon", email: "kavya.m@yahoo.com", platform: "Web", device: "Chrome / macOS", location: "Delhi NCR, IN", status: "Verified", registeredAt: "22 mins ago", utmSource: "Google Search Ads" },
  { id: "SGN-10925", name: "Siddharth Das", email: "siddharth.d@gmail.com", platform: "Android", device: "OnePlus 12", location: "Pune, IN", status: "Pending OTP", registeredAt: "35 mins ago", utmSource: "College Referral" },
  { id: "SGN-10926", name: "Ananya Iyer", email: "ananya.iyer@icloud.com", platform: "iOS", device: "iPhone 14", location: "Chennai, IN", status: "Verified", registeredAt: "48 mins ago", utmSource: "LinkedIn Campaign" },
  { id: "SGN-10927", name: "Manoj Kumar", email: "manoj.k@live.com", platform: "WhatsApp", device: "WhatsApp Bot v2.4", location: "Kolkata, IN", status: "Verified", registeredAt: "1 hour ago", utmSource: "QR Code Banner" },
  { id: "SGN-10928", name: "Pooja Reddy", email: "pooja.reddy@gmail.com", platform: "Web", device: "Firefox / Windows 11", location: "Ahmedabad, IN", status: "Dropoff", registeredAt: "1 hour ago", utmSource: "Direct Web URL" },
];

export default function AdminSignupsPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("30d");

  const platformStats = {
    Android: { count: 890, pct: "41.5%", icon: "android", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    iOS: { count: 540, pct: "25.2%", icon: "phone_iphone", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    Web: { count: 485, pct: "22.6%", icon: "laptop_chromebook", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    WhatsApp: { count: 230, pct: "10.7%", icon: "chat", color: "text-green", bg: "bg-green/10", border: "border-green/20" },
  };

  const filteredSignups = useMemo(() => {
    return initialSignups.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.utmSource.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (platformFilter !== "All" && s.platform !== platformFilter) return false;
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      return true;
    });
  }, [searchQuery, platformFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="New Signups & Channel Acquisition"
          subtitle="Real-time multi-platform telemetry across Android, iOS, Web, and WhatsApp Bot."
          onSearch={(q) => setSearchQuery(q)}
        />

        <main className="pt-24 p-gutter space-y-stack-lg flex-1 max-w-[1600px] w-full mx-auto">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141418] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-white transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Dashboard
              </Link>
              <span className="text-white/20">|</span>
              <span className="text-xs font-bold text-text-secondary">Total Signups (30D):</span>
              <span className="text-sm font-extrabold text-white">2,145 Users</span>
            </div>

            <div className="flex items-center gap-2">
              {["7d", "30d", "90d"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeRange === t ? "bg-primary text-white" : "bg-white/5 text-text-muted hover:text-white"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Multi-Platform Channels Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Android */}
            <div
              onClick={() => setPlatformFilter(platformFilter === "Android" ? "All" : "Android")}
              className={`glass-card p-5 rounded-2xl border cursor-pointer transition-all ${
                platformFilter === "Android" ? "border-emerald-400 shadow-lg shadow-emerald-500/10" : "border-white/10 hover:border-emerald-500/40"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined text-[24px]">android</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-data-md">
                  {platformStats.Android.pct}
                </span>
              </div>
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Android App Signups</p>
              <h3 className="font-bold text-3xl text-white mt-1">890</h3>
              <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5">
                <span className="text-green font-bold">96.2%</span> OTP Verified • APK / Play Store
              </p>
            </div>

            {/* iOS */}
            <div
              onClick={() => setPlatformFilter(platformFilter === "iOS" ? "All" : "iOS")}
              className={`glass-card p-5 rounded-2xl border cursor-pointer transition-all ${
                platformFilter === "iOS" ? "border-blue-400 shadow-lg shadow-blue-500/10" : "border-white/10 hover:border-blue-500/40"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined text-[24px]">phone_iphone</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-data-md">
                  {platformStats.iOS.pct}
                </span>
              </div>
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">iOS App Signups</p>
              <h3 className="font-bold text-3xl text-white mt-1">540</h3>
              <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5">
                <span className="text-green font-bold">98.1%</span> Apple Sign-In / Passkey
              </p>
            </div>

            {/* Web */}
            <div
              onClick={() => setPlatformFilter(platformFilter === "Web" ? "All" : "Web")}
              className={`glass-card p-5 rounded-2xl border cursor-pointer transition-all ${
                platformFilter === "Web" ? "border-primary shadow-lg shadow-primary/10" : "border-white/10 hover:border-primary/40"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">laptop_chromebook</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary/20 text-primary font-data-md">
                  {platformStats.Web.pct}
                </span>
              </div>
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Web Browser Portal</p>
              <h3 className="font-bold text-3xl text-white mt-1">485</h3>
              <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5">
                <span className="text-primary font-bold">91.4%</span> Google OAuth & Email OTP
              </p>
            </div>

            {/* WhatsApp */}
            <div
              onClick={() => setPlatformFilter(platformFilter === "WhatsApp" ? "All" : "WhatsApp")}
              className={`glass-card p-5 rounded-2xl border cursor-pointer transition-all ${
                platformFilter === "WhatsApp" ? "border-green shadow-lg shadow-green/10" : "border-white/10 hover:border-green/40"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-green/10 border border-green/20 flex items-center justify-center text-green">
                  <span className="material-symbols-outlined text-[24px]">chat</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-green/20 text-green font-data-md">
                  {platformStats.WhatsApp.pct}
                </span>
              </div>
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">WhatsApp Bot Conversational</p>
              <h3 className="font-bold text-3xl text-green mt-1">230</h3>
              <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5">
                <span className="text-green font-bold">99.5%</span> 1-Click WhatsApp Verified
              </p>
            </div>
          </div>

          {/* Platform Distribution Visualizer */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-base text-white">Platform Acquisition Mix</h4>
                <p className="text-text-muted text-xs">Breakdown of candidate user onboarding channels</p>
              </div>
              <span className="text-xs font-bold text-primary font-data-md">2,145 Total New Users</span>
            </div>

            {/* Multi-color Bar */}
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div style={{ width: "41.5%" }} className="h-full bg-emerald-500" title="Android: 41.5%" />
              <div style={{ width: "25.2%" }} className="h-full bg-blue-500" title="iOS: 25.2%" />
              <div style={{ width: "22.6%" }} className="h-full bg-primary" title="Web: 22.6%" />
              <div style={{ width: "10.7%" }} className="h-full bg-green" title="WhatsApp: 10.7%" />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-text-secondary font-bold">Android (41.5% • 890)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-text-secondary font-bold">iOS (25.2% • 540)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-primary" />
                <span className="text-text-secondary font-bold">Web Browser (22.6% • 485)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-green" />
                <span className="text-text-secondary font-bold">WhatsApp Bot (10.7% • 230)</span>
              </div>
            </div>
          </div>

          {/* Recent Signups Ledger */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white/5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">person_add</span>
                  Recent Signup Telemetry Stream ({filteredSignups.length})
                </h3>
                {platformFilter !== "All" && (
                  <button
                    onClick={() => setPlatformFilter("All")}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white flex items-center gap-1"
                  >
                    {platformFilter} ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(["All", "Verified", "Pending OTP", "Dropoff"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === st ? "bg-white/20 text-white" : "text-text-muted hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary">
                <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4 text-center">Acquisition Platform</th>
                    <th className="p-4">Device / Client</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">UTM Campaign / Referral</th>
                    <th className="p-4 text-center">Verification Status</th>
                    <th className="p-4 text-right">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSignups.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-[11px] text-text-muted">{s.email}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${
                            s.platform === "Android"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : s.platform === "iOS"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                              : s.platform === "Web"
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-green/10 border-green/30 text-green"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {s.platform === "Android" ? "android" : s.platform === "iOS" ? "phone_iphone" : s.platform === "Web" ? "laptop" : "chat"}
                          </span>
                          {s.platform}
                        </span>
                      </td>
                      <td className="p-4 text-white font-medium">{s.device}</td>
                      <td className="p-4 text-text-muted">{s.location}</td>
                      <td className="p-4 text-secondary font-medium">{s.utmSource}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                            s.status === "Verified"
                              ? "bg-green/10 border-green/30 text-green"
                              : s.status === "Pending OTP"
                              ? "bg-yellow/10 border-yellow/30 text-yellow"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-data-md text-text-muted">{s.registeredAt}</td>
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
