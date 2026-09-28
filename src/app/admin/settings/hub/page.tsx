"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import G01Component from "@/app/settings/hub/page";

export default function AdminSetting_G01_Page() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[116px]">
        <AdminHeader title="Platform Settings Hub (G01)" />
        <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-y-auto p-4 pt-24 pb-12 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <G01Component />
        </main>
      </div>
    </div>
  );
}
