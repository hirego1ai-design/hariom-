import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getPrivateDownloadUrl, getPrivateObject } from "@/lib/storage";

async function canAccessFile(userId: string, role: string, file: { id: string; ownerId: string; companyId: string | null; category: string }) {
  if (role === "ADMIN" || file.ownerId === userId) return true;
  if (role === "CANDIDATE" && file.category === "offer-docs") {
    const linkedOffer = await prisma.offer.findFirst({
      where: {
        documentFileId: file.id,
        status: { in: ["SENT", "ACCEPTED", "DECLINED"] },
        application: { candidateProfile: { userId } },
      },
      select: { id: true },
    });
    return Boolean(linkedOffer);
  }
  if (role !== "EMPLOYER" && role !== "RECRUITER") return false;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { companyId: true },
  });
  if (!profile?.companyId) return false;
  if (file.category === "video-resumes") {
    // A candidate upload has no companyId. Allow only an employer with an
    // application from this candidate, and only for an active video record.
    const video = await prisma.videoResume.findFirst({
      where: {
        videoUrl: `/api/files/${file.id}`,
        candidateProfile: {
          userId: file.ownerId,
          applications: { some: { job: { companyId: profile.companyId } } },
        },
        OR: [{ retentionExpiresAt: null }, { retentionExpiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });
    return Boolean(video);
  }
  return Boolean(file.companyId && profile.companyId === file.companyId);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "private_file_download", 120, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return jsonError("File not found", 404);
    const file = await prisma.storedFile.findFirst({ where: { id, deletedAt: null } });
    if (!file) return jsonError("File not found", 404);
    if (file.scanStatus !== "CLEAN") return jsonError("File is quarantined and unavailable", 423);
    if (file.category === "PAYMENT_RECEIPT" && session.role !== "ADMIN" && session.role !== "EMPLOYER") {
      return jsonError("Forbidden", 403);
    }
    if (!(await canAccessFile(session.id, session.role, file))) return jsonError("Forbidden", 403);

    const disposition = file.category === "video-resumes" ? "inline" : "attachment";
    const signedUrl = await getPrivateDownloadUrl(file.objectKey, file.originalName, disposition);
    if (signedUrl) return NextResponse.redirect(signedUrl, { status: 307 });

    const content = await getPrivateObject(file.objectKey);
    const body = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": `${disposition}; filename="${file.originalName.replace(/[\\\r\n\"]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
