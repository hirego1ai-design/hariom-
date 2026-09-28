import { redirect } from "next/navigation";

export default async function ManagedHiringAgreementBuilderRedirect({
  searchParams,
}: {
  searchParams: Promise<{ reqId?: string }>;
}) {
  const { reqId } = await searchParams;
  redirect(reqId ? `/admin/agreements/builder?reqId=${encodeURIComponent(reqId)}` : "/admin/agreements/builder");
}
