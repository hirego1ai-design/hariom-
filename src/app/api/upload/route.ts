import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
];

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "resumes";

    const ALLOWED_UPLOAD_CATEGORIES = new Set(["resumes", "avatars", "company-logos", "assessment-media"]);
    if (!ALLOWED_UPLOAD_CATEGORIES.has(category)) {
      return jsonError("Invalid upload category", 400);
    }

    if (!file) {
      return jsonError("No file uploaded", 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError("File size exceeds 10MB limit", 413);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonError("Invalid file type. Supported formats: PDF, DOCX, PNG, JPEG, MP4", 415);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const header = buffer.subarray(0, 16).toString("hex").toUpperCase();
    const headerAscii = buffer.subarray(0, 16).toString("ascii");
    let serverExt = "";
    if (headerAscii.startsWith("%PDF")) serverExt = "pdf";
    else if (header.startsWith("89504E47")) serverExt = "png";
    else if (header.startsWith("FFD8FF")) serverExt = "jpg";
    else if (headerAscii.startsWith("RIFF") && headerAscii.substring(8, 12) === "WEBP") serverExt = "webp";
    else if (headerAscii.includes("ftyp")) serverExt = "mp4";
    else if (header.startsWith("504B0304") || header.startsWith("D0CF")) serverExt = "docx";
    else {
      return jsonError("Invalid file signature", 415);
    }

    const baseDir = path.resolve(path.join(process.cwd(), "public", "uploads"));
    const uploadDir = path.join(baseDir, category);
    const relative = path.relative(baseDir, uploadDir);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return jsonError("Invalid upload path", 400);
    }

    await mkdir(uploadDir, { recursive: true });

    const filename = `${crypto.randomUUID()}.${serverExt}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${category}/${filename}`;

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
