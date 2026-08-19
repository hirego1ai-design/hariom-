"use client";

import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

const sections = [
  {
    title: "People & Marketplace",
    description: "Manage the users, companies, jobs, and verification queues that power HireGo.",
    items: [
      ["Candidates", "/admin/users", "group"],
      ["Employers", "/admin/employers", "domain"],
      ["Job Listings", "/admin/jobs", "work"],
      ["New Signups", "/admin/signups", "person_add"],
      ["KYC Review", "/admin/document-verification", "verified_user"],
      ["Roles & Permissions", "/admin/roles", "admin_panel_settings"],
    ],
  },
  {
    title: "Managed Hiring",
    description: "Operate end-to-end hiring requests, pipelines, agreements, and fulfilment.",
    items: [
      ["Hiring Requests", "/admin/managed-hiring/requests", "assignment"],
      ["Hiring Pipeline", "/admin/managed-hiring/pipeline", "account_tree"],
      ["Operations", "/admin/managed-hiring/operations", "business_center"],
      ["Agreement Templates", "/admin/agreements/templates", "description"],
      ["Agreement Builder", "/admin/agreements/builder", "edit_document"],
      ["Managed Hiring Settings", "/admin/settings/managed-hiring", "tune"],
    ],
  },
  {
    title: "Revenue & Commercial",
    description: "Control plans, pricing, invoices, payments, and referral operations.",
    items: [
      ["Revenue", "/admin/revenue", "payments"],
      ["Invoices", "/admin/invoices", "receipt_long"],
      ["Subscriptions", "/admin/subscriptions", "autorenew"],
      ["Plan Management", "/admin/settings/plan-management", "inventory_2"],
      ["Pricing Engine", "/admin/pricing-engine", "sell"],
      ["Payment Gateways", "/admin/payment-gateways", "account_balance"],
      ["Referrals", "/admin/referrals", "share"],
    ],
  },
  {
    title: "Platform Operations",
    description: "Monitor platform health, AI systems, infrastructure, security, and audit history.",
    items: [
      ["System Health", "/admin/system-health", "monitoring"],
      ["AI Command Centre", "/admin/ai-command-centre-dashboard", "smart_toy"],
      ["Proctoring Control", "/admin/proctoring-control-panel", "security"],
      ["Infrastructure", "/admin/system/infrastructure", "router"],
      ["Backup & Recovery", "/admin/system/backup-recovery", "cloud_download"],
      ["Security Inspector", "/admin/security/vulnerability-inspector", "bug_report"],
      ["Audit Logs", "/admin/settings/audit-log", "history"],
      ["Admin Settings", "/admin/settings/hub", "settings"],
    ],
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <AdminHeader title="Admin Control Centre" subtitle="All production administration tools in one place" />
      <main className="ml-[116px] px-6 pb-12 pt-28 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1C1C23] to-[#111116] p-7 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">HireGo AI Administration</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Platform operations dashboard</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/60">Choose a workspace below. Access is protected by the signed administrator session and every admin API is role checked.</p>
              </div>
              <Link href="/admin/system-health" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-extrabold text-white shadow-lg transition hover:brightness-110">
                <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
                Check system health
              </Link>
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.title}>
              <div className="mb-4">
                <h3 className="text-xl font-extrabold">{section.title}</h3>
                <p className="mt-1 text-xs text-white/50">{section.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.items.map(([label, href, icon]) => (
                  <Link key={href} href={href} className="group flex min-h-24 items-center gap-4 rounded-[22px] border border-white/10 bg-[#17171C] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-primary/50 hover:bg-[#1D1D24]">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner transition group-hover:bg-primary group-hover:text-white">
                      <span className="material-symbols-outlined">{icon}</span>
                    </span>
                    <span className="flex-1 text-sm font-bold">{label}</span>
                    <span className="material-symbols-outlined text-white/30 transition group-hover:translate-x-1 group-hover:text-primary">arrow_forward</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
