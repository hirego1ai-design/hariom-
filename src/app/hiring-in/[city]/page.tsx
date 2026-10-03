import { notFound, redirect } from "next/navigation";
import { findSeoJobCity } from "@/lib/seoJobCities";

type Props = { params: Promise<{ city: string }> };

export default async function HiringInCityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) notFound();

  redirect(`/jobs?location=${encodeURIComponent(city.name)}`);
}
