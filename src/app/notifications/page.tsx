"use client";
import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
}

export default function NotificationsCenterPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success && data.notifications) {
        setItems(data.notifications);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      // Ignore
    }
  };

  const markItemRead = async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[100px] lg:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Notifications & Alerts
            </h1>
            <p className="text-text-muted text-xs">Real-time alerts for applications, matches, and interviews.</p>
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
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 space-y-4 max-w-4xl w-full mx-auto overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl border border-white/10 p-8">
              <span className="material-symbols-outlined text-4xl text-text-muted mb-2">
                notifications_none
              </span>
              <p className="text-xs text-text-secondary">No notifications found.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => markItemRead(item.id)}
                className={`glass-card p-5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  item.isRead
                    ? "border-white/5 opacity-70 bg-white/5"
                    : "border-primary/40 bg-primary/5 hover:border-primary"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      item.isRead ? "bg-white/20" : "bg-primary animate-pulse"
                    }`}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{item.message}</p>
                  </div>
                </div>
                <span className="text-[11px] text-text-muted font-mono flex-shrink-0 ml-4">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Today"}
                </span>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
