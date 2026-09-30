import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import EditorialArticle from "@/components/marketing/EditorialArticle";
import { prisma } from "@/lib/prisma";
import { effectivePublishedWhere, editorialPublicPath } from "@/lib/contentCms";

export const revalidate = 300;

async function getPost(slug: string) {
  return prisma.editorialContent.findFirst({
    where: { AND: [{ slug, type: "BLOG" }, effectivePublishedWhere(new Date(), "BLOG")] },
    include: { author: { select: { name: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPost(slug);
  if (!item) return { title: "Article not found — HireGo AI", robots: { index: false, follow: false } };
  const path = editorialPublicPath(item.type, item.slug);
  const canonical = item.canonicalUrl || `https://hiregoai.com${path}`;
  const imageId = item.ogImageFileId || item.featuredImageFileId;
  const images = imageId ? [{ url: `https://hiregoai.com/api/content/media/${imageId}`, alt: item.featuredImageAlt || item.title }] : undefined;
  return {
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.excerpt || undefined,
    alternates: { canonical },
    openGraph: { type: "article", siteName: "HireGo AI", title: item.seoTitle || item.title, description: item.seoDescription || item.excerpt || undefined, url: canonical, images },
    twitter: { card: "summary_large_image", title: item.seoTitle || item.title, description: item.seoDescription || item.excerpt || undefined, images: imageId ? [`https://hiregoai.com/api/content/media/${imageId}`] : undefined },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPost(slug);
  if (!item) notFound();
  const published = item.publishedAt || item.scheduledAt || item.createdAt;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: item.title,
    description: item.seoDescription || item.excerpt || undefined,
    datePublished: published.toISOString(),
    dateModified: item.updatedAt.toISOString(),
    author: { "@type": "Person", name: item.author.name },
    publisher: { "@type": "Organization", name: "HireGo AI", url: "https://hiregoai.com" },
    mainEntityOfPage: `https://hiregoai.com/blog/${item.slug}`,
    ...(item.featuredImageFileId ? { image: `https://hiregoai.com/api/content/media/${item.featuredImageFileId}` } : {}),
  };
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <EditorialArticle item={item} />
    </MarketingShell>
  );
}
