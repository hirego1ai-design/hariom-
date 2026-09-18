import { NextRequest, NextResponse } from "next/server";
import { invoicesDb } from "@/lib/invoices-db";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, handleApiError, readValidatedJson, enforceRateLimit, getClientIp } from "@/lib/apiSecurity";
import { z } from "zod";

const reviewSchema = z.object({ action: z.enum(["mark_paid", "reject_receipt"]), invoiceId: z.string().min(1).max(150), paidDate: z.string().date().optional(), expectedUpdatedAt: z.string().datetime().optional() }).strict();
const createSchema = z.object({ action: z.literal("create").optional(), agreementId: z.string().min(1), companyName: z.string().trim().min(1).max(200).optional(), candidateName: z.string().max(200).optional(), jobTitle: z.string().max(200).optional(), amount: z.number().finite().positive().max(1000000000), taxAmount: z.number().finite().nonnegative().max(1000000000).optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional(), dueDate: z.string().date().optional(), status: z.literal("UNPAID").optional() }).strict();

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_invoices_read", 60, 60_000);
    const invoices = await invoicesDb.getInvoices();
    const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalCollected = invoices.filter((i) => i.status === "PAID").reduce((acc, i) => acc + i.totalAmount, 0);
    const totalOverdue = invoices.filter((i) => i.status !== "PAID").reduce((acc, i) => acc + i.totalAmount, 0);

    return NextResponse.json({
      success: true,
      summary: { totalBilled, totalCollected, totalOverdue, count: invoices.length },
      invoices,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, "admin_invoice_review", 30, 60000);
    const body = await readValidatedJson(req, z.union([reviewSchema, createSchema]));

    if (body.action === "mark_paid") {
      if (body.paidDate && body.paidDate > new Date().toISOString().slice(0, 10)) throw new ApiError("Payment date cannot be in the future", 400);
      const updated = await invoicesDb.reviewReceipt(body.invoiceId, "approve", session.id, body.paidDate, body.expectedUpdatedAt, getClientIp(req));
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Invoice marked as paid", invoice: updated });
    }

    if (body.action === "reject_receipt") {
      const updated = await invoicesDb.reviewReceipt(body.invoiceId, "reject", session.id, undefined, body.expectedUpdatedAt, getClientIp(req));
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Bank transfer receipt rejected", invoice: updated });
    }


    if ("invoiceId" in body) throw new ApiError("Invalid action", 400);
    const amount = Number(body.amount);
    const taxAmount = body.taxAmount ?? Math.round(amount * 0.18 * 100) / 100;
    const totalAmount = amount + taxAmount;

    const created = await invoicesDb.createInvoice({
      agreementId: body.agreementId,
      companyName: body.companyName,
      candidateName: body.candidateName || "Candidate Placement",
      jobTitle: body.jobTitle || "Software Engineer",
      amount,
      taxAmount,
      totalAmount,
      currency: body.currency || "INR",
      status: body.status || "UNPAID",
      dueDate: body.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });

    return NextResponse.json({ success: true, message: "Invoice created successfully", invoice: created });
  } catch (error) {
    return handleApiError(error);
  }
}
