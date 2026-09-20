import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Editorial.module.css";

export { styles };

export function Breadcrumbs({ current }: { current: string }) {
  return <nav className={styles.crumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{current}</span></nav>;
}

export function EditorialHero({ eyebrow, title, lead, note, image, alt, visual, current, primary, secondary }: {
  eyebrow: string; title: string; lead: string; note?: string; image?: string; alt?: string; visual?: ReactNode; current: string;
  primary: { label: string; href: string }; secondary: { label: string; href: string };
}) {
  return <section className={styles.hero} aria-labelledby="page-title"><div className={`${styles.container} ${styles.heroGrid}`}>
    <div className={styles.heroCopy}>
      <Breadcrumbs current={current} />
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="page-title">{title}</h1>
      <p className={styles.heroLead}>{lead}</p>
      {note && <p className={styles.heroNote}>{note}</p>}
      <div className={styles.actions}><Link className={styles.buttonLight} href={primary.href}>{primary.label} <span aria-hidden="true">↗</span></Link><Link className={styles.buttonOutline} href={secondary.href}>{secondary.label}</Link></div>
    </div>
    {visual ?? (image && <Image className={styles.heroArt} src={image} alt={alt || ""} width={1200} height={900} sizes="(max-width: 900px) 100vw, 48vw" priority />)}
  </div></section>;
}

export function SectionHeading({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return <div className={styles.sectionHead}>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h2>{title}</h2>{body && <p>{body}</p>}</div>;
}

export function FAQ({ title = "Frequently Asked Questions", items }: { title?: string; items: { question: string; answer: string }[] }) {
  return <section className={styles.section} aria-labelledby="faq-title"><div className={styles.container}><div className={styles.faq}><h2 id="faq-title">{title}</h2><div className="mt-5">{items.map(item => <article key={item.question} className={styles.faqItem}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div></div></div></section>;
}

export function FinalCTA({ title, body, primary, secondary }: { title: string; body: string; primary: {label: string; href: string}; secondary: {label: string; href: string} }) {
  return <section className={styles.section}><div className={styles.container}><div className={styles.cta}><h2>{title}</h2><p>{body}</p><div className={styles.actions}><Link href={primary.href} className={styles.buttonLight}>{primary.label} <span aria-hidden="true">↗</span></Link><Link href={secondary.href} className={styles.buttonOutline}>{secondary.label}</Link></div></div></div></section>;
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbSchema(label: string, path: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://hiregoai.com/" },
    { "@type": "ListItem", position: 2, name: label, item: `https://hiregoai.com${path}` },
  ] };
}
