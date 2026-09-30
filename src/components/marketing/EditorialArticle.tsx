import Image from "next/image";
import Link from "next/link";
import type { EditorialContent, User } from "@prisma/client";
import styles from "./EditorialArticle.module.css";
import { editorialPublicPath, sanitizeRichHtml } from "@/lib/contentCms";

type Item = EditorialContent & { author: Pick<User, "name"> };

export default function EditorialArticle({ item }: { item: Item }) {
  const published = item.publishedAt || item.scheduledAt || item.createdAt;
  const typeLabel = item.type === "BLOG" ? "Blog" : "Press Release";

  return (
    <article className={styles.article}>
      <div className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href={item.type === "BLOG" ? "/blog" : "/press-releases"}>{typeLabel}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{item.title}</span>
          </nav>

          <div className={styles.badges}>
            <span>{typeLabel}</span>
            {item.category && <span>{item.category}</span>}
          </div>

          <h1>{item.title}</h1>
          {item.excerpt && <p className={styles.lead}>{item.excerpt}</p>}
          <div className={styles.meta}>
            <span>By {item.author.name}</span>
            <time dateTime={published.toISOString()}>
              {published.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </time>
            {item.updatedAt.getTime() > published.getTime() + 60_000 && (
              <span>Updated {item.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            )}
          </div>

          {item.featuredImageFileId && (
            <Image
              src={`/api/content/media/${item.featuredImageFileId}`}
              alt={item.featuredImageAlt || ""}
              width={1400}
              height={788}
              unoptimized
              priority
              className={styles.cover}
            />
          )}
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          <div>
            {item.type === "PRESS_RELEASE" && item.dateline && <p className={styles.dateline}>{item.dateline}</p>}
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(item.contentHtml) }} />

            {item.type === "PRESS_RELEASE" && item.companyBoilerplate && (
              <section className={styles.boilerplate} aria-labelledby="about-hirego">
                <h2 id="about-hirego">About HireGo AI</h2>
                <p>{item.companyBoilerplate}</p>
              </section>
            )}

            {item.tags.length > 0 && (
              <div className={styles.tags} aria-label="Tags">
                {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            )}
          </div>

          {item.type === "PRESS_RELEASE" && (item.mediaContactName || item.mediaContactEmail || item.mediaContactPhone) && (
            <aside className={styles.contact}>
              <p className={styles.contactLabel}>Media contact</p>
              {item.mediaContactName && <p className={styles.contactName}>{item.mediaContactName}</p>}
              {item.mediaContactEmail && <a href={`mailto:${item.mediaContactEmail}`}>{item.mediaContactEmail}</a>}
              {item.mediaContactPhone && <a href={`tel:${item.mediaContactPhone.replace(/[^+\d]/g, "")}`}>{item.mediaContactPhone}</a>}
            </aside>
          )}
        </div>

        <div className={styles.back}>
          <Link href="/resources">← Back to News & Insights</Link>
          <Link href={editorialPublicPath(item.type, item.slug)} aria-current="page" className="sr-only">Current article</Link>
        </div>
      </div>
    </article>
  );
}
