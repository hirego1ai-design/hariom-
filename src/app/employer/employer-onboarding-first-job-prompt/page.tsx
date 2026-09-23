import { redirect } from "next/navigation";

export default function LegacyEmployerRoute() {
  redirect("/employer/create-job-basic-info");
}
