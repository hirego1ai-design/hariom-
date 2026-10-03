import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import EditorialArticle from "@/components/marketing/EditorialArticle";
import { prisma } from "@/lib/prisma";
import { effectivePublishedWhere, editorialPublicPath } from "@/lib/contentCms";

export const revalidate = 300;

function clampSeoDescription(value?: string | null) {
  const text = value?.trim();
  if (!text) return undefined;
  if (text.length <= 155) return text;
  const shortened = text.slice(0, 152).replace(/\\s+\\S*$/, "").trim();
  return `${shortened || text.slice(0, 152).trim()}...`;
}

async function getRelease(slug: string) {
  return prisma.editorialContent.findFirst({
    where: { AND: [{ slug, type: "PRESS_RELEASE" }, effectivePublishedWhere(new Date(), "PRESS_RELEASE")] },
    include: { author: { select: { name: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getRelease(slug);
  if (!item) return { title: "Press release not found — HireGo AI", robots: { index: false, follow: false } };
  const path = editorialPublicPath(item.type, item.slug);
  const canonical = `https://www.hiregoai.com${path}`;
  const description = clampSeoDescription(item.seoDescription || item.excerpt);
  const imageId = item.ogImageFileId || item.featuredImageFileId;
  const images = imageId ? [{ url: `https://www.hiregoai.com/api/content/media/${imageId}`, alt: item.featuredImageAlt || item.title }] : undefined;
  return {
    title: item.seoTitle || item.title,
    description,
    alternates: { canonical },
    openGraph: { type: "article", siteName: "HireGo AI", title: item.seoTitle || item.title, description, url: canonical, images },
    twitter: { card: "summary_large_image", title: item.seoTitle || item.title, description, images: imageId ? [`https://www.hiregoai.com/api/content/media/${imageId}`] : undefined },
  };
}

export default async function PressReleaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getRelease(slug);
  if (!item) notFound();
  const published = item.publishedAt || item.scheduledAt || item.createdAt;
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: clampSeoDescription(item.seoDescription || item.excerpt),
    datePublished: published.toISOString(),
    dateModified: item.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "HireGo AI", url: "https://www.hiregoai.com" },
    publisher: {
      "@type": "Organization",
      name: "HireGo AI",
      url: "https://www.hiregoai.com",
      logo: { "@type": "ImageObject", url: "https://www.hiregoai.com/marketing/hirego-logo.png" },
    },
    mainEntityOfPage: `https://www.hiregoai.com/press-releases/${item.slug}`,
    ...(item.featuredImageFileId ? { image: `https://www.hiregoai.com/api/content/media/${item.featuredImageFileId}` } : {}),
  };
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <EditorialArticle item={item} />
    </MarketingShell>
  );
}
