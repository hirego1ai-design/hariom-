import { redirect } from "next/navigation";

export default function SystemAuditLogPage() {
  redirect("/admin/settings/audit-log");
}
