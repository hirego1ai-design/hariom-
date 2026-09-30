import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { effectivePublishedWhere, editorialPublicPath } from "@/lib/contentCms";

type Filter = "ALL" | "BLOG" | "PRESS_RELEASE";

export default async function EditorialContentListing({ filter = "ALL" }: { filter?: Filter }) {
  const type = filter === "ALL" ? undefined : filter;
  let rows;
  try {
    rows = await prisma.editorialContent.findMany({
      where: effectivePublishedWhere(new Date(), type),
      include: { author: { select: { name: true } } },
      orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }, { createdAt: "desc" }],
      take: 60,
    });
  } catch (error) {
    console.error("Editorial content listing unavailable", error);
    return (
      <div role="status" className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.05] p-10 text-center">
        <p className="text-sm font-semibold text-amber-100">News & Insights are temporarily unavailable.</p>
        <p className="mt-2 text-sm text-slate-500">Please try again shortly.</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <p className="text-sm font-semibold text-slate-300">No published content yet.</p>
        <p className="mt-2 text-sm text-slate-500">New HireGo insights and company announcements will appear here after publication.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((item) => {
        const href = editorialPublicPath(item.type, item.slug);
        const published = item.publishedAt || item.scheduledAt || item.createdAt;
        return (
          <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-white/20">
            {item.featuredImageFileId && (
              <Link href={href} className="block overflow-hidden border-b border-white/10 bg-slate-950">
                <Image
                  src={`/api/content/media/${item.featuredImageFileId}`}
                  alt={item.featuredImageAlt || ""}
                  width={1200}
                  height={675}
                  unoptimized
                  className="aspect-[16/9] w-full object-cover transition duration-300 hover:scale-[1.02]"
                />
              </Link>
            )}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em]">
                <span className={item.type === "BLOG" ? "text-sky-300" : "text-rose-300"}>
                  {item.type === "BLOG" ? "Blog" : "Press Release"}
                </span>
                {item.category && <><span className="text-slate-700">•</span><span className="text-slate-500">{item.category}</span></>}
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-tight text-white">
                <Link href={href} className="hover:text-sky-200">{item.title}</Link>
              </h2>
              {item.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">{item.excerpt}</p>}
              <div className="mt-6 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{item.author.name}</span>
                <time dateTime={published.toISOString()}>{published.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
              </div>
              <Link href={href} className="mt-6 inline-flex min-h-10 items-center text-sm font-bold text-sky-300 hover:text-sky-200">
                {item.type === "BLOG" ? "Read article" : "Read press release"} <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
