import { redirect } from "next/navigation";

export default async function JobAiInsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/jobs/${encodeURIComponent(id)}`);
}
