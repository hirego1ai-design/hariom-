import { redirect } from "next/navigation";

export default async function VideoAssessmentSetupPage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  const { jobId } = await searchParams;
  redirect(jobId ? `/video-assessment/active?jobId=${encodeURIComponent(jobId)}` : "/video-assessment/active");
}
