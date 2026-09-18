import { randomUUID } from "crypto";
import type { Invoice as DatabaseInvoice } from "@prisma/client";
import { Invoice, PaymentStatus } from "@/types";
import { prisma } from "./prisma";
import { ApiError } from "./apiSecurity";
import { receiptNotes, receiptDownloadUrl, rejectionStatus } from "./invoiceReceiptState";
import { enqueueSecurityAuditEvent } from "./securityAuditOutbox";
export interface InvoiceRecord extends Invoice {
  candidateName?: string; jobTitle?: string; notes?: string;
  bankTransferRef?: string; bankTransferReceiptUrl?: string; receiptMimeType?: string;
}
type CreateInvoiceInput = Omit<InvoiceRecord, "id" | "invoiceNumber" | "createdAt" | "companyName"> & {
  companyName?: string;
};
export function presentInvoice(r: DatabaseInvoice): InvoiceRecord {
  const metadata = receiptNotes(r.notes);
  return { ...r, candidateName: r.candidateName || undefined, jobTitle: r.jobTitle || undefined,
    paidDate: r.paidDate || undefined, status: r.status as PaymentStatus,
    notes: typeof metadata.notes === "string" ? metadata.notes : undefined,
    bankTransferRef: typeof metadata.bankTransferRef === "string" ? metadata.bankTransferRef : undefined,
    bankTransferReceiptUrl: receiptDownloadUrl(r.notes),
    receiptMimeType: typeof metadata.receiptMimeType === "string" ? metadata.receiptMimeType : undefined,
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}
class InvoicesDb {
  async getInvoices(): Promise<InvoiceRecord[]> {
    return (await prisma.invoice.findMany({ orderBy: { createdAt: "desc" } })).map(presentInvoice);
  }
  async getInvoiceById(id: string): Promise<InvoiceRecord | null> {
    const row = await prisma.invoice.findFirst({ where: { OR: [{ id }, { invoiceNumber: id }] } });
    return row ? presentInvoice(row) : null;
  }
  async createInvoice(data: CreateInvoiceInput): Promise<InvoiceRecord> {
    const agreement = await prisma.commercialAgreement.findUnique({
      where: { id: data.agreementId },
      select: { companyId: true, companyName: true, status: true, signedAt: true },
    });
    if (!agreement) throw new ApiError("A valid commercial agreement is required", 400);
    if (!agreement.companyId || agreement.status !== "ACTIVE" || !agreement.signedAt) {
      throw new ApiError("Invoices require a signed active agreement bound to a company", 409);
    }
    if (data.status !== "UNPAID") throw new ApiError("New invoices must be unpaid", 400);
    return presentInvoice(await prisma.invoice.create({ data: {
      id: randomUUID(), invoiceNumber: `INV-${new Date().getUTCFullYear()}-${randomUUID()}`,
      agreementId: data.agreementId, companyName: agreement.companyName,
      candidateName: data.candidateName, jobTitle: data.jobTitle,
      amount: data.amount, taxAmount: data.taxAmount, totalAmount: data.totalAmount,
      currency: data.currency, status: "UNPAID", dueDate: data.dueDate, notes: data.notes,
    } }));
  }
  async reviewReceipt(id: string, action: "approve" | "reject", actorId: string, paidDate?: string, expectedUpdatedAt?: string, ipAddress?: string): Promise<InvoiceRecord | null> {
    return prisma.$transaction(async tx => {
      const row = await tx.invoice.findUnique({ where: { id } });
      if (!row) return null;
      const metadata = receiptNotes(row.notes);
      if (expectedUpdatedAt && row.updatedAt.toISOString() !== expectedUpdatedAt) throw new ApiError("Invoice changed; refresh before reviewing", 409);
      if (row.status !== "PENDING_VERIFICATION" || !metadata.bankTransferRef || !metadata.storedFileId) throw new ApiError("Only a submitted receipt can be reviewed", 409);
      const status = action === "approve" ? "PAID" : rejectionStatus(row.dueDate);
      const reviewedAt = new Date().toISOString();
      const changed = await tx.invoice.updateMany({
        where: { id, status: "PENDING_VERIFICATION", updatedAt: row.updatedAt },
        data: { status, paidDate: action === "approve" ? paidDate || new Date().toISOString().slice(0, 10) : null,
          notes: JSON.stringify({ ...metadata, receiptReview: { action, actorId, reviewedAt } }) },
      });
      if (changed.count !== 1) throw new ApiError("Invoice changed; refresh before reviewing", 409);
      const updated = await tx.invoice.findUniqueOrThrow({ where: { id } });
      const agreement = await tx.commercialAgreement.findUnique({ where: { id: row.agreementId }, select: { companyId: true } });
      if (!agreement) throw new ApiError("Invoice agreement is missing; review cannot be completed", 409);
      const auditLog = await tx.auditLog.create({ data: {
        userId: actorId,
        companyId: agreement.companyId,
        action: action === "approve" ? "INVOICE_RECEIPT_APPROVED" : "INVOICE_RECEIPT_REJECTED",
        resource: `Invoice:${row.id}`,
        ipAddress: ipAddress || "unknown",
        details: `Receipt ${action === "approve" ? "approved" : "rejected"} for invoice ${row.invoiceNumber} (StoredFile:${String(metadata.storedFileId)})`,
      } });
      await enqueueSecurityAuditEvent(tx, auditLog, actorId);
      return presentInvoice(updated);
    });
  }
}
export const invoicesDb = new InvoicesDb();
