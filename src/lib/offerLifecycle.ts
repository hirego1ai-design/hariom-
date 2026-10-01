import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

type ExpiryScope = {
  companyId?: string;
  candidateProfileId?: string;
  limit?: number;
  now?: Date;
};

function checkpointRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function expireOfferIfDue(offerId: string, now = new Date()): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${offerId} FOR UPDATE`;
    const offer = await tx.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        companyId: true,
        applicationId: true,
        status: true,
        expiresAt: true,
      },
    });
    if (
      !offer ||
      !["DRAFT", "SENT"].includes(offer.status) ||
      offer.expiresAt > now
    ) {
      return false;
    }

    const changed = await tx.offer.updateMany({
      where: {
        id: offer.id,
        status: { in: ["DRAFT", "SENT"] },
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });
    if (changed.count !== 1) return false;

    const correlationId = `offer-send:${offer.id}`;
    const workflow = await tx.workflowInstance.findUnique({
      where: { correlationId },
      select: {
        id: true,
        status: true,
        checkpointState: true,
      },
    });

    let revokedApprovalCount = 0;
    if (
      workflow &&
      ["RUNNING", "PAUSED_FOR_APPROVAL", "FAILED"].includes(workflow.status)
    ) {
      const expiredAt = now;
      const approvals = await tx.workflowApproval.findMany({
        where: {
          workflowInstanceId: workflow.id,
          consumedAt: null,
          revokedAt: null,
        },
        select: { id: true },
      });
      if (approvals.length > 0) {
        const revoked = await tx.workflowApproval.updateMany({
          where: {
            id: { in: approvals.map((approval) => approval.id) },
            consumedAt: null,
            revokedAt: null,
          },
          data: {
            revokedAt: expiredAt,
            revokedBy: "SYSTEM_OFFER_EXPIRY",
            revocationReason: "Offer expired before candidate acceptance.",
          },
        });
        revokedApprovalCount = revoked.count;
      }

      const checkpoint = checkpointRecord(workflow.checkpointState);
      await tx.workflowInstance.update({
        where: { id: workflow.id },
        data: {
          status: "CANCELLED",
          currentStep: "OFFER_EXPIRED",
          checkpointState: {
            ...checkpoint,
            offerId: offer.id,
            offerExpiredAt: expiredAt.toISOString(),
            cancellationReason: "Offer expired before candidate acceptance.",
          } as Prisma.InputJsonValue,
        },
      });
    }

    const audit = await tx.auditLog.create({
      data: {
        userId: null,
        companyId: offer.companyId,
        action: "OFFER_EXPIRED",
        resource: `Offer:${offer.id}`,
        details: JSON.stringify({
          applicationId: offer.applicationId,
          expiredAt: now.toISOString(),
          workflowCancelled: Boolean(
            workflow &&
            ["RUNNING", "PAUSED_FOR_APPROVAL", "FAILED"].includes(workflow.status),
          ),
          revokedApprovalCount,
        }),
      },
    });
    await enqueueSecurityAuditEvent(tx, audit);

    return true;
  });
}

export async function reconcileExpiredOffers(scope: ExpiryScope = {}): Promise<number> {
  const now = scope.now ?? new Date();
  const limit = Math.min(Math.max(scope.limit ?? 50, 1), 100);
  const candidates = await prisma.offer.findMany({
    where: {
      status: { in: ["DRAFT", "SENT"] },
      expiresAt: { lte: now },
      ...(scope.companyId ? { companyId: scope.companyId } : {}),
      ...(scope.candidateProfileId
        ? { application: { candidateProfileId: scope.candidateProfileId } }
        : {}),
    },
    select: { id: true },
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    take: limit,
  });

  let reconciled = 0;
  for (const candidate of candidates) {
    if (await expireOfferIfDue(candidate.id, now)) reconciled += 1;
  }
  return reconciled;
}
