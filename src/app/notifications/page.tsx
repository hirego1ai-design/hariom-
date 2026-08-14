"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function NotificationsCenterPage() {
  const [items, setItems] = useState([
    { id: 1, title: "Interview Scheduled!", desc: "Senior Frontend Engineer round confirmed for tomorrow, 3:00 PM.", read: false, time: "10 mins ago" },
    { id: 2, title: "AI Resume Score Updated", desc: "Your resume score increased to 94/100 after adding GraphQL & WebSocket experience.", read: false, time: "2 hours ago" },
    { id: 3, title: "New Job Match: TechLead AI", desc: "Apex AI Labs posted a role matching 98% of your vector skills.", read: true, time: "1 day ago" },
  ]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
              CF02 Module
            </span>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight mt-0.5">
              Notifications Center & Alerts
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
            >
              Mark All Read
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-4 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={`glass-card p-5 rounded-2xl border transition-all flex items-center justify-between ${
                item.read ? "border-white/5 opacity-70" : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-3 h-3 rounded-full ${item.read ? "bg-white/20" : "bg-primary animate-pulse"}`} />
                <div>
                  <h3 className="font-bold text-sm text-white">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
              <span className="text-[11px] text-text-muted font-mono">{item.time}</span>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
