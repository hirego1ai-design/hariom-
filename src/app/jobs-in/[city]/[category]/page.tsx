import { notFound, redirect } from "next/navigation";
import { findSeoJobCity } from "@/lib/seoJobCities";
import { categoriesForCity, findSeoJobCategory } from "@/lib/seoJobCategories";

type Props = { params: Promise<{ city: string; category: string }> };

export default async function JobsInCityCategoryPage({ params }: Props) {
  const { city: citySlug, category: categorySlug } = await params;
  const city = findSeoJobCity(citySlug);
  const category = findSeoJobCategory(categorySlug);

  if (!city || !category || !categoriesForCity(city.slug).some((item) => item.slug === category.slug)) {
    notFound();
  }

  const paramsOut = new URLSearchParams({
    location: city.name,
    q: category.name,
  });
  redirect(`/jobs?${paramsOut.toString()}`);
}
