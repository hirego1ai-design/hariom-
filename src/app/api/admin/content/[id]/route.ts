import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import {
  assertContentMediaFiles,
  editorialMutationSchema,
  normalizeEditorialPayload,
  validateEditorialPublication,
} from "@/lib/contentCms";

function validId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_content_read:${admin.id}`, 120, 60_000);
    const { id } = await params;
    if (!validId(id)) throw new ApiError("Content not found.", 404);

    const content = await prisma.editorialContent.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!content) throw new ApiError("Content not found.", 404);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_content_update:${admin.id}`, 40, 60_000);
    const { id } = await params;
    if (!validId(id)) throw new ApiError("Content not found.", 404);

    const parsed = await readValidatedJson(req, editorialMutationSchema, 256 * 1024);
    const normalized = normalizeEditorialPayload(parsed);
    const existing = await prisma.editorialContent.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Content not found.", 404);
    if (parsed.expectedRevision && existing.revision !== parsed.expectedRevision) {
      throw new ApiError("This content changed in another session. Reload before saving again.", 409);
    }

    const status = parsed.status || existing.status;
    const scheduledAt = parsed.scheduledAt
      ? new Date(parsed.scheduledAt)
      : status === "SCHEDULED"
        ? existing.scheduledAt
        : null;

    validateEditorialPublication({
      type: normalized.type,
      status,
      title: normalized.title,
      contentText: normalized.contentText,
      dateline: normalized.dateline,
      scheduledAt,
    });

    await assertContentMediaFiles([
      ...normalized.inlineMediaFileIds,
      ...(normalized.featuredImageFileId ? [normalized.featuredImageFileId] : []),
      ...(normalized.ogImageFileId ? [normalized.ogImageFileId] : []),
    ]);

    const slugOwner = await prisma.editorialContent.findFirst({
      where: { slug: normalized.slug, id: { not: id } },
      select: { id: true },
    });
    if (slugOwner) throw new ApiError("This slug is already in use.", 409);

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const content = await tx.editorialContent.update({
        where: { id },
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
          publishedAt: status === "PUBLISHED" ? existing.publishedAt || now : existing.publishedAt,
          revision: { increment: 1 },
        },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "EDITORIAL_CONTENT_UPDATED",
          resource: `EditorialContent:${id}`,
          details: JSON.stringify({
            fromStatus: existing.status,
            toStatus: content.status,
            type: content.type,
            slug: content.slug,
            revision: content.revision,
          }),
        },
      });
      return content;
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_content_delete:${admin.id}`, 10, 60_000);
    const { id } = await params;
    if (!validId(id)) throw new ApiError("Content not found.", 404);

    const existing = await prisma.editorialContent.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Content not found.", 404);

    if (existing.publishedAt || existing.status === "PUBLISHED" || existing.status === "SCHEDULED") {
      const archived = await prisma.$transaction(async (tx) => {
        const row = await tx.editorialContent.update({
          where: { id },
          data: { status: "ARCHIVED", scheduledAt: null, revision: { increment: 1 } },
        });
        await tx.auditLog.create({
          data: {
            userId: admin.id,
            action: "EDITORIAL_CONTENT_ARCHIVED",
            resource: `EditorialContent:${id}`,
            details: JSON.stringify({ previousStatus: existing.status, slug: existing.slug, revision: row.revision }),
          },
        });
        return row;
      });
      return NextResponse.json({ success: true, archived: true, content: archived });
    }

    await prisma.$transaction(async (tx) => {
      await tx.editorialContent.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "EDITORIAL_CONTENT_DRAFT_DELETED",
          resource: `EditorialContent:${id}`,
          details: JSON.stringify({ type: existing.type, slug: existing.slug }),
        },
      });
    });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
