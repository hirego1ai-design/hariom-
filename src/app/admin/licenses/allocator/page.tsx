import { redirect } from "next/navigation";

export default function RetiredRoute() {
  redirect("/admin/subscriptions");
}
