import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { getPrivateDownloadUrl, getPrivateObject } from "@/lib/storage";
import { effectivePublishedWhere } from "@/lib/contentCms";
import { handleApiError, jsonError } from "@/lib/apiSecurity";

function validId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!validId(id)) return jsonError("Image not found.", 404);

    const file = await prisma.storedFile.findFirst({
      where: {
        id,
        category: "content-media",
        deletedAt: null,
        scanStatus: "CLEAN",
        mimeType: { in: ["image/jpeg", "image/png", "image/webp"] },
      },
    });
    if (!file) return jsonError("Image not found.", 404);

    const session = await getCurrentSession(req.headers);
    const adminPreview = session?.role === "ADMIN";
    const publishedUse = adminPreview
      ? true
      : Boolean(
          await prisma.editorialContent.findFirst({
            where: {
              AND: [
                effectivePublishedWhere(),
                {
                  OR: [
                    { featuredImageFileId: id },
                    { ogImageFileId: id },
                    { inlineMediaFileIds: { has: id } },
                  ],
                },
              ],
            },
            select: { id: true },
          }),
        );

    if (!publishedUse) return jsonError("Image not found.", 404);

    const signedUrl = await getPrivateDownloadUrl(file.objectKey, file.originalName, "inline");
    if (signedUrl) return NextResponse.redirect(signedUrl, { status: 307 });

    const content = await getPrivateObject(file.objectKey);
    const body = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": `inline; filename="${file.originalName.replace(/[\\\r\n\"]/g, "_")}"`,
        "Cache-Control": adminPreview ? "private, no-store" : "public, max-age=300, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
