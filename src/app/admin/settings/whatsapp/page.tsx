"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminWhatsappSettingsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] min-w-0">
        <AdminHeader title="WhatsApp Messaging Configuration" />
        <main className="pt-24 p-gutter max-w-4xl mx-auto">
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
            <h1 className="text-xl font-bold text-white">Provider configuration is server-managed</h1>
            <p className="mt-3 text-sm text-text-secondary">
              WhatsApp webhook/auth processing exists server-side, but no audited Admin provider-configuration API is exposed to this UI.
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Provider credentials, webhook secrets, phone-number identifiers, and connection state are therefore not displayed or editable here.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
