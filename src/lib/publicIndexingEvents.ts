import { createHash } from "node:crypto";
import { Prisma, type PrismaClient, type SystemEvent } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyPublicIndexing, type PublicIndexAction, type PublicIndexKind } from "@/lib/publicDiscovery";

type TransactionLike = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function eventKey(input: {
  kind: PublicIndexKind;
  action: PublicIndexAction;
  path: string;
  revisionKey: string;
}) {
  const digest = createHash("sha256")
    .update(JSON.stringify([input.kind, input.action, input.path, input.revisionKey]))
    .digest("hex")
    .slice(0, 40);
  return `public-index:${input.kind.toLowerCase()}:${digest}`;
}

export async function enqueuePublicIndexing(
  input: {
    kind: PublicIndexKind;
    action: PublicIndexAction;
    path: string;
    revisionKey: string;
    companyId?: string | null;
  },
  tx?: TransactionLike,
) {
  const client = tx || prisma;
  const idempotencyKey = eventKey(input);
  return client.outboxEntry.upsert({
    where: { idempotencyKey },
    update: {},
    create: {
      eventType: "PUBLIC_INDEXING_REQUESTED",
      payload: {
        kind: input.kind,
        action: input.action,
        path: input.path,
      } as Prisma.InputJsonValue,
      correlationId: idempotencyKey,
      companyId: input.companyId || null,
      idempotencyKey,
      status: "PENDING",
      retryCount: 0,
    },
  });
}

const publicIndexingPayload = z.object({
  kind: z.enum(["JOB", "EDITORIAL", "PAGE"]),
  action: z.enum(["UPDATED", "DELETED"]),
  path: z.string().min(1).max(500).regex(/^\/[A-Za-z0-9/_?&=.%+-]*$/, "Invalid public path."),
});

export async function publicIndexingRequested(event: SystemEvent) {
  const payload = publicIndexingPayload.parse(event.payload);
  await notifyPublicIndexing(payload);
}

export async function jobListingPublicDiscovery(event: SystemEvent) {
  const payload = z.object({ jobId: z.string().min(1).max(128) }).parse(event.payload);
  const now = new Date();
  const job = await prisma.jobListing.findFirst({
    where: {
      id: payload.jobId,
      status: "ACTIVE",
      publishedAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      NOT: { aiFocusAreas: "QA_TEST_PUBLIC_JOB" },
    },
    select: { id: true },
  });
  if (!job) return;
  await notifyPublicIndexing({
    kind: "JOB",
    action: "UPDATED",
    path: `/jobs/${job.id}`,
  });
}
