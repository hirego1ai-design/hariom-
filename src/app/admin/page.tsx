"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
