import { Invoice, PaymentStatus } from "@/types";
import { prisma } from "./prisma";

const allowMockFallbacks = process.env.NODE_ENV !== "production" || process.env.MOCK_DB === "true";

export interface InvoiceRecord extends Invoice {
  candidateName?: string;
  jobTitle?: string;
  notes?: string;
  bankTransferRef?: string;
  bankTransferReceiptUrl?: string;
}

class InvoicesDb {
  private invoices: InvoiceRecord[] = [];

  public async getInvoices(): Promise<InvoiceRecord[]> {
    try {
      const records = await prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (records && records.length > 0) {
        return records.map((r) => {
          let notesText = r.notes || undefined;
          let bankTransferRef = undefined;
          let bankTransferReceiptUrl = undefined;
          if (r.notes && r.notes.startsWith("{")) {
            try {
              const parsed = JSON.parse(r.notes);
              notesText = parsed.notes || undefined;
              bankTransferRef = parsed.bankTransferRef || undefined;
              bankTransferReceiptUrl = parsed.bankTransferReceiptUrl || undefined;
            } catch {}
          }
          return {
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            agreementId: r.agreementId,
            companyName: r.companyName,
            candidateName: r.candidateName || undefined,
            jobTitle: r.jobTitle || undefined,
            amount: r.amount,
            taxAmount: r.taxAmount,
            totalAmount: r.totalAmount,
            currency: r.currency,
            status: r.status as PaymentStatus,
            dueDate: r.dueDate,
            paidDate: r.paidDate || undefined,
            notes: notesText,
            bankTransferRef,
            bankTransferReceiptUrl,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
          };
        });
      }
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }
    return this.invoices;
  }

  public async getInvoiceById(id: string): Promise<InvoiceRecord | null> {
    try {
      const r = await prisma.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
      });
      if (r) {
        let notesText = r.notes || undefined;
        let bankTransferRef = undefined;
        let bankTransferReceiptUrl = undefined;
        if (r.notes && r.notes.startsWith("{")) {
          try {
            const parsed = JSON.parse(r.notes);
            notesText = parsed.notes || undefined;
            bankTransferRef = parsed.bankTransferRef || undefined;
            bankTransferReceiptUrl = parsed.bankTransferReceiptUrl || undefined;
          } catch {}
        }
        return {
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          agreementId: r.agreementId,
          companyName: r.companyName,
          candidateName: r.candidateName || undefined,
          jobTitle: r.jobTitle || undefined,
          amount: r.amount,
          taxAmount: r.taxAmount,
          totalAmount: r.totalAmount,
          currency: r.currency,
          status: r.status as PaymentStatus,
          dueDate: r.dueDate,
          paidDate: r.paidDate || undefined,
          notes: notesText,
          bankTransferRef,
          bankTransferReceiptUrl,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
        };
      }
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }
    return this.invoices.find((i) => i.id === id || i.invoiceNumber === id) || null;
  }

  public async createInvoice(data: Omit<InvoiceRecord, "id" | "invoiceNumber" | "createdAt">): Promise<InvoiceRecord> {
    const id = `inv-${Date.now()}`;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: InvoiceRecord = {
      ...data,
      id,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    try {
      const r = await prisma.invoice.create({
        data: {
          id,
          invoiceNumber,
          agreementId: data.agreementId,
          companyName: data.companyName,
          candidateName: data.candidateName || null,
          jobTitle: data.jobTitle || null,
          amount: data.amount,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          currency: data.currency || "INR",
          status: data.status as any,
          dueDate: data.dueDate,
          paidDate: data.paidDate || null,
          notes: data.notes || null,
        },
      });
      newInvoice.createdAt = r.createdAt.toISOString();
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }

    this.invoices.unshift(newInvoice);
    return newInvoice;
  }

  public async markAsPaid(id: string, paidDate?: string): Promise<InvoiceRecord | null> {
    const defaultPaidDate = paidDate || new Date().toISOString().split("T")[0];
    try {
      const inv = await prisma.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
      });
      if (inv) {
        const r = await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            status: "PAID",
            paidDate: defaultPaidDate,
          },
        });
        const idx = this.invoices.findIndex((i) => i.id === inv.id || i.invoiceNumber === inv.invoiceNumber);
        if (idx !== -1) {
          this.invoices[idx].status = "PAID";
          this.invoices[idx].paidDate = defaultPaidDate;
        }
        return {
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          agreementId: r.agreementId,
          companyName: r.companyName,
          candidateName: r.candidateName || undefined,
          jobTitle: r.jobTitle || undefined,
          amount: r.amount,
          taxAmount: r.taxAmount,
          totalAmount: r.totalAmount,
          currency: r.currency,
          status: r.status as PaymentStatus,
          dueDate: r.dueDate,
          paidDate: r.paidDate || undefined,
          notes: r.notes || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
        };
      }
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }

    const inv = this.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) return null;
    inv.status = "PAID";
    inv.paidDate = defaultPaidDate;
    inv.updatedAt = new Date().toISOString();
    return inv;
  }

  public async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<InvoiceRecord | null> {
    try {
      const inv = await prisma.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
      });
      if (inv) {
        const r = await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: status as any },
        });
        const idx = this.invoices.findIndex((i) => i.id === inv.id || i.invoiceNumber === inv.invoiceNumber);
        if (idx !== -1) {
          this.invoices[idx].status = status;
        }
        return {
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          agreementId: r.agreementId,
          companyName: r.companyName,
          candidateName: r.candidateName || undefined,
          jobTitle: r.jobTitle || undefined,
          amount: r.amount,
          taxAmount: r.taxAmount,
          totalAmount: r.totalAmount,
          currency: r.currency,
          status: r.status as PaymentStatus,
          dueDate: r.dueDate,
          paidDate: r.paidDate || undefined,
          notes: r.notes || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
        };
      }
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }

    const inv = this.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) return null;
    inv.status = status;
    inv.updatedAt = new Date().toISOString();
    return inv;
  }

  public async submitBankReceipt(id: string, bankTransferRef: string, bankTransferReceiptUrl: string): Promise<InvoiceRecord | null> {
    const notesJson = JSON.stringify({
      notes: "Submitted via Bank Transfer",
      bankTransferRef,
      bankTransferReceiptUrl
    });

    try {
      const inv = await prisma.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
      });
      if (inv) {
        const r = await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            status: "PENDING_VERIFICATION" as any,
            notes: notesJson,
          },
        });
        const idx = this.invoices.findIndex((i) => i.id === inv.id || i.invoiceNumber === inv.invoiceNumber);
        if (idx !== -1) {
          this.invoices[idx].status = "PENDING_VERIFICATION";
          this.invoices[idx].notes = notesJson;
          this.invoices[idx].bankTransferRef = bankTransferRef;
          this.invoices[idx].bankTransferReceiptUrl = bankTransferReceiptUrl;
        }
        return this.getInvoiceById(r.id);
      }
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }

    const inv = this.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) return null;
    inv.status = "PENDING_VERIFICATION";
    inv.notes = notesJson;
    inv.bankTransferRef = bankTransferRef;
    inv.bankTransferReceiptUrl = bankTransferReceiptUrl;
    inv.updatedAt = new Date().toISOString();
    return inv;
  }
}

export const invoicesDb = new InvoicesDb();
