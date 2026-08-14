"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

const metrics = [
  { label: "Applications", value: "1,240", delta: "+18%", icon: "group", tone: "text-emerald-400", bar: "w-[82%]" },
  { label: "Time to Hire", value: "18d", delta: "-12%", icon: "timer", tone: "text-emerald-400", bar: "w-[70%]" },
  { label: "Cost per Hire", value: "Rs. 7,200", delta: "24% lower", icon: "payments", tone: "text-yellow", bar: "w-[58%]" },
  { label: "Offer Acceptance", value: "87%", delta: "+5%", icon: "verified", tone: "text-sky-400", bar: "w-[87%]" },
];

const funnel = [
  { stage: "Applied", count: 1240, height: "h-[220px]" },
  { stage: "Screened", count: 512, height: "h-[152px]" },
  { stage: "Interview", count: 186, height: "h-[104px]" },
  { stage: "Offer", count: 42, height: "h-[58px]" },
  { stage: "Hired", count: 36, height: "h-[48px]" },
];

const departments = [
  { name: "Engineering", icon: "code", time: "24 days", cost: "Rs. 12,400", conversion: "12.4%", trend: "trending_up", tone: "text-emerald-400" },
  { name: "Design", icon: "brush", time: "16 days", cost: "Rs. 6,800", conversion: "8.2%", trend: "trending_up", tone: "text-emerald-400" },
  { name: "Marketing", icon: "store", time: "14 days", cost: "Rs. 4,200", conversion: "18.5%", trend: "trending_down", tone: "text-red-400" },
];

export default function EmployerAnalyticsDashboard() {
  const [range, setRange] = useState("30");

  return (
    <PageContainer>
      <PageHeader 
        title="Recruiting Performance Dashboard" 
        subtitle="Track funnel efficiency, hiring velocity, spend, and department performance from one employer workspace."
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="h-10 px-3 rounded-xl bg-bg-elevated border border-white/10 text-sm text-text-primary outline-none focus:border-secondary"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Link href="/employer/job-listings-management" className="h-10 px-4 rounded-xl bg-secondary text-white text-sm font-bold inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">work</span>
            View Jobs
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[20px] border border-white/10 bg-[#121215] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">{metric.label}</p>
                <p className="text-3xl font-extrabold text-white mt-2">{metric.value}</p>
              </div>
              <span className={`material-symbols-outlined text-2xl ${metric.tone}`}>{metric.icon}</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className={`font-bold ${metric.tone}`}>{metric.delta}</span>
              <span className="text-text-muted">vs previous period</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full bg-secondary ${metric.bar}`} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 rounded-[20px] border border-white/10 bg-[#121215] p-5 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-white">Hiring Funnel Efficiency</h2>
              <p className="text-xs text-text-muted mt-1">Where candidates move, stall, and convert.</p>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1">All departments</span>
          </div>
          <div className="min-h-[280px] flex items-end justify-between gap-3 overflow-x-auto pb-2">
            {funnel.map((item) => (
              <div key={item.stage} className="min-w-[96px] flex-1 flex flex-col items-center gap-3">
                <span className="text-xs text-text-secondary font-bold">{item.count.toLocaleString()}</span>
                <div className={`w-full max-w-[120px] ${item.height} rounded-t-2xl bg-gradient-to-t from-secondary to-sky-300 shadow-[0_0_22px_rgba(68,138,255,0.22)]`} />
                <span className="text-xs text-text-muted font-semibold text-center">{item.stage}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 rounded-[20px] border border-white/10 bg-[#121215] p-5 shadow-xl">
          <h2 className="text-lg font-extrabold text-white">Source Breakdown</h2>
          <div className="relative flex items-center justify-center py-8">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#448AFF" strokeDasharray="113 251" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#26A69A" strokeDasharray="80 251" strokeDashoffset="-113" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#FFCA28" strokeDasharray="58 251" strokeDashoffset="-193" strokeWidth="12" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white">1,240</span>
              <span className="text-[10px] text-text-muted uppercase font-bold">Total apps</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ["LinkedIn", "45%", "bg-secondary"],
              ["Indeed", "32%", "bg-emerald-400"],
              ["Referrals", "23%", "bg-yellow"],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-text-secondary font-semibold">{label}</span>
                </div>
                <span className="text-white font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-white/10 bg-[#121215] p-5 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-lg font-extrabold text-white">Time to Hire Trend</h2>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-2"><i className="w-4 h-0.5 bg-secondary" /> Company avg.</span>
            <span className="inline-flex items-center gap-2"><i className="w-4 h-0.5 border-t border-dashed border-white/30" /> Industry benchmark</span>
          </div>
        </div>
        <div className="h-[240px] relative">
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-text-muted">
            <span>30d</span><span>25d</span><span>20d</span><span>15d</span><span>10d</span>
          </div>
          <div className="ml-9 h-full border-l border-b border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 grid grid-rows-4">
              {Array.from({ length: 4 }).map((_, index) => <span key={index} className="border-t border-white/5" />)}
            </div>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <polyline fill="none" points="0,180 150,160 300,120 450,140 600,100 750,90 1000,80" stroke="#448AFF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="absolute top-1/2 w-full border-t border-dashed border-white/15" />
          </div>
          <div className="ml-9 flex justify-between mt-3 text-[10px] text-text-muted font-bold">
            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-white/10 bg-[#121215] p-5 shadow-xl">
        <h2 className="text-lg font-extrabold text-white mb-5">Department Efficiency</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text-muted">
                <th className="py-3 font-bold">Department</th>
                <th className="py-3 text-right font-bold">Avg. Time to Hire</th>
                <th className="py-3 text-right font-bold">Cost/Hire</th>
                <th className="py-3 text-right font-bold">Conversion</th>
                <th className="py-3 text-right font-bold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {departments.map((dept) => (
                <tr key={dept.name} className="hover:bg-white/[0.03]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">{dept.icon}</span>
                      </span>
                      <span className="font-bold text-white">{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-text-secondary">{dept.time}</td>
                  <td className="py-4 text-right text-text-secondary">{dept.cost}</td>
                  <td className="py-4 text-right text-text-secondary">{dept.conversion}</td>
                  <td className="py-4 text-right">
                    <span className={`material-symbols-outlined text-[18px] ${dept.tone}`}>{dept.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}
