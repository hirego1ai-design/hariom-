import { prisma } from "@/lib/prisma";
import { editorialPublicPath } from "@/lib/contentCms";
import { enqueuePublicIndexing } from "@/lib/publicIndexingEvents";

export async function reconcilePublicDiscovery(now = new Date()) {
  let expiredJobsClosed = 0;
  let scheduledEditorialQueued = 0;

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

    // Scheduled editorial content is considered public by effectivePublishedWhere
    // once its scheduledAt time is due. Keep the authored status unchanged and
    // queue an idempotent discovery event using its revision + schedule time.
    // Repeated recovery passes upsert the same outbox key, so providers are not
    // spammed and the CMS audit/history semantics remain unchanged.
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
      await enqueuePublicIndexing({
        kind: "EDITORIAL",
        action: "UPDATED",
        path: editorialPublicPath(item.type, item.slug),
        revisionKey: `scheduled:r${item.revision}:${item.scheduledAt?.toISOString() || ""}`,
      }, tx);
      scheduledEditorialQueued++;
    }
  });

  return { expiredJobsClosed, scheduledEditorialQueued };
}
