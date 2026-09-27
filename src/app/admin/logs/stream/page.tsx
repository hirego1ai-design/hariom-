import { redirect } from "next/navigation";

export default function RetiredRoute() {
  redirect("/admin/settings/audit-log");
}
