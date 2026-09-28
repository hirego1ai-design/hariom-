import { NextRequest, NextResponse } from "next/server";
import { invoicesDb, presentInvoice } from "@/lib/invoices-db";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, handleApiError, readValidatedJson, enforceRateLimit, getClientIp } from "@/lib/apiSecurity";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchAdminDirectCommunication, dispatchCommunication } from "@/lib/communications/dispatcher";
import { buildPublicAppUrl } from "@/lib/env";

const reviewSchema = z.object({
  action: z.enum(["mark_paid", "reject_receipt"]),
  invoiceId: z.string().min(1).max(150),
  paidDate: z.string().date().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  reason: z.string().trim().min(3).max(1000).optional(),
}).strict();

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["PAID", "UNPAID", "OVERDUE", "PENDING_VERIFICATION"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
const createSchema = z.object({
  action: z.literal("create").optional(),
  agreementId: z.string().min(1).max(150),
  candidateName: z.string().trim().min(1).max(200).optional(),
  jobTitle: z.string().trim().min(1).max(200).optional(),
  amount: z.number().finite().positive().max(1_000_000_000),
}).strict();

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_invoices_read:${session.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));

    const where: Prisma.InvoiceWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search, mode: "insensitive" } },
              { companyName: { contains: query.search, mode: "insensitive" } },
              { candidateName: { contains: query.search, mode: "insensitive" } },
              { jobTitle: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows, grouped] = await prisma.$transaction([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.invoice.groupBy({
        by: ["currency", "status"],
        where,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const currencies = [...new Set(grouped.map((row) => row.currency))].sort();
    const byCurrency = Object.fromEntries(
      currencies.map((currency) => {
        const rowsForCurrency = grouped.filter((row) => row.currency === currency);
        const amountFor = (...statuses: string[]) =>
          rowsForCurrency
            .filter((row) => statuses.includes(row.status))
            .reduce((sum, row) => sum + (row._sum.totalAmount ?? 0), 0);
        const countFor = (...statuses: string[]) =>
          rowsForCurrency
            .filter((row) => statuses.includes(row.status))
            .reduce((sum, row) => sum + row._count._all, 0);

        return [
          currency,
          {
            currency,
            totalBilled: rowsForCurrency.reduce((sum, row) => sum + (row._sum.totalAmount ?? 0), 0),
            totalCollected: amountFor("PAID"),
            totalOutstanding: amountFor("UNPAID", "OVERDUE", "PENDING_VERIFICATION"),
            totalOverdue: amountFor("OVERDUE"),
            pendingVerification: amountFor("PENDING_VERIFICATION"),
            invoiceCount: countFor("PAID", "UNPAID", "OVERDUE", "PENDING_VERIFICATION"),
            paidCount: countFor("PAID"),
            overdueCount: countFor("OVERDUE"),
          },
        ];
      }),
    );

    return NextResponse.json({
      success: true,
      page: query.page,
      limit: query.limit,
      total,
      summary: {
        currencyMode: currencies.length <= 1 ? "single" : "multiple",
        currencies,
        byCurrency,
        count: total,
      },
      invoices: rows.map(presentInvoice),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_invoice_review:${session.id}`, 30, 60000);
    const body = await readValidatedJson(req, z.union([reviewSchema, createSchema]));

    if (body.action === "mark_paid") {
      if (body.paidDate && body.paidDate > new Date().toISOString().slice(0, 10)) throw new ApiError("Payment date cannot be in the future", 400);
      const updated = await invoicesDb.reviewReceipt(body.invoiceId, "approve", session.id, body.paidDate, body.expectedUpdatedAt, getClientIp(req), body.reason);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      const agreement = await prisma.commercialAgreement.findUnique({ where: { id: updated.agreementId }, select: { clientEmail: true, clientPhone: true, companyName: true } });
      if (agreement?.clientEmail) await dispatchCommunication({ eventKey: "INVOICE_PAYMENT_VERIFIED", channel: "EMAIL", audience: "EMPLOYER", recipient: agreement.clientEmail, variables: { company_name: agreement.companyName, invoice_number: updated.invoiceNumber, amount: updated.totalAmount, currency: updated.currency }, idempotencyKey: `invoice:${updated.id}:paid:employer:email`, correlationId: updated.id }).catch(() => null);
      if (agreement?.clientPhone) await dispatchCommunication({ eventKey: "INVOICE_PAYMENT_VERIFIED", channel: "WHATSAPP", audience: "EMPLOYER", recipient: agreement.clientPhone, variables: { company_name: agreement.companyName, invoice_number: updated.invoiceNumber, amount: updated.totalAmount, currency: updated.currency }, idempotencyKey: `invoice:${updated.id}:paid:employer:whatsapp`, correlationId: updated.id }).catch(() => null);
      return NextResponse.json({ success: true, message: "Invoice marked as paid", invoice: updated });
    }

    if (body.action === "reject_receipt") {
      if (!body.reason?.trim()) throw new ApiError("A rejection reason is required.", 400);
      const updated = await invoicesDb.reviewReceipt(body.invoiceId, "reject", session.id, undefined, body.expectedUpdatedAt, getClientIp(req), body.reason);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Bank transfer receipt rejected", invoice: updated });
    }

    if ("invoiceId" in body) throw new ApiError("Invalid action", 400);
    const amount = Number(body.amount);
    const commercialTerms = await prisma.commercialAgreement.findUnique({
      where: { id: body.agreementId },
      select: {
        taxRatePct: true,
        creditDays: true,
        requirement: { select: { currency: true } },
      },
    });
    if (!commercialTerms) throw new ApiError("A valid commercial agreement is required", 400);
    const currency = commercialTerms.requirement?.currency?.trim().toUpperCase();
    if (!currency || !/^[A-Z]{3}$/.test(currency)) {
      throw new ApiError("The agreement must be linked to a hiring requirement with an authoritative billing currency.", 409);
    }
    if (!Number.isFinite(commercialTerms.taxRatePct) || commercialTerms.taxRatePct < 0 || commercialTerms.taxRatePct > 100) {
      throw new ApiError("The agreement has invalid tax terms and cannot be invoiced.", 409);
    }
    if (!Number.isInteger(commercialTerms.creditDays) || commercialTerms.creditDays < 0 || commercialTerms.creditDays > 3650) {
      throw new ApiError("The agreement has invalid credit terms and cannot be invoiced.", 409);
    }

    const taxAmount = Math.round(amount * (commercialTerms.taxRatePct / 100) * 100) / 100;
    const totalAmount = amount + taxAmount;
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + commercialTerms.creditDays);
    const dueDate = due.toISOString().slice(0, 10);

    const created = await invoicesDb.createInvoice({
      agreementId: body.agreementId,
      candidateName: body.candidateName,
      jobTitle: body.jobTitle,
      amount,
      taxAmount,
      totalAmount,
      currency,
      status: "UNPAID",
      dueDate,
    }, {
      actorId: session.id,
      ipAddress: getClientIp(req),
    });

    const agreement = await prisma.commercialAgreement.findUnique({ where: { id: created.agreementId }, select: { clientEmail: true, clientPhone: true, companyName: true } });
    const invoiceVars = { company_name: agreement?.companyName || created.companyName, invoice_number: created.invoiceNumber, amount: created.totalAmount, currency: created.currency, due_date: created.dueDate, invoice_link: buildPublicAppUrl("/employer/billing/invoices") };
    if (agreement?.clientEmail) await dispatchAdminDirectCommunication({ eventKey: "INVOICE_GENERATED", channel: "EMAIL", audience: "EMPLOYER", recipient: agreement.clientEmail, variables: invoiceVars, idempotencyKey: `invoice:${created.id}:generated:employer:email`, correlationId: created.id }).catch(() => null);
    if (agreement?.clientPhone) await dispatchAdminDirectCommunication({ eventKey: "INVOICE_GENERATED", channel: "WHATSAPP", audience: "EMPLOYER", recipient: agreement.clientPhone, variables: invoiceVars, idempotencyKey: `invoice:${created.id}:generated:employer:whatsapp`, correlationId: created.id }).catch(() => null);
    return NextResponse.json({ success: true, message: "Invoice created successfully", invoice: created });
  } catch (error) {
    return handleApiError(error);
  }
}
