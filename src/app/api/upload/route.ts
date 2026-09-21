import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { createStoredFile } from "@/lib/storage";
import {
  assertDetectedTypeMatchesMime,
  assertNoActiveDocumentContent,
  detectUploadExtension,
  normalizeUploadForStorage,
  persistScanResult,
  scanUpload,
  sanitizeAndGenerateObjectKey,
  validateUploadFile,
} from "@/lib/uploadSecurity";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_REQUEST_BYTES = MAX_FILE_SIZE_BYTES + 512 * 1024;

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "private_upload", 20, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_REQUEST_BYTES) {
      return jsonError("Upload request exceeds the maximum allowed size", 413);
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
    if (!allowedCategoriesByRole[session.role]?.has(category)) return jsonError("Invalid upload category", 400);
    if (!file) return jsonError("No file uploaded", 400);

    const validation = validateUploadFile(file.type, file.size, MAX_FILE_SIZE_BYTES);
    if (!validation.valid) return jsonError(validation.error || "Invalid file", 415);

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    const detectedExtension = detectUploadExtension(originalBuffer);
    if (!detectedExtension) return jsonError("Invalid file signature", 415);

    try {
      assertDetectedTypeMatchesMime(file.type, detectedExtension);
      assertNoActiveDocumentContent(originalBuffer, file.type);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unsafe file content", 415);
    }

    // Scan the exact original bytes before any local decoder/parser is invoked.
    // Production scanner failure is fail-closed and no object is persisted.
    const preflightId = `preflight-${crypto.randomUUID()}`;
    const scanResult = await scanUpload(preflightId, originalBuffer);
    if (scanResult.status !== "CLEAN") {
      throw new ApiError(
        scanResult.status === "INFECTED"
          ? "Upload rejected by malware scanning."
          : "Upload security scanning is temporarily unavailable.",
        scanResult.status === "INFECTED" ? 422 : 503,
      );
    }

    let normalized;
    try {
      normalized = await normalizeUploadForStorage(originalBuffer, file.type, detectedExtension);
    } catch {
      throw new ApiError("Upload could not be decoded safely.", 415);
    }

    const profile = (session.role === "EMPLOYER" || session.role === "RECRUITER")
      ? await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } })
      : null;
    if ((session.role === "EMPLOYER" || session.role === "RECRUITER") && !profile?.companyId) {
      throw new ApiError("Employer company membership is required for this upload.", 403);
    }

    const safeName = sanitizeAndGenerateObjectKey(file.name);
    const storedFile = await createStoredFile({
      ownerId: session.id,
      companyId: profile?.companyId,
      category,
      originalName: safeName,
      mimeType: normalized.mimeType,
      data: normalized.data,
      extension: normalized.extension,
    });

    // The stored bytes are either the scanned original (documents/media) or a
    // decoded/re-encoded raster image derived from the scanned original.
    await persistScanResult(storedFile.id, { status: "CLEAN", detail: scanResult.detail || "Pre-storage malware scan passed." });

    return NextResponse.json({
      success: true,
      file: {
        name: safeName,
        size: normalized.data.byteLength,
        type: normalized.mimeType,
        id: storedFile.id,
        url: `/api/files/${storedFile.id}`,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
