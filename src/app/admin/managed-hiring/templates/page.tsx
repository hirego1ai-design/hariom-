import { redirect } from "next/navigation";

export default function ManagedHiringTemplatesRedirect() {
  redirect("/admin/agreements/templates");
}
