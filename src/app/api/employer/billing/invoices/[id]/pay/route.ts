import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    if (!invoiceId) {
      throw new ApiError("Invoice ID parameter is required.", 400);
    }

    await enforceRateLimit(req, "employer_billing_invoice_pay", 10, 60000);
    const session = await getCurrentSession(req.headers);
    if (!session) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!["EMPLOYER", "ADMIN"].includes(session.role)) {
      throw new ApiError("Forbidden. Only company owners/admins can execute payments.", 403);
    }

    let companyId: string;
    if (session.role === "ADMIN") {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) throw new ApiError("Invoice not found.", 404);
      companyId = ""; 
    } else {
      const company = await getSessionCompany(session);
      companyId = company.id;

      // Verify the invoice belongs to the company by looking up the agreement
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) {
        throw new ApiError("Invoice not found.", 404);
      }

      const agreement = await prisma.commercialAgreement.findUnique({
        where: { id: invoice.agreementId },
      });

      if (!agreement || agreement.companyId !== companyId) {
        throw new ApiError("Access denied. This invoice does not belong to your company.", 403);
      }
    }

    // Online payment configuration is unavailable
    throw new ApiError("Online payment is not configured. Please use bank-transfer receipt submission.", 503);
  } catch (error) {
    return handleApiError(error);
  }
}
