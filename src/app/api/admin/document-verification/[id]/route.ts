import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session || session.role !== "ADMIN") {
      return jsonError("Unauthorized access", 401);
    }

    const { id: documentId } = await params;
    const body = await req.json();
    const { action, verifiedBy } = body;

    // Find document to update
    const documentRecord = await prisma.documentVerification.findUnique({
      where: { id: documentId },
    });

    if (!documentRecord) {
      return jsonError("Document not found", 404);
    }

    if (documentRecord.status !== "Pending Audit") {
      return jsonError("Document is already processed", 400);
    }

    // Update document status
    const updatedDocument = await prisma.documentVerification.update({
      where: { id: documentId },
      data: {
        status: action as any,
        verifiedBy: verifiedBy || session.id,
        verifiedAt: new Date(),
      },
    });

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
