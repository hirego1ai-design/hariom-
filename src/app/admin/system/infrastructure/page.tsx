import { redirect } from "next/navigation";

export default function AdminInfrastructureRedirectPage() {
  redirect("/admin/system-health");
}
