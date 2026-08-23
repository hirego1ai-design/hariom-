import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { createDevDocumentVerification, getDevDocumentVerifications } from "@/lib/document-verification-store";

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
    if (!session || session.role !== "ADMIN") {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    const body = await req.json();
    const { docType, fileUrl, fileName, companyName } = body;

    // Validate document type
    if (!DOCUMENT_TYPES.includes(docType as DocumentType)) {
      return jsonError(`Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(", ")}`, 400);
    }

    if (!fileUrl || !fileName) {
      return jsonError("File URL and filename are required", 400);
    }

    // Employers may submit only for their own account. Admins may submit on behalf
    // of an employer when an employerId is explicitly provided.
    const employerId = session.role === "ADMIN" && body.employerId ? String(body.employerId) : session.id;
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
        companyName: String(companyName || session.name || "Pending company profile"),
        docType: docType as DocumentType,
        fileUrl: String(fileUrl),
        fileName: String(fileName),
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

