import * as cheerio from "cheerio";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MEDIA_SRC_RE = /^\/api\/content\/media\/([0-9a-f-]{36})$/i;
const DANGEROUS_TAGS = new Set(["script", "style", "object", "embed", "form", "input", "button", "textarea", "select", "option", "svg", "math", "video", "audio", "canvas"]);
const ALLOWED_TAGS = new Set(["p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "hr", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "iframe"]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "data-cta"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  iframe: new Set(["src", "title", "loading", "allow", "allowfullscreen", "referrerpolicy"]),
};

function cleanUrl(value: string, kind: "href" | "src") {
  const trimmed = value.trim();
  if (kind === "src") return MEDIA_SRC_RE.test(trimmed) ? trimmed : "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return "";
}

function cleanEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    const youtube = host === "www.youtube-nocookie.com" && /^\/embed\/[A-Za-z0-9_-]{6,20}$/.test(url.pathname);
    const vimeo = host === "player.vimeo.com" && /^\/video\/\d+$/.test(url.pathname);
    if (!youtube && !vimeo) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function sanitizeRichHtml(input: string) {
  const $ = cheerio.load(input || "", undefined, false);
  $("*").each((_, node) => {
    const el = node as any;
    if (!el.tagName) return;
    const tag = String(el.tagName).toLowerCase();

    if (DANGEROUS_TAGS.has(tag)) {
      $(el).remove();
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      $(el).replaceWith($(el).contents());
      return;
    }

    const attrs = { ...(el.attribs || {}) } as Record<string, string>;
    for (const name of Object.keys(attrs)) {
      if (!ALLOWED_ATTRS[tag]?.has(name)) $(el).removeAttr(name);
    }

    if (tag === "a") {
      const href = cleanUrl($(el).attr("href") || "", "href");
      if (!href) $(el).removeAttr("href");
      else $(el).attr("href", href);
      const external = /^https?:\/\//i.test(href);
      if (external) {
        $(el).attr("target", "_blank");
        $(el).attr("rel", "noopener noreferrer");
      } else {
        $(el).removeAttr("target");
        $(el).removeAttr("rel");
      }
      const cta = ($(el).attr("data-cta") || "").toLowerCase();
      if (cta === "primary" || cta === "secondary") $(el).attr("data-cta", cta);
      else $(el).removeAttr("data-cta");
    }

    if (tag === "img") {
      const src = cleanUrl($(el).attr("src") || "", "src");
      if (!src) {
        $(el).remove();
        return;
      }
      $(el).attr("src", src);
      $(el).attr("loading", "lazy");
      const alt = ($(el).attr("alt") || "").trim().slice(0, 180);
      $(el).attr("alt", alt);
      const title = ($(el).attr("title") || "").trim().slice(0, 180);
      if (title) $(el).attr("title", title);
      else $(el).removeAttr("title");
      for (const dim of ["width", "height"]) {
        const value = $(el).attr(dim) || "";
        if (!/^\d{1,4}$/.test(value)) $(el).removeAttr(dim);
      }
    }

    if (tag === "iframe") {
      const src = cleanEmbedUrl($(el).attr("src") || "");
      if (!src) {
        $(el).remove();
        return;
      }
      $(el).attr("src", src);
      $(el).attr("title", (($(el).attr("title") || "Embedded video").trim().slice(0, 180) || "Embedded video"));
      $(el).attr("loading", "lazy");
      $(el).attr("referrerpolicy", "strict-origin-when-cross-origin");
      $(el).attr("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      $(el).attr("allowfullscreen", "");
    }
  });

  return $.html().trim();
}

export function richHtmlToText(html: string) {
  const $ = cheerio.load(html || "", undefined, false);
  return $.root().text().replace(/\s+/g, " ").trim();
}

export function extractContentMediaIds(html: string) {
  const $ = cheerio.load(html || "", undefined, false);
  const ids = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    const match = src.match(MEDIA_SRC_RE);
    if (match?.[1]) ids.add(match[1].toLowerCase());
  });
  return [...ids];
}

export function slugifyEditorialTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const editorialPayloadSchema = z.object({
  type: z.enum(["BLOG", "PRESS_RELEASE"]),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers, and hyphens only."),
  excerpt: nullableText(400),
  contentHtml: z.string().max(200_000),
  featuredImageFileId: z.string().uuid().nullable().optional(),
  featuredImageAlt: nullableText(180),
  ogImageFileId: z.string().uuid().nullable().optional(),
  category: nullableText(80),
  tags: z.array(z.string().trim().min(1).max(50)).max(12).default([]),
  dateline: nullableText(160),
  mediaContactName: nullableText(120),
  mediaContactEmail: z.string().trim().email().max(254).nullable().optional(),
  mediaContactPhone: nullableText(40),
  companyBoilerplate: nullableText(3000),
  seoTitle: nullableText(120),
  seoDescription: nullableText(220),
  canonicalUrl: z.string().trim().url().max(500).nullable().optional().refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" && (url.hostname === "hiregoai.com" || url.hostname === "www.hiregoai.com");
      } catch {
        return false;
      }
    },
    "Canonical URL must use the HireGo AI domain.",
  ),
});

export const editorialMutationSchema = editorialPayloadSchema.extend({
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  expectedRevision: z.number().int().min(1).optional(),
});

export function effectivePublishedWhere(now = new Date(), type?: "BLOG" | "PRESS_RELEASE"): Prisma.EditorialContentWhereInput {
  return {
    ...(type ? { type } : {}),
    OR: [
      { status: "PUBLISHED" },
      { status: "SCHEDULED", scheduledAt: { lte: now } },
    ],
  };
}

export function editorialPublicPath(type: "BLOG" | "PRESS_RELEASE", slug: string) {
  return type === "BLOG" ? `/blog/${slug}` : `/press-releases/${slug}`;
}

export async function assertContentMediaFiles(fileIds: string[]) {
  const unique = [...new Set(fileIds.filter(Boolean).map((id) => id.toLowerCase()))];
  if (!unique.length) return;
  if (unique.some((id) => !UUID_RE.test(id))) throw new ApiError("Invalid content media reference.", 422);

  const rows = await prisma.storedFile.findMany({
    where: {
      id: { in: unique },
      category: "content-media",
      deletedAt: null,
      scanStatus: "CLEAN",
      mimeType: { in: ["image/jpeg", "image/png", "image/webp"] },
    },
    select: { id: true },
  });
  if (rows.length !== unique.length) {
    throw new ApiError("One or more content images are unavailable or have not passed security scanning.", 422);
  }
}

export function validateEditorialPublication(input: {
  type: "BLOG" | "PRESS_RELEASE";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  title: string;
  contentText: string;
  dateline?: string | null;
  scheduledAt?: Date | null;
  featuredImageFileId?: string | null;
  featuredImageAlt?: string | null;
}) {
  if (input.status === "DRAFT" || input.status === "ARCHIVED") return;
  if (input.title.trim().length < 3 || input.contentText.trim().length < 40) {
    throw new ApiError("Published content requires a title and meaningful body content.", 422);
  }
  if (input.type === "PRESS_RELEASE" && !input.dateline?.trim()) {
    throw new ApiError("A press release dateline is required before publication.", 422);
  }
  if (input.featuredImageFileId && !input.featuredImageAlt?.trim()) {
    throw new ApiError("Featured image alternative text is required before publication.", 422);
  }
  if (input.status === "SCHEDULED") {
    if (!input.scheduledAt) throw new ApiError("Choose a publication time before scheduling.", 422);
    if (input.scheduledAt.getTime() <= Date.now() + 30_000) {
      throw new ApiError("Scheduled publication time must be in the future.", 422);
    }
  }
}

export function normalizeEditorialPayload(input: z.input<typeof editorialPayloadSchema>) {
  const contentHtml = sanitizeRichHtml(input.contentHtml);
  const contentText = richHtmlToText(contentHtml);
  const inlineMediaFileIds = extractContentMediaIds(contentHtml);
  return {
    ...input,
    excerpt: input.excerpt || null,
    featuredImageFileId: input.featuredImageFileId || null,
    featuredImageAlt: input.featuredImageAlt || null,
    ogImageFileId: input.ogImageFileId || null,
    category: input.category || null,
    tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    dateline: input.dateline || null,
    mediaContactName: input.mediaContactName || null,
    mediaContactEmail: input.mediaContactEmail || null,
    mediaContactPhone: input.mediaContactPhone || null,
    companyBoilerplate: input.companyBoilerplate || null,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    canonicalUrl: input.canonicalUrl
      ? input.canonicalUrl.replace(/^https:\/\/hiregoai\.com(?=\/|$)/, "https://www.hiregoai.com")
      : null,
    contentHtml,
    contentText,
    inlineMediaFileIds,
  };
}
