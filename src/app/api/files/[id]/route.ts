import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getPrivateDownloadUrl, getPrivateObject } from "@/lib/storage";

async function canAccessFile(userId: string, role: string, file: { ownerId: string; companyId: string | null }) {
  if (role === "ADMIN" || file.ownerId === userId) return true;
  if (!file.companyId || (role !== "EMPLOYER" && role !== "RECRUITER")) return false;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { companyId: true },
  });
  return profile?.companyId === file.companyId;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    const { id } = await params;
    const file = await prisma.storedFile.findFirst({ where: { id, deletedAt: null } });
    if (!file) return jsonError("File not found", 404);
    if (!(await canAccessFile(session.id, session.role, file))) return jsonError("Forbidden", 403);

    const signedUrl = await getPrivateDownloadUrl(file.objectKey, file.originalName);
    if (signedUrl) return NextResponse.redirect(signedUrl, { status: 307 });

    const content = await getPrivateObject(file.objectKey);
    const body = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": `attachment; filename="${file.originalName.replace(/[\\\r\n\"]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
