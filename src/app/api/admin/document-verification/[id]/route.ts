import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const verificationActionSchema = z.object({
  action: z.enum(["Verified", "Rejected"]),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_document_verification_write:${session.id}`, 20, 60_000);

    const { id: documentId } = await params;
    const { action, notes } = await readValidatedJson(
      req,
      verificationActionSchema,
      8 * 1024,
    );

    if (action === "Rejected" && !notes?.trim()) {
      throw new ApiError("A rejection reason is required for KYC review.", 400);
    }

    const updatedDocument = await prisma.$transaction(async (tx) => {
      const transitioned = await tx.documentVerification.updateMany({
        where: { id: documentId, status: "Pending Audit" },
        data: {
          status: action,
          verifiedBy: session.id,
          verifiedAt: new Date(),
        },
      });
      if (transitioned.count !== 1) return null;

      const updated = await tx.documentVerification.findUnique({
        where: { id: documentId },
      });
      if (!updated) return null;

      await tx.documentVerificationLog.create({
        data: {
          documentId,
          action: action === "Verified" ? "VERIFY" : "REJECT",
          performedBy: session.id,
          notes: notes || null,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: action === "Verified" ? "KYC_DOCUMENT_VERIFIED" : "KYC_DOCUMENT_REJECTED",
          resource: `DocumentVerification:${documentId}`,
          ipAddress: getClientIp(req) || "unknown",
          details: `KYC ${updated.docType} review completed; reviewer note recorded=${Boolean(notes?.trim())}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return updated;
    });

    if (!updatedDocument) {
      throw new ApiError("Document not found or already processed.", 409);
    }

    return NextResponse.json({
      success: true,
      message: `Document ${action.toLowerCase()} successfully`,
      document: {
        id: updatedDocument.id,
        status: updatedDocument.status,
        verifiedBy: updatedDocument.verifiedBy,
        verifiedAt: updatedDocument.verifiedAt?.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
