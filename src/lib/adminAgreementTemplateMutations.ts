import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { AgreementTemplateRecord } from "@/types";
import { prisma } from "./prisma";
import { ApiError } from "./apiSecurity";
import { enqueueSecurityAuditEvent } from "./securityAuditOutbox";

export type AgreementTemplateMutationInput = {
  name: string;
  description: string;
  category: string;
  feeType: "PERCENTAGE" | "FIXED";
  feeValue: number;
  invoiceRule: "ON_OFFER" | "ON_JOINING" | "DAY_25" | "DAY_30" | "SPLIT_50_50";
  replacementDays: number;
  validityMonths: number;
  advancePayment: number;
  creditTermsDays: number;
  standardDiscountPct: number;
  taxRatePct: number;
  specialClauses: string[];
  commercialNotes?: string;
};

export type AdminAgreementTemplateContext = {
  actorId: string;
  ipAddress?: string;
};

function slugBase(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "agreement-template";
}

function presentTemplate(record: any): AgreementTemplateRecord {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    category: record.category,
    feeType: record.feeType,
    feeValue: record.feeValue,
    invoiceRule: record.invoiceRule,
    replacementDays: record.replacementDays,
    validityMonths: record.validityMonths,
    advancePayment: record.advancePayment,
    creditTermsDays: record.creditTermsDays,
    standardDiscountPct: record.standardDiscountPct,
    taxRatePct: record.taxRatePct,
    specialClauses: record.specialClauses,
    commercialNotes: record.commercialNotes ?? undefined,
    isArchived: record.isArchived,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  context: AdminAgreementTemplateContext,
  action: string,
  templateId: string,
  details: string,
) {
  const auditLog = await tx.auditLog.create({
    data: {
      userId: context.actorId,
      action,
      resource: `AgreementTemplate:${templateId}`,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      details,
    },
  });
  await enqueueSecurityAuditEvent(tx, auditLog, context.actorId);
}

export async function createAdminAgreementTemplate(
  input: AgreementTemplateMutationInput,
  context: AdminAgreementTemplateContext,
): Promise<AgreementTemplateRecord> {
  return prisma.$transaction(async (tx) => {
    const id = randomUUID();
    const slug = `${slugBase(input.name)}-${randomUUID().slice(0, 8)}`;
    const created = await tx.agreementTemplate.create({
      data: {
        id,
        slug,
        name: input.name,
        description: input.description,
        category: input.category,
        feeType: input.feeType,
        feeValue: input.feeValue,
        invoiceRule: input.invoiceRule,
        replacementDays: input.replacementDays,
        validityMonths: input.validityMonths,
        advancePayment: input.advancePayment,
        creditTermsDays: input.creditTermsDays,
        standardDiscountPct: input.standardDiscountPct,
        taxRatePct: input.taxRatePct,
        specialClauses: input.specialClauses,
        commercialNotes: input.commercialNotes || null,
        isArchived: false,
      },
    });
    await writeAudit(tx, context, "AGREEMENT_TEMPLATE_CREATED", created.id, "Agreement template created with explicit commercial terms.");
    return presentTemplate(created);
  });
}

export async function updateAdminAgreementTemplate(
  id: string,
  input: AgreementTemplateMutationInput,
  expectedUpdatedAt: string,
  context: AdminAgreementTemplateContext,
): Promise<AgreementTemplateRecord | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.agreementTemplate.findUnique({ where: { id } });
    if (!existing) return null;
    if (existing.updatedAt.toISOString() !== expectedUpdatedAt) {
      throw new ApiError("Agreement template changed; refresh before saving.", 409);
    }

    const changed = await tx.agreementTemplate.updateMany({
      where: { id, updatedAt: existing.updatedAt },
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        feeType: input.feeType,
        feeValue: input.feeValue,
        invoiceRule: input.invoiceRule,
        replacementDays: input.replacementDays,
        validityMonths: input.validityMonths,
        advancePayment: input.advancePayment,
        creditTermsDays: input.creditTermsDays,
        standardDiscountPct: input.standardDiscountPct,
        taxRatePct: input.taxRatePct,
        specialClauses: input.specialClauses,
        commercialNotes: input.commercialNotes || null,
      },
    });
    if (changed.count !== 1) {
      throw new ApiError("Agreement template changed; refresh before saving.", 409);
    }
    const updated = await tx.agreementTemplate.findUniqueOrThrow({ where: { id } });
    await writeAudit(tx, context, "AGREEMENT_TEMPLATE_UPDATED", id, "Agreement template commercial terms updated.");
    return presentTemplate(updated);
  });
}

export async function archiveAdminAgreementTemplate(
  id: string,
  context: AdminAgreementTemplateContext,
): Promise<AgreementTemplateRecord | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.agreementTemplate.findUnique({ where: { id } });
    if (!existing) return null;
    if (existing.isArchived) return presentTemplate(existing);
    const changed = await tx.agreementTemplate.updateMany({
      where: { id, isArchived: false, updatedAt: existing.updatedAt },
      data: { isArchived: true },
    });
    if (changed.count !== 1) {
      throw new ApiError("Agreement template changed; refresh before archiving.", 409);
    }
    const archived = await tx.agreementTemplate.findUniqueOrThrow({ where: { id } });
    await writeAudit(tx, context, "AGREEMENT_TEMPLATE_ARCHIVED", id, "Agreement template archived.");
    return presentTemplate(archived);
  });
}

export async function duplicateAdminAgreementTemplate(
  id: string,
  context: AdminAgreementTemplateContext,
): Promise<AgreementTemplateRecord | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.agreementTemplate.findUnique({ where: { id } });
    if (!existing) return null;
    const copyId = randomUUID();
    const copyName = `${existing.name} (Copy)`;
    const copied = await tx.agreementTemplate.create({
      data: {
        id: copyId,
        slug: `${slugBase(existing.name)}-copy-${randomUUID().slice(0, 8)}`,
        name: copyName,
        description: existing.description,
        category: existing.category,
        feeType: existing.feeType,
        feeValue: existing.feeValue,
        invoiceRule: existing.invoiceRule,
        replacementDays: existing.replacementDays,
        validityMonths: existing.validityMonths,
        advancePayment: existing.advancePayment,
        creditTermsDays: existing.creditTermsDays,
        standardDiscountPct: existing.standardDiscountPct,
        taxRatePct: existing.taxRatePct,
        specialClauses: existing.specialClauses,
        commercialNotes: existing.commercialNotes,
        isArchived: false,
      },
    });
    await writeAudit(tx, context, "AGREEMENT_TEMPLATE_DUPLICATED", copied.id, `Duplicated from AgreementTemplate:${id}.`);
    return presentTemplate(copied);
  });
}
