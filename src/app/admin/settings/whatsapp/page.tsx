"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import G05Component from "@/app/settings/whatsapp/page";

export default function AdminSetting_G05_Page() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <AdminHeader title="WhatsApp API Setup (G05)" />
        <main className="flex-1 p-gutter pt-24 pb-12 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <G05Component />
        </main>
      </div>
    </div>
  );
}
