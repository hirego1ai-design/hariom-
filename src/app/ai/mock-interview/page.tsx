import { redirect } from "next/navigation";

export default async function MockInterviewIndexPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  
  if (resolvedParams && Object.keys(resolvedParams).length > 0) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else if (value !== undefined) {
        query.set(key, value);
      }
    }
    const queryString = query.toString();
    redirect(queryString ? `/ai/mock-interview/setup?${queryString}` : "/ai/mock-interview/setup");
  }

  redirect("/ai/mock-interview/setup");
}
