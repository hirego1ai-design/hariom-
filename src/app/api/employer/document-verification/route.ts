import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, readValidatedJson } from "@/lib/apiSecurity";

/**
 * Employer-scoped document verification endpoint.
 *
 * This route exists so that employer users can submit KYC documents during
 * registration without calling /api/admin/* which the middleware blocks for
 * non-ADMIN sessions. The logic mirrors the admin POST handler but is strictly
 * scoped to the authenticated user — no employerId parameter is accepted.
 */

const DOCUMENT_STATUSES = ["Pending Audit", "Verified", "Rejected"] as const;

const documentSubmissionSchema = z
  .object({
    docType: z.enum([
      "GST Certificate",
      "MSME Certificate",
      "Certificate of Incorporation",
      "PAN Card",
      "Tax Residency",
      "Company Registration",
      "Bank Statement",
    ]),
    storedFileId: z.string().uuid(),
    declaredIdentifier: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .regex(/^[A-Za-z0-9\/-]+$/, "Identifier contains unsupported characters.")
      .transform((value) => value.toUpperCase()),
  })
  .strict();

/** Resolve the employer profile for the authenticated session, scoped to company. */
async function resolveEmployerProfile(session: { id: string; role: string }) {
  const employerUserId = session.role === "ADMIN" ? null : session.id;
  if (employerUserId === null) {
    // Admin callers must provide no employerId here — they use the admin endpoint.
    return null;
  }
  return prisma.employerProfile.findUnique({
    where: { userId: employerUserId },
    include: { company: true, user: true },
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (!["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
      return jsonError("Company access required", 403);
    }

    await enforceRateLimit(req, `employer_doc_verification_read:${session.id}`, 60, 60_000);

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    if (rawStatus && !DOCUMENT_STATUSES.includes(rawStatus as (typeof DOCUMENT_STATUSES)[number])) {
      return jsonError("Invalid document status", 400);
    }

    const rawLimit = Number(searchParams.get("limit") || 50);
    const rawOffset = Number(searchParams.get("offset") || 0);
    if (!Number.isInteger(rawLimit) || !Number.isInteger(rawOffset) || rawLimit < 1 || rawLimit > 100 || rawOffset < 0) {
      return jsonError("Invalid pagination", 400);
    }

    // Scope documents to the authenticated employer's company.
    const employerProfile = await resolveEmployerProfile(session);
    if (!employerProfile) {
      return jsonError("Employer profile not found", 404);
    }

    const where = {
      employerId: employerProfile.id,
      ...(rawStatus ? { status: rawStatus } : {}),
    };

    const [documents, total] = await prisma.$transaction([
      prisma.documentVerification.findMany({
        where,
        include: { employerProfile: { include: { company: true, user: true } } },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: rawLimit,
        skip: rawOffset,
      }),
      prisma.documentVerification.count({ where }),
    ]);

    const formattedDocuments = documents.map((doc) => ({
      id: doc.id,
      employerId: doc.employerProfile?.userId || "",
      employerName: doc.employerProfile?.user?.name || "Unknown",
      companyName: doc.employerProfile?.company?.name || "Unknown",
      docType: doc.docType,
      declaredIdentifier: doc.declaredIdentifier || null,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      submittedAt: doc.submittedAt.toISOString(),
      status: doc.status,
      verifiedBy: doc.verifiedBy || undefined,
      verifiedAt: doc.verifiedAt?.toISOString() || undefined,
    }));

    return NextResponse.json({
      success: true,
      documents: formattedDocuments,
      pagination: { total, limit: rawLimit, offset: rawOffset, hasMore: rawOffset + rawLimit < total },
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

    await enforceRateLimit(req, "employer_document_verification_submit", 10, 60_000);
    const body = await readValidatedJson(req, documentSubmissionSchema, 8 * 1024);

    // Always use the authenticated session's employer profile — no employerId override.
    const employerProfile = await resolveEmployerProfile(session);
    if (!employerProfile) {
      return jsonError("Employer profile not found", 404);
    }

    const documentRecord = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "EmployerProfile" WHERE "id" = ${employerProfile.id} FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "StoredFile" WHERE "id" = ${body.storedFileId} FOR SHARE`;

      const storedFile = await tx.storedFile.findUnique({
        where: { id: body.storedFileId },
        select: { id: true, ownerId: true, companyId: true, category: true, originalName: true, scanStatus: true, deletedAt: true },
      });
      if (!storedFile || storedFile.deletedAt || storedFile.category !== "employer-docs" || storedFile.scanStatus !== "CLEAN") {
        throw new ApiError("KYC document must be an active, malware-scanned employer document.", 409);
      }
      if (storedFile.companyId !== employerProfile.companyId) {
        throw new ApiError("KYC file does not belong to this company.", 403);
      }
      if (session.role !== "ADMIN" && storedFile.ownerId !== session.id) {
        throw new ApiError("KYC file ownership mismatch.", 403);
      }

      const pendingDuplicate = await tx.documentVerification.findFirst({
        where: { employerId: employerProfile.id, docType: body.docType, declaredIdentifier: body.declaredIdentifier, status: "Pending Audit" },
        select: { id: true },
      });
      if (pendingDuplicate) {
        throw new ApiError("This identifier already has a pending verification submission.", 409);
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
