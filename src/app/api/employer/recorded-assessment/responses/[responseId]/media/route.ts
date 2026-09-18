import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { getPrivateDownloadUrl, getPrivateObject } from "@/lib/storage";

/**
 * Assessment media is candidate-owned and intentionally has no companyId on
 * StoredFile. Employer access therefore follows the hiring relationship rather
 * than weakening the generic file endpoint: response -> attempt -> job ->
 * employer company.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ responseId: string }> }) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { responseId } = await params;
    const response = await prisma.recordedAssessmentResponse.findUnique({
      where: { id: responseId },
      select: {
        storedFile: { select: { objectKey: true, originalName: true, mimeType: true, sizeBytes: true, deletedAt: true } },
        attemptQuestion: { select: { attempt: { select: { jobListing: { select: { companyId: true } } } } } },
      },
    });
    if (!response || response.storedFile.deletedAt) throw new ApiError("Assessment media not found.", 404);

    if (session.role !== "ADMIN") {
      const employer = await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } });
      if (!employer?.companyId || employer.companyId !== response.attemptQuestion.attempt.jobListing.companyId) {
        throw new ApiError("You do not have access to this assessment media.", 403);
      }
    }

    const file = response.storedFile;
    const signedUrl = await getPrivateDownloadUrl(file.objectKey, file.originalName);
    if (signedUrl) return NextResponse.redirect(signedUrl, { status: 307 });

    const content = await getPrivateObject(file.objectKey);
    const body = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": `inline; filename="${file.originalName.replace(/[\\\r\n"]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) { return handleApiError(error); }
}
