import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

// Document types that require admin verification
const DOCUMENT_TYPES = [
  "GST Certificate",
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
    const session = getCurrentSession(req.headers);
    if (!session || session.role !== "ADMIN") {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let where: any = {};
    if (status) {
      where.status = status as any;
    }

    const documents = await prisma.documentVerification.findMany({
      where,
      include: {
        employerProfile: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.documentVerification.count({ where });

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
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const body = await req.json();
    const { docType, fileUrl, fileName, employerId, companyName } = body;

    // Validate document type
    if (!DOCUMENT_TYPES.includes(docType as DocumentType)) {
      return jsonError(`Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(", ")}`, 400);
    }

    if (!fileUrl || !fileName) {
      return jsonError("File URL and filename are required", 400);
    }

    // Find employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
      include: { company: true, user: true },
    });

    if (!employerProfile) {
      return jsonError("Employer profile not found", 404);
    }

    // Calculate risk score
    const riskScore = calculateRiskScore(docType as DocumentType, employerProfile);

    // Create document verification record
    const documentRecord = await prisma.documentVerification.create({
      data: {
        employerId: employerId,
        docType: docType as DocumentType,
        fileUrl: fileUrl,
        fileName: fileName,
        status: "Pending Audit",
        riskScore: riskScore,
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
