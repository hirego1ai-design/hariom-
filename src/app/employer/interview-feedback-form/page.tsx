import { redirect } from "next/navigation";

export default async function LegacyInterviewFeedbackPage({ searchParams }: { searchParams: Promise<{ interviewId?: string; id?: string }> }) {
  const params = await searchParams;
  const interviewId = params.interviewId || params.id;
  redirect(interviewId ? `/employer/final-round-feedback?interviewId=${encodeURIComponent(interviewId)}` : "/employer/dashboard");
}
