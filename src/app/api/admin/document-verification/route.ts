import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { createDevDocumentVerification, getDevDocumentVerifications } from "@/lib/document-verification-store";
import { z } from "zod";

// Document types that require admin verification
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
  fileUrl: z.string().trim().url().max(2048),
  fileName: z.string().trim().min(1).max(255),
  companyName: z.string().trim().max(255).optional(),
  employerId: z.string().trim().min(1).max(191).optional(),
});

export type DocumentType = typeof DOCUMENT_TYPES[number];

export interface DocumentRecord {
  id: string;
  employerId: string;
  employerName: string;
  companyName: string;
  docType: DocumentType;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: "Pending Audit" | "Verified" | "Rejected";
  riskScore: "Low" | "Medium" | "High";
  verifiedBy?: string;
  verifiedAt?: string;
}

// Helper to calculate risk score based on document type and company profile
function calculateRiskScore(docType: DocumentType, companyProfile: any): "Low" | "Medium" | "High" {
  // GST and PAN cards are generally lower risk
  if (["GST Certificate", "PAN Card"].includes(docType)) {
    return "Low";
  }
  
  // Company registration and tax residency require more verification
  if (["Certificate of Incorporation", "Tax Residency"].includes(docType)) {
    return companyProfile?.isVerified ? "Low" : "Medium";
  }
  
  return "Medium";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Authentication required", 401);
    if (session.role !== "ADMIN") return jsonError("Administrator access required", 403);

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
    const status = rawStatus as (typeof DOCUMENT_STATUSES)[number] | null;
    const limit = rawLimit;
    const offset = rawOffset;

    const where: any = {};
    if (status) {
      where.status = status as any;
    }

    let documents;
    let total;
    try {
      documents = await prisma.documentVerification.findMany({
        where,
        include: { employerProfile: { include: { company: true, user: true } } },
        orderBy: { submittedAt: "desc" },
        take: limit,
        skip: offset,
      });
      total = await prisma.documentVerification.count({ where });
    } catch {
      if (process.env.NODE_ENV === "production") throw new Error("Document verification database is unavailable.");
      const devDocuments = getDevDocumentVerifications().filter((doc) => !status || doc.status === status);
      total = devDocuments.length;
      return NextResponse.json({
        success: true,
        documents: devDocuments.slice(offset, offset + limit),
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      });
    }

    const formattedDocuments: DocumentRecord[] = documents.map((doc) => {
      const companyProfile = doc.employerProfile?.company;
      return {
        id: doc.id,
        employerId: doc.employerProfile?.userId || "",
        employerName: doc.employerProfile?.user?.name || "Unknown",
        companyName: companyProfile?.name || "Unknown",
        docType: doc.docType as DocumentType,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        submittedAt: doc.submittedAt.toISOString(),
        status: doc.status as any,
        riskScore: doc.riskScore as any,
        verifiedBy: doc.verifiedBy || undefined,
        verifiedAt: doc.verifiedAt?.toISOString() || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      documents: formattedDocuments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const parsed = documentSubmissionSchema.safeParse(await req.json());
    if (!parsed.success) return jsonError("Invalid document submission", 400);
    const { docType, fileUrl, fileName, companyName, employerId: requestedEmployerId } = parsed.data;

    // Employers may submit only for their own account. Admins may submit on behalf
    // of an employer when an employerId is explicitly provided.
    const employerId = session.role === "ADMIN" && requestedEmployerId ? requestedEmployerId : session.id;
    let employerProfile;
    let databaseAvailable = true;
    try {
      employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: employerId },
        include: { company: true, user: true },
      });
    } catch {
      if (process.env.NODE_ENV === "production") throw new Error("Document verification database is unavailable.");
      databaseAvailable = false;
      employerProfile = null;
    }

    const riskScore = calculateRiskScore(docType as DocumentType, employerProfile);

    if (!employerProfile) {
      if (databaseAvailable) {
        return jsonError("Employer profile not found", 404);
      }
      const devDocument = createDevDocumentVerification({
        employerId,
        employerName: session.name || session.email,
        companyName: companyName || session.name || "Pending company profile",
        docType: docType as DocumentType,
        fileUrl,
        fileName,
        riskScore,
      });
      return NextResponse.json({
        success: true,
        message: "Document submitted for verification",
        document: devDocument,
      }, { status: 201 });
    }

    const documentRecord = await prisma.documentVerification.create({
      data: {
        // DocumentVerification relates to EmployerProfile.id, not User.id.
        employerId: employerProfile.id,
        docType: docType as DocumentType,
        fileUrl: String(fileUrl),
        fileName: String(fileName),
        status: "Pending Audit",
        riskScore,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document submitted for verification",
      document: {
        id: documentRecord.id,
        status: documentRecord.status,
        riskScore: documentRecord.riskScore,
        submittedAt: documentRecord.submittedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

