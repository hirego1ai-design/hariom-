"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import G07Component from "@/app/settings/integrations/page";

export default function AdminSetting_G07_Page() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <AdminHeader title="API & Integrations Hub (G07)" />
        <main className="flex-1 p-gutter pt-24 pb-12 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <G07Component />
        </main>
      </div>
    </div>
  );
}
