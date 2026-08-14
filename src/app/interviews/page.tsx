"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function CandidateInterviewsPage() {
  const [selectedMonth, setSelectedMonth] = useState("October 2024");
  const [activeView, setActiveView] = useState<"month" | "week">("month");
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);

  const interviewEvents = [
    {
      id: 1,
      candidate: "Rahul Verma (You)",
      role: "Senior UX / Fullstack Engineer",
      company: "TechCorp Global",
      type: "Technical Round",
      date: "Oct 15, 2024",
      time: "16:00 - 17:30 IST",
      badgeColor: "bg-[#4285F4]/20 text-[#4285F4] border-[#4285F4]/30",
    },
    {
      id: 2,
      candidate: "Rahul Verma (You)",
      role: "Lead Interface Architect",
      company: "Apex AI Labs",
      type: "Cultural Fit Round",
      date: "Oct 18, 2024",
      time: "11:00 - 12:00 IST",
      badgeColor: "bg-gold-payment/20 text-gold-payment border-gold-payment/30",
    },
    {
      id: 3,
      candidate: "Rahul Verma (You)",
      role: "Staff Frontend Engineer",
      company: "Stripe",
      type: "Final Management Round",
      date: "Oct 22, 2024",
      time: "14:30 - 15:30 IST",
      badgeColor: "bg-primary/20 text-primary border-primary/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        
        {/* Header Bar */}
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
                Scheduled Interviews & Calendar
              </h1>
              <p className="text-text-muted text-xs">Manage upcoming AI mock rounds and real-world company interview invitations.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ai/mock-interview/active"
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              Start Live AI Mock Interview
            </Link>

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Calendar & Interview List Canvas */}
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          
          {/* Calendar Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141418] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveView("month")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeView === "month" ? "bg-primary text-white" : "text-text-muted hover:text-white"
                  }`}
                >
                  Month View
                </button>
                <button
                  onClick={() => setActiveView("week")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeView === "week" ? "bg-primary text-white" : "text-text-muted hover:text-white"
                  }`}
                >
                  Week View
                </button>
              </div>

              <div className="flex items-center gap-2 pl-2">
                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-white font-display-md">{selectedMonth}</span>
                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">Proctor Status:</span>
              <span className="px-2.5 py-1 rounded-full bg-green/20 text-green font-bold text-[10px] border border-green/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                AI Proctor Active
              </span>
            </div>
          </div>

          {/* Grid Layout: Calendar View & Interview List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Calendar Table Grid */}
            <div className="lg:col-span-8 glass-card rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="grid grid-cols-7 border-b border-white/10 pb-3 text-center text-xs font-bold uppercase tracking-wider text-text-muted">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Simplified Interactive Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-xs min-h-[360px]">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const hasInterview = day === 15 || day === 18 || day === 22;
                  const isToday = day === 15;
                  return (
                    <div
                      key={day}
                      className={`p-2.5 rounded-xl border transition-all min-h-[70px] flex flex-col justify-between ${
                        isToday
                          ? "bg-primary/10 border-primary/40 text-white"
                          : hasInterview
                          ? "bg-white/5 border-white/10 text-white hover:border-primary/40 cursor-pointer"
                          : "bg-white/[0.02] border-white/5 text-text-muted hover:bg-white/5"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-mono font-bold ${isToday ? "text-primary text-sm" : ""}`}>{day}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white">TODAY</span>
                        )}
                      </div>

                      {hasInterview && (
                        <div className="mt-1 p-1 rounded bg-primary/20 text-primary font-bold text-[9px] truncate border border-primary/30">
                          Interview Round
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Interview Cards */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center justify-between">
                <span>Upcoming Scheduled Rounds</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                  {interviewEvents.length} Rounds
                </span>
              </h3>

              <div className="space-y-3">
                {interviewEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="glass-card p-4 rounded-2xl border border-white/10 hover:border-primary/40 transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${evt.badgeColor}`}>
                          {evt.type}
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1.5">{evt.role}</h4>
                        <p className="text-xs text-text-muted">{evt.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-text-muted">
                      <span className="flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
                        {evt.date}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-[14px] text-green">schedule</span>
                        {evt.time}
                      </span>
                    </div>

                    <Link
                      href="/ai/mock-interview/active"
                      className="block w-full py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold text-center transition-all shadow-md"
                    >
                      Enter Room & Start Round →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
