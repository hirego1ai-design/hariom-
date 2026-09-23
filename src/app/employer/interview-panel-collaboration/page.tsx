import { redirect } from "next/navigation";

export default function LegacyEmployerRoute() {
  redirect("/employer/upcoming-interviews-list");
}
