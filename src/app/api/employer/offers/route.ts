import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const createSchema = z.object({
  applicationId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  terms: z.object({
    compensation: z.string().trim().min(1).max(200),
    currency: z.string().trim().min(3).max(8),
    employmentType: z.string().trim().min(1).max(80),
    startDate: z.string().trim().max(40).optional(),
    location: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(5000).optional(),
  }).strict(),
  documentFileId: z.string().uuid().optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(request);
    if (session.role === "ADMIN") throw new ApiError("Open offers from a tenant employer account.", 400);
    const company = await getSessionCompany(session);
    await enforceRateLimit(request, "employer_offers_read", 60, 60_000);

    const offers = await prisma.offer.findMany({
      where: { companyId: company.id },
      include: {
        application: {
          include: {
            job: { select: { id: true, title: true } },
            candidateProfile: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, offers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(request);
    if (session.role === "ADMIN") throw new ApiError("Create offers from a tenant employer account.", 400);
    const company = await getSessionCompany(session);
    await enforceRateLimit(request, "employer_offers_create", 20, 60_000);
    const body = await readValidatedJson(request, createSchema, 16 * 1024);

    const application = await prisma.application.findFirst({
      where: { id: body.applicationId, job: { companyId: company.id } },
      include: { candidateProfile: { include: { user: true } }, job: true },
    });
    if (!application) throw new ApiError("Application not found.", 404);
    if (application.status !== "SHORTLISTED") {
      throw new ApiError("An offer can only be created for a shortlisted candidate.", 409);
    }

    if (body.documentFileId) {
      const file = await prisma.storedFile.findFirst({
        where: {
          id: body.documentFileId,
          companyId: company.id,
          deletedAt: null,
          scanStatus: "CLEAN",
        },
        select: { id: true },
      });
      if (!file) throw new ApiError("Offer document must be a clean private company file.", 422);
    }

    const offer = await prisma.offer.upsert({
      where: { applicationId: application.id },
      update: {
        title: body.title,
        terms: body.terms,
        documentFileId: body.documentFileId ?? null,
        createdById: session.id,
        status: "DRAFT",
        sentAt: null,
        acceptedAt: null,
        declinedAt: null,
        revokedAt: null,
        responseNote: null,
      },
      create: {
        applicationId: application.id,
        companyId: company.id,
        createdById: session.id,
        title: body.title,
        terms: body.terms,
        documentFileId: body.documentFileId ?? null,
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId: company.id,
      action: "OFFER_DRAFT_SAVED",
      resource: `Offer:${offer.id}`,
      details: JSON.stringify({ applicationId: application.id, documentAttached: Boolean(body.documentFileId) }),
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
