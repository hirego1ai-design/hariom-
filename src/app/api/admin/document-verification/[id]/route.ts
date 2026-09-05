import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verificationActionSchema = z.object({
  action: z.enum(["Verified", "Rejected"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Authentication required", 401);
    if (session.role !== "ADMIN") return jsonError("Administrator access required", 403);

    const { id: documentId } = await params;
    const parsed = verificationActionSchema.safeParse(await req.json());
    if (!parsed.success) return jsonError("Invalid verification action or notes", 400);
    const { action, notes } = parsed.data;

    // Keep the status transition and immutable audit trail in one transaction.
    // The acting admin always comes from the verified session; never trust a
    // client-supplied verifiedBy value. The conditional update makes the
    // pending-state transition atomic, so two admins cannot process the same
    // document concurrently and create duplicate audit entries.
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

      const updated = await tx.documentVerification.findUnique({ where: { id: documentId } });
      if (!updated) return null;
      await tx.documentVerificationLog.create({
        data: {
          documentId,
          action: action === "Verified" ? "VERIFY" : "REJECT",
          performedBy: session.id,
          notes: notes || null,
        },
      });
      return updated;
    });

    if (!updatedDocument) {
      return jsonError("Document not found or already processed", 409);
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
