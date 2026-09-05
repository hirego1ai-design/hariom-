import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_billing_invoices_get", 30, 60000);
    const session = await getCurrentSession(req.headers);
    if (!session) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!["EMPLOYER", "ADMIN"].includes(session.role)) {
      throw new ApiError("Forbidden. Only company owners/admins can view billing information.", 403);
    }

    let companyId: string;
    if (session.role === "ADMIN") {
      const url = new URL(req.url);
      const queryCompanyId = url.searchParams.get("companyId");
      if (!queryCompanyId) {
        throw new ApiError("companyId query parameter is required for administrators", 400);
      }
      companyId = queryCompanyId;
    } else {
      const company = await getSessionCompany(session);
      companyId = company.id;
    }

    // Resolve company invoices by mapping agreements first (since Invoice doesn't have companyId)
    const agreements = await prisma.commercialAgreement.findMany({
      where: { companyId },
      select: { id: true },
    });
    const agreementIds = agreements.map((a) => a.id);

    const invoices = await prisma.invoice.findMany({
      where: {
        agreementId: { in: agreementIds },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse bank transfer notes if present
    const parsedInvoices = invoices.map((r) => {
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
        status: r.status,
        dueDate: r.dueDate,
        paidDate: r.paidDate || undefined,
        notes: notesText,
        bankTransferRef,
        bankTransferReceiptUrl,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      invoices: parsedInvoices,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
