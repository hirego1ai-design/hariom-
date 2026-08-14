"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import EmployerPageE49 from "@/app/employer/revenue-and-billing-management/page";

import { AppProviders } from "@/providers";

export default function AdminRevenuePage() {
  return (
    <AppProviders>
      <EmployerPageE49 />
    </AppProviders>
  );
}
