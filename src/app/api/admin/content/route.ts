import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import {
  assertContentMediaFiles,
  editorialMutationSchema,
  normalizeEditorialPayload,
  validateEditorialPublication,
  editorialPublicPath,
} from "@/lib/contentCms";
import { enqueuePublicIndexing } from "@/lib/publicIndexingEvents";

const querySchema = z.object({
  search: z.string().trim().max(200).optional(),
  type: z.enum(["BLOG", "PRESS_RELEASE"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_content_list:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const where: Prisma.EditorialContentWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
              { excerpt: { contains: query.search, mode: "insensitive" } },
              { contentText: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.editorialContent.count({ where }),
      prisma.editorialContent.findMany({
        where,
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: query.page,
      limit: query.limit,
      content: rows,
      source: "editorial_content_db",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_content_create:${admin.id}`, 20, 60_000);
    const parsed = await readValidatedJson(req, editorialMutationSchema, 256 * 1024);
    const normalized = normalizeEditorialPayload(parsed);
    const status = parsed.status || "DRAFT";
    const scheduledAt = parsed.scheduledAt ? new Date(parsed.scheduledAt) : null;

    validateEditorialPublication({
      type: normalized.type,
      status,
      title: normalized.title,
      contentText: normalized.contentText,
      dateline: normalized.dateline,
      scheduledAt,
      featuredImageFileId: normalized.featuredImageFileId,
      featuredImageAlt: normalized.featuredImageAlt,
    });

    await assertContentMediaFiles([
      ...normalized.inlineMediaFileIds,
      ...(normalized.featuredImageFileId ? [normalized.featuredImageFileId] : []),
      ...(normalized.ogImageFileId ? [normalized.ogImageFileId] : []),
    ]);

    const now = new Date();
    const created = await prisma.$transaction(async (tx) => {
      const lockKey = `editorial-content-slug:${normalized.slug}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const duplicate = await tx.editorialContent.findUnique({
        where: { slug: normalized.slug },
        select: { id: true },
      });
      if (duplicate) throw new ApiError("This slug is already in use.", 409);

      const content = await tx.editorialContent.create({
        data: {
          type: normalized.type,
          status,
          title: normalized.title,
          slug: normalized.slug,
          excerpt: normalized.excerpt,
          contentHtml: normalized.contentHtml,
          contentText: normalized.contentText,
          featuredImageFileId: normalized.featuredImageFileId,
          featuredImageAlt: normalized.featuredImageAlt,
          inlineMediaFileIds: normalized.inlineMediaFileIds,
          ogImageFileId: normalized.ogImageFileId,
          authorId: admin.id,
          category: normalized.category,
          tags: normalized.tags,
          dateline: normalized.dateline,
          mediaContactName: normalized.mediaContactName,
          mediaContactEmail: normalized.mediaContactEmail,
          mediaContactPhone: normalized.mediaContactPhone,
          companyBoilerplate: normalized.companyBoilerplate,
          seoTitle: normalized.seoTitle,
          seoDescription: normalized.seoDescription,
          canonicalUrl: normalized.canonicalUrl,
          scheduledAt: status === "SCHEDULED" ? scheduledAt : null,
          publishedAt: status === "PUBLISHED" ? now : null,
        },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "EDITORIAL_CONTENT_CREATED",
          resource: `EditorialContent:${content.id}`,
          details: JSON.stringify({ type: content.type, status: content.status, slug: content.slug, revision: content.revision }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);
      if (content.status === "PUBLISHED") {
        await enqueuePublicIndexing({
          kind: "EDITORIAL",
          action: "UPDATED",
          path: editorialPublicPath(content.type, content.slug),
          revisionKey: `r${content.revision}:${content.publishedAt?.toISOString() || now.toISOString()}`,
        }, tx);
      }
      return content;
    });

    return NextResponse.json({ success: true, content: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
