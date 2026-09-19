import { redirect } from "next/navigation";

export default function MockInterviewDnaRedirect() {
  redirect("/ai/mock-interview/setup");
}