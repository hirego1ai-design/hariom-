import { redirect } from "next/navigation";

export default function WelcomeOnboardingPage() {
  redirect("/onboarding/role-select");
}
