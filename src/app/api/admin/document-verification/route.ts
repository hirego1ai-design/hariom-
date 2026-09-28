import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  enforceRateLimit,
  readValidatedJson,
} from "@/lib/apiSecurity";

const DOCUMENT_TYPES = [
  "GST Certificate",
  "MSME Certificate",
  "Certificate of Incorporation",
  "PAN Card",
  "Tax Residency",
  "Company Registration",
  "Bank Statement",
] as const;

const DOCUMENT_STATUSES = ["Pending Audit", "Verified", "Rejected"] as const;

const documentSubmissionSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES),
  storedFileId: z.string().uuid(),
  declaredIdentifier: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9\/-]+$/, "Identifier contains unsupported characters.")
    .transform((value) => value.toUpperCase()),
  employerId: z.string().uuid().optional(),
}).strict();

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentRecord {
  id: string;
  employerId: string;
  employerName: string;
  companyName: string;
  docType: DocumentType;
  declaredIdentifier: string | null;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: "Pending Audit" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_document_verification_read:${session.id}`, 60, 60_000);

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    if (
      rawStatus &&
      !DOCUMENT_STATUSES.includes(
        rawStatus as (typeof DOCUMENT_STATUSES)[number],
      )
    ) {
      return jsonError("Invalid document status", 400);
    }

    const rawLimit = Number(searchParams.get("limit") || 50);
    const rawOffset = Number(searchParams.get("offset") || 0);
    if (
      !Number.isInteger(rawLimit) ||
      !Number.isInteger(rawOffset) ||
      rawLimit < 1 ||
      rawLimit > 100 ||
      rawOffset < 0
    ) {
      return jsonError("Invalid pagination", 400);
    }

    const where = rawStatus ? { status: rawStatus } : {};
    const [documents, total] = await prisma.$transaction([
      prisma.documentVerification.findMany({
        where,
        include: {
          employerProfile: {
            include: { company: true, user: true },
          },
        },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: rawLimit,
        skip: rawOffset,
      }),
      prisma.documentVerification.count({ where }),
    ]);

    const formattedDocuments: DocumentRecord[] = documents.map((doc) => ({
      id: doc.id,
      employerId: doc.employerProfile?.userId || "",
      employerName: doc.employerProfile?.user?.name || "Unknown",
      companyName: doc.employerProfile?.company?.name || "Unknown",
      docType: doc.docType as DocumentType,
      declaredIdentifier: doc.declaredIdentifier || null,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      submittedAt: doc.submittedAt.toISOString(),
      status: doc.status as DocumentRecord["status"],
      verifiedBy: doc.verifiedBy || undefined,
      verifiedAt: doc.verifiedAt?.toISOString() || undefined,
    }));

    return NextResponse.json({
      success: true,
      documents: formattedDocuments,
      pagination: {
        total,
        limit: rawLimit,
        offset: rawOffset,
        hasMore: rawOffset + rawLimit < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (!["EMPLOYER", "ADMIN"].includes(session.role)) {
      return jsonError("Company administrator access required", 403);
    }

    await enforceRateLimit(req, "document_verification_submit", 10, 60_000);
    const body = await readValidatedJson(
      req,
      documentSubmissionSchema,
      8 * 1024,
    );

    if (body.employerId && session.role !== "ADMIN") {
      return jsonError("employerId is administrator-controlled", 403);
    }
    const employerUserId =
      session.role === "ADMIN" && body.employerId
        ? body.employerId
        : session.id;

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: employerUserId },
      include: { company: true, user: true },
    });
    if (!employerProfile) {
      return jsonError("Employer profile not found", 404);
    }

    const documentRecord = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "EmployerProfile"
        WHERE "id" = ${employerProfile.id}
        FOR UPDATE
      `;
      await tx.$queryRaw`
        SELECT "id"
        FROM "StoredFile"
        WHERE "id" = ${body.storedFileId}
        FOR SHARE
      `;

      const storedFile = await tx.storedFile.findUnique({
        where: { id: body.storedFileId },
        select: {
          id: true,
          ownerId: true,
          companyId: true,
          category: true,
          originalName: true,
          scanStatus: true,
          deletedAt: true,
        },
      });
      if (
        !storedFile ||
        storedFile.deletedAt ||
        storedFile.category !== "employer-docs" ||
        storedFile.scanStatus !== "CLEAN"
      ) {
        throw new ApiError(
          "KYC document must be an active, malware-scanned employer document.",
          409,
        );
      }
      if (storedFile.companyId !== employerProfile.companyId) {
        throw new ApiError("KYC file does not belong to this company.", 403);
      }
      if (
        session.role !== "ADMIN" &&
        storedFile.ownerId !== session.id
      ) {
        throw new ApiError("KYC file ownership mismatch.", 403);
      }

      const pendingDuplicate = await tx.documentVerification.findFirst({
        where: {
          employerId: employerProfile.id,
          docType: body.docType,
          declaredIdentifier: body.declaredIdentifier,
          status: "Pending Audit",
        },
        select: { id: true },
      });
      if (pendingDuplicate) {
        throw new ApiError(
          "This identifier already has a pending verification submission.",
          409,
        );
      }

      const created = await tx.documentVerification.create({
        data: {
          employerId: employerProfile.id,
          docType: body.docType,
          declaredIdentifier: body.declaredIdentifier,
          fileUrl: `/api/files/${storedFile.id}`,
          fileName: storedFile.originalName,
          status: "Pending Audit",
          riskScore: "UNASSESSED",
        },
      });

      await tx.documentVerificationLog.create({
        data: {
          documentId: created.id,
          action: "SUBMIT",
          performedBy: session.id,
          notes: "Employer KYC document submitted for manual review.",
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document submitted for manual verification.",
        document: {
          id: documentRecord.id,
          status: documentRecord.status,
          declaredIdentifier: documentRecord.declaredIdentifier,
          submittedAt: documentRecord.submittedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
