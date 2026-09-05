import { redirect } from "next/navigation";

export default function AdminRevenuePage() {
  // The previous implementation rendered an employer-only billing screen
  // under an admin URL. That exposed the wrong data contract and bypassed the
  // Admin shell. Invoice Operations is the persisted admin billing surface;
  // keep this legacy URL as a safe compatibility redirect.
  redirect("/admin/invoices");
}
