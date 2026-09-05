import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";
import { z } from "zod";
import { createStoredFile, StorageUnavailableError } from "@/lib/storage";

const receiptSchema = z.object({
  bankTransferRef: z.string().trim().min(5, "Bank transfer reference/UTR ID is too short"),
  bankTransferReceiptUrl: z.string().min(10, "Receipt file data is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    if (!invoiceId) {
      throw new ApiError("Invoice ID parameter is required.", 400);
    }

    await enforceRateLimit(req, "employer_billing_invoice_receipt", 10, 60000);
    const session = await getCurrentSession(req.headers);
    if (!session) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!["EMPLOYER", "ADMIN"].includes(session.role)) {
      throw new ApiError("Forbidden. Only company owners/admins can upload payment receipts.", 403);
    }

    const body = await readValidatedJson(req, receiptSchema);

    let companyId: string;
    let invoiceRecord: any;

    if (session.role === "ADMIN") {
      invoiceRecord = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoiceRecord) throw new ApiError("Invoice not found.", 404);
      const agreement = await prisma.commercialAgreement.findUnique({
        where: { id: invoiceRecord.agreementId },
      });
      companyId = agreement?.companyId || "";
    } else {
      const company = await getSessionCompany(session);
      companyId = company.id;

      // Verify invoice exists and belongs to this company
      invoiceRecord = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoiceRecord) {
        throw new ApiError("Invoice not found.", 404);
      }

      const agreement = await prisma.commercialAgreement.findUnique({
        where: { id: invoiceRecord.agreementId },
      });

      if (!agreement || agreement.companyId !== companyId) {
        throw new ApiError("Access denied. This invoice does not belong to your company.", 403);
      }
    }

    // Process the file upload securely
    let fileBuffer: Buffer;
    let mimeType = "";
    let extension = "";

    if (body.bankTransferReceiptUrl.startsWith("data:")) {
      const matches = body.bankTransferReceiptUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new ApiError("Invalid receipt data URL format. Only valid image/pdf files are accepted.", 400);
      }
      mimeType = matches[1];
      fileBuffer = Buffer.from(matches[2], "base64");
      const extMatch = mimeType.split("/");
      if (extMatch && extMatch[1]) {
        extension = extMatch[1] === "jpeg" ? "jpg" : extMatch[1];
      }
    } else {
      throw new ApiError("Invalid receipt format. Verification requires uploading base64 proof.", 400);
    }

    // Validation: supported MIME types: PNG, JPEG, PDF only
    const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!ALLOWED_MIMES.includes(mimeType)) {
      throw new ApiError("Unsupported file type. Only PNG, JPEG, and PDF are allowed.", 400);
    }

    // Validation: strict file-size limit (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      throw new ApiError("File size exceeds the 5 MB limit.", 400);
    }

    let storedFile: any;
    try {
      storedFile = await createStoredFile({
        ownerId: session.id,
        companyId: companyId || undefined,
        category: "PAYMENT_RECEIPT",
        originalName: `receipt-${invoiceRecord.invoiceNumber}.${extension}`,
        mimeType,
        data: fileBuffer,
        extension,
      });
    } catch (error) {
      if (error instanceof StorageUnavailableError || (error instanceof Error && error.name === "StorageUnavailableError")) {
        throw new ApiError("Private file storage configuration is missing or unavailable.", 503);
      }
      throw error;
    }

    // Update the invoice status and notes atomically
    const notesJson = JSON.stringify({
      notes: "Submitted via Bank Transfer",
      bankTransferRef: body.bankTransferRef,
      bankTransferReceiptUrl: storedFile.objectKey, // Pointer to private storage via StoredFile objectKey
      storedFileId: storedFile.id,
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PENDING_VERIFICATION" as any,
        notes: notesJson,
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId: companyId || undefined,
      action: "INVOICE_RECEIPT_SUBMITTED",
      resource: `Invoice:${invoiceId}`,
      details: `Submitted bank receipt proof (StoredFile:${storedFile.id}) for invoice ${updatedInvoice.invoiceNumber}. UTR: ${body.bankTransferRef}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Bank transfer receipt submitted successfully for verification!",
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
