"use client";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminRolesPage() {
  return <div className="min-h-screen bg-[#0E0E0E] text-white"><AdminSidebar /><div className="md:pl-[116px] min-h-screen"><AdminHeader title="Roles & Permissions" subtitle="Authorization policy is protected until the persisted role-management API is enabled." /><main className="pt-24 p-6 max-w-3xl mx-auto"><section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6"><h1 className="text-lg font-bold">Role changes are temporarily locked</h1><p className="mt-2 text-sm text-slate-300">The old screen was an employer-only local form and did not persist or audit changes. No role mutation is exposed until the Admin authorization API and audit trail are enabled.</p><Link href="/admin/settings/audit-log" className="inline-flex mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-bold">Open audit log</Link></section></main></div></div>;
}
