import { NextRequest, NextResponse } from "next/server";
import { invoicesDb } from "@/lib/invoices-db";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    requireAdminSession(req);
    const invoices = await invoicesDb.getInvoices();
    const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalCollected = invoices.filter((i) => i.status === "PAID").reduce((acc, i) => acc + i.totalAmount, 0);
    const totalOverdue = invoices.filter((i) => i.status === "OVERDUE" || i.status === "UNPAID").reduce((acc, i) => acc + i.totalAmount, 0);

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
    requireAdminSession(req);
    const body = await req.json();

    if (body.action === "mark_paid") {
      const updated = await invoicesDb.markAsPaid(body.invoiceId, body.paidDate);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Invoice marked as paid", invoice: updated });
    }

    if (body.action === "submit_receipt") {
      const updated = await invoicesDb.submitBankReceipt(body.invoiceId, body.bankTransferRef, body.bankTransferReceiptUrl || "");
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Bank receipt submitted successfully", invoice: updated });
    }

    if (body.action === "reject_receipt") {
      const updated = await invoicesDb.updateInvoiceStatus(body.invoiceId, "UNPAID");
      if (!updated) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Bank transfer receipt rejected", invoice: updated });
    }


    const requiredFields = ["companyName", "amount"];
    for (const f of requiredFields) {
      if (!body[f]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${f}` }, { status: 400 });
      }
    }

    const amount = Number(body.amount);
    const taxAmount = Number(body.taxAmount) || Math.round(amount * 0.18);
    const totalAmount = amount + taxAmount;

    const created = await invoicesDb.createInvoice({
      agreementId: body.agreementId || "agr-1001",
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
