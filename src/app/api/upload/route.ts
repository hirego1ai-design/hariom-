import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { createStoredFile } from "@/lib/storage";
import { persistScanResult, scanUpload, validateUploadFile, sanitizeAndGenerateObjectKey, validatePassiveDocumentContent } from "@/lib/uploadSecurity";
import sharp from "sharp";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const MIME_TO_EXT_MAP: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "image/png": ["png"],
  "image/jpeg": ["jpg"],
  "image/webp": ["webp"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "audio/webm": ["webm"],
};

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "private_upload", 20, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "resumes";

    const allowedCategoriesByRole: Record<string, Set<string>> = {
      CANDIDATE: new Set(["resumes", "avatars", "onboarding-docs", "video-resumes", "assessment-media"]),
      EMPLOYER: new Set(["avatars", "company-logos", "employer-docs", "assessment-media"]),
      RECRUITER: new Set(["avatars", "company-logos", "employer-docs", "assessment-media"]),
      ADMIN: new Set(["resumes", "avatars", "onboarding-docs", "video-resumes", "company-logos", "employer-docs", "assessment-media"]),
    };
    if (!allowedCategoriesByRole[session.role]?.has(category)) {
      return jsonError("Invalid upload category", 400);
    }

    if (!file) {
      return jsonError("No file uploaded", 400);
    }

    const { valid, error: validationError } = validateUploadFile(file.type, file.size, MAX_FILE_SIZE_BYTES);
    if (!valid) {
      return jsonError(validationError || "Invalid file", 415);
    }

    const safeName = sanitizeAndGenerateObjectKey(file.name);

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    const header = buffer.subarray(0, 16).toString("hex").toUpperCase();
    const headerAscii = buffer.subarray(0, 16).toString("ascii");
    let serverExt = "";
    if (headerAscii.startsWith("%PDF")) serverExt = "pdf";
    else if (header.startsWith("89504E47")) serverExt = "png";
    else if (header.startsWith("FFD8FF")) serverExt = "jpg";
    else if (headerAscii.startsWith("RIFF") && headerAscii.substring(8, 12) === "WEBP") serverExt = "webp";
    else if (headerAscii.includes("ftyp")) serverExt = "mp4";
    else if (header.startsWith("1A45DFA3")) serverExt = "webm";
    else if (header.startsWith("504B0304")) serverExt = "docx";
    else {
      return jsonError("Invalid file signature", 415);
    }

    // Verify claimed MIME type matches detected signature.
    const validExtensions = MIME_TO_EXT_MAP[file.type] || [];
    if (!validExtensions.includes(serverExt)) {
      return jsonError("File content does not match claimed MIME type", 415);
    }

    const passiveDocument = validatePassiveDocumentContent(file.type, buffer);
    if (!passiveDocument.valid) {
      return jsonError(passiveDocument.error || "Active document content is not permitted.", 415);
    }

    // Scan the exact original bytes before any local decoder/parser is invoked.
    // Production scanner failure is fail-closed and no object is persisted.
    const preflightScan = await scanUpload(`preflight-${crypto.randomUUID()}`, buffer);
    if (preflightScan.status !== "CLEAN") {
      throw new ApiError(
        preflightScan.status === "INFECTED"
          ? "Upload rejected by malware scanning."
          : "Upload security scanning is temporarily unavailable.",
        preflightScan.status === "INFECTED" ? 422 : 503,
      );
    }

    // Decode and re-encode raster images before persistence. This rejects
    // malformed/decompression-bomb inputs and strips EXIF/XMP/embedded metadata.
    if (["jpg", "png", "webp"].includes(serverExt)) {
      try {
        const image = sharp(buffer, {
          failOn: "warning",
          limitInputPixels: 25_000_000,
          animated: false,
        }).rotate();
        if (serverExt === "jpg") buffer = await image.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        else if (serverExt === "png") buffer = await image.png({ compressionLevel: 9 }).toBuffer();
        else buffer = await image.webp({ quality: 90 }).toBuffer();
      } catch {
        return jsonError("Image could not be safely decoded and normalized.", 415);
      }
      if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
        return jsonError("Normalized image exceeds the maximum allowed size.", 413);
      }
    }

    const profile = (session.role === "EMPLOYER" || session.role === "RECRUITER")
      ? await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } })
      : null;
    if ((session.role === "EMPLOYER" || session.role === "RECRUITER") && !profile?.companyId) {
      throw new ApiError("Employer company membership is required for this upload.", 403);
    }
    const storedFile = await createStoredFile({
      ownerId: session.id,
      companyId: profile?.companyId,
      category,
      originalName: safeName,
      mimeType: file.type,
      data: buffer,
      extension: serverExt,
    });

    // The stored bytes are either the scanned original (documents/media) or a
    // decoded/re-encoded raster image derived from the scanned original.
    await persistScanResult(storedFile.id, {
      status: "CLEAN",
      detail: preflightScan.detail || "Pre-storage malware scan passed.",
    });

    return NextResponse.json({
      success: true,
      file: {
        name: safeName,
        size: buffer.byteLength,
        type: file.type,
        id: storedFile.id,
        url: `/api/files/${storedFile.id}`,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
