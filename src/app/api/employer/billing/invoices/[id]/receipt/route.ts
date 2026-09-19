import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { z } from "zod";
import { createHash } from "crypto";
import { receiptContentMatchesMime, receiptNotes } from "@/lib/invoiceReceiptState";
import { createStoredFile, deleteObject, StorageUnavailableError } from "@/lib/storage";
import { persistScanResult, scanUpload } from "@/lib/uploadSecurity";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { dispatchCommunication } from "@/lib/communications/dispatcher";

const receiptSchema = z.object({
  bankTransferRef: z.string().trim().min(5, "Bank transfer reference/UTR ID is too short").max(150),
  bankTransferReceiptUrl: z.string().min(10, "Receipt file data is required"),
}).strict();

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

    const body = await readValidatedJson(req, receiptSchema, 7 * 1024 * 1024);

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

    if (invoiceRecord.status === "PAID") throw new ApiError("Paid invoices cannot accept receipts", 409);
    const receiptHash = createHash("sha256").update(body.bankTransferRef).update(body.bankTransferReceiptUrl).digest("hex");
    const previousNotes = receiptNotes(invoiceRecord.notes);
    if (invoiceRecord.status === "PENDING_VERIFICATION") {
      if (previousNotes.receiptHash === receiptHash) return NextResponse.json({ success: true, message: "Receipt already submitted", invoice: { id: invoiceRecord.id, status: invoiceRecord.status } });
      throw new ApiError("Receipt is awaiting review; replacement is not permitted", 409);
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
      const encoded = matches[2];
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
        throw new ApiError("Invalid receipt base64 data.", 400);
      }
      fileBuffer = Buffer.from(encoded, "base64");
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
    if (!receiptContentMatchesMime(fileBuffer, mimeType)) {
      throw new ApiError("Receipt content does not match its declared file type.", 400);
    }

    // Validation: strict file-size limit (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (fileBuffer.length === 0 || fileBuffer.length > MAX_SIZE) {
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

    const scanResult = await scanUpload(storedFile.id, fileBuffer);
    await persistScanResult(storedFile.id, scanResult);
    if (scanResult.status !== "CLEAN") {
      throw new ApiError(scanResult.status === "INFECTED" ? "Receipt rejected by malware scanning." : "Receipt is quarantined pending a successful malware scan.", 422);
    }

    // Update the invoice status and notes atomically
    const notesJson = JSON.stringify({
      ...previousNotes,
      receiptHash,
      receiptSubmittedAt: new Date().toISOString(),
      bankTransferRef: body.bankTransferRef,
      bankTransferReceiptUrl: `/api/files/${storedFile.id}`,
      storedFileId: storedFile.id,
      receiptMimeType: mimeType,
    });

    let updatedInvoice: typeof invoiceRecord;
    try {
      updatedInvoice = await prisma.$transaction(async tx => {
        const currentAgreement = await tx.commercialAgreement.findUnique({
          where: { id: invoiceRecord.agreementId },
          select: { companyId: true },
        });
        if (!currentAgreement) throw new ApiError("Invoice agreement is missing; receipt cannot be submitted", 409);
        if (session.role !== "ADMIN" && currentAgreement.companyId !== companyId) {
          throw new ApiError("Access denied. This invoice no longer belongs to your company.", 403);
        }
        const changed = await tx.invoice.updateMany({
          where: { id: invoiceId, status: invoiceRecord.status, updatedAt: invoiceRecord.updatedAt },
          data: { status: "PENDING_VERIFICATION", notes: notesJson },
        });
        if (changed.count !== 1) throw new ApiError("Invoice changed; refresh before retrying", 409);
        const updated = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
        const auditLog = await tx.auditLog.create({ data: {
          userId: session.id,
          companyId: currentAgreement.companyId,
          action: "INVOICE_RECEIPT_SUBMITTED",
          resource: `Invoice:${invoiceId}`,
          details: `Submitted bank receipt proof (StoredFile:${storedFile.id}) for invoice ${updated.invoiceNumber}`,
          ipAddress: getClientIp(req),
        } });
        await enqueueSecurityAuditEvent(tx, auditLog, session.id);
        return updated;
      });
    } catch (error) {
      try {
        await deleteObject(storedFile.objectKey);
        await prisma.storedFile.delete({ where: { id: storedFile.id } });
      } catch (cleanupError) {
        console.error("INVOICE_RECEIPT_CLEANUP_FAILURE", { storedFileId: storedFile.id, cleanupError });
      }
      throw error;
    }

    const company = companyId ? await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }) : null;
    const recipient = session.email;
    if (recipient) {
      await dispatchCommunication({
        eventKey: "INVOICE_RECEIPT_SUBMITTED",
        channel: "EMAIL",
        audience: "EMPLOYER",
        recipient,
        variables: { company_name: company?.name || invoiceRecord.companyName || "Employer", invoice_number: updatedInvoice.invoiceNumber },
        idempotencyKey: `invoice:${updatedInvoice.id}:receipt:${receiptHash}:employer:email`,
        correlationId: updatedInvoice.id,
        recipientRef: session.id,
      }).catch(() => null);
    }

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
