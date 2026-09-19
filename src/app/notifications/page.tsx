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
  const [invitations, setInvitations] = useState<Array<{id:string;status:string;invitedAt:string|null;job:{id:string;title:string;location:string|null;company:{name:string}}}>>([]);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

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
    fetch("/api/candidate/sourcing-invitations", { cache: "no-store" }).then(async (response) => {
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load invitations."); return body;
    }).then((body) => setInvitations(body.invitations || [])).catch(() => undefined);
  }, []);

  const decideInvitation = async (id: string, decision: "ACCEPT" | "DECLINE") => {
    if (decisionId) return; setDecisionId(id); setActionError("");
    try {
      const response = await fetch(`/api/candidate/sourcing-invitations/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to save your decision.");
      setInvitations((current) => current.map((item) => item.id === id ? { ...item, status: body.status } : item));
    } catch (error) { setActionError(error instanceof Error ? error.message : "Unable to save your decision."); }
    finally { setDecisionId(null); }
  };

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
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 bg-bg-page backdrop-blur-xl border-b border-outline flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Notifications & Alerts
            </h1>
            <p className="text-text-muted text-xs">Real-time alerts for applications, matches, and interviews.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              disabled={loading || items.length === 0 || items.every((item) => item.isRead)}
              className="min-h-11 px-4 py-2 rounded-full bg-surface-container-high hover:opacity-90 text-text-primary text-xs font-bold transition-all border border-outline disabled:opacity-50"
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
          {invitations.length > 0 && <section aria-labelledby="job-invitations-heading" className="rounded-3xl border border-outline bg-bg-card p-5 space-y-4">
            <div><h2 id="job-invitations-heading" className="font-bold">Job invitations</h2><p className="text-xs text-text-secondary mt-1">An invitation is not an application until you choose Accept.</p></div>
            {actionError && <p role="alert" className="text-sm text-text-secondary">{actionError}</p>}
            {invitations.map((invitation) => <article key={invitation.id} className="rounded-2xl border border-outline bg-bg-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div><h3 className="font-bold text-sm">{invitation.job.title}</h3><p className="text-xs text-text-secondary mt-1">{invitation.job.company.name}{invitation.job.location ? ` · ${invitation.job.location}` : ""}</p><Link href={`/jobs/${invitation.job.id}`} className="inline-block mt-2 text-xs underline">Review job details</Link></div>
              {invitation.status === "INVITED" ? <div className="flex gap-2"><button disabled={decisionId === invitation.id} onClick={() => decideInvitation(invitation.id, "DECLINE")} className="min-h-11 px-4 rounded-full border border-outline font-bold text-xs disabled:opacity-50">Decline</button><button disabled={decisionId === invitation.id} onClick={() => decideInvitation(invitation.id, "ACCEPT")} className="min-h-11 px-4 rounded-full btn-3d-red font-bold text-xs disabled:opacity-50">{decisionId === invitation.id ? "Saving…" : "Accept"}</button></div> : <span className="text-xs font-bold">{invitation.status === "ACCEPTED" ? "Accepted · Application created" : "Declined"}</span>}
            </article>)}
          </section>}
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
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Date unavailable"}
                </span>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
