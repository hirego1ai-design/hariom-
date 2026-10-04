import { prisma } from "@/lib/prisma";
import { editorialPublicPath } from "@/lib/contentCms";
import { enqueuePublicIndexing } from "@/lib/publicIndexingEvents";

export async function reconcilePublicDiscovery(now = new Date()) {
  let expiredJobsClosed = 0;
  let scheduledEditorialPublished = 0;

  await prisma.$transaction(async (tx) => {
    const expired = await tx.jobListing.findMany({
      where: {
        status: "ACTIVE",
        publishedAt: { not: null },
        expiresAt: { lte: now },
      },
      select: { id: true, companyId: true, expiresAt: true },
      orderBy: { expiresAt: "asc" },
      take: 500,
    });

    for (const job of expired) {
      const closed = await tx.jobListing.updateMany({
        where: {
          id: job.id,
          status: "ACTIVE",
          expiresAt: { lte: now },
        },
        data: { status: "CLOSED" },
      });
      if (closed.count !== 1) continue;
      expiredJobsClosed++;
      await enqueuePublicIndexing({
        kind: "JOB",
        action: "DELETED",
        path: `/jobs/${job.id}`,
        revisionKey: `expired:${job.expiresAt?.toISOString() || now.toISOString()}`,
        companyId: job.companyId,
      }, tx);
    }

    const dueEditorial = await tx.editorialContent.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      select: {
        id: true,
        type: true,
        slug: true,
        revision: true,
        scheduledAt: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: 500,
    });

    for (const item of dueEditorial) {
      const publishedAt = item.scheduledAt || now;
      const promoted = await tx.editorialContent.updateMany({
        where: {
          id: item.id,
          status: "SCHEDULED",
          scheduledAt: { lte: now },
        },
        data: {
          status: "PUBLISHED",
          publishedAt,
          scheduledAt: null,
        },
      });
      if (promoted.count !== 1) continue;

      await enqueuePublicIndexing({
        kind: "EDITORIAL",
        action: "UPDATED",
        path: editorialPublicPath(item.type, item.slug),
        revisionKey: `scheduled:r${item.revision}:${publishedAt.toISOString()}`,
      }, tx);
      scheduledEditorialPublished++;
    }
  });

  return { expiredJobsClosed, scheduledEditorialPublished };
}
