import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAuthenticatedSession } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const createSchema = z.object({
  applicationId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  compensationAmount: z.number().positive().max(1_000_000_000).optional(),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).default("INR"),
  startDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  terms: z.object({
    roleTitle: z.string().trim().min(1).max(160),
    employmentType: z.string().trim().min(1).max(80),
    location: z.string().trim().max(200).optional(),
    probation: z.string().trim().max(500).optional(),
    noticePeriod: z.string().trim().max(500).optional(),
    benefits: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
    additionalTerms: z.string().trim().max(10_000).optional(),
  }).strict(),
  documentFileId: z.string().uuid().optional(),
}).strict();

async function actor(request: NextRequest) {
  const session = await requireAuthenticatedSession(request);
  if (!["EMPLOYER", "ADMIN"].includes(session.role)) throw new ApiError("Offer management requires employer or administrator access.", 403);
  const profile = session.role === "EMPLOYER"
    ? await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } })
    : null;
  if (session.role === "EMPLOYER" && !profile?.companyId) throw new ApiError("Company profile is required.", 403);
  return { session, companyId: profile?.companyId ?? null };
}

export async function GET(request: NextRequest) {
  try {
    const { session, companyId } = await actor(request);
    await enforceRateLimit(request, "employer_offers_read", 60, 60_000);
    const applicationId = new URL(request.url).searchParams.get("applicationId");
    const offers = await prisma.offer.findMany({
      where: {
        ...(session.role === "ADMIN" ? {} : { companyId: companyId! }),
        ...(applicationId ? { applicationId } : {}),
      },
      include: {
        application: {
          select: {
            status: true,
            job: { select: { title: true, company: { select: { name: true } } } },
            candidateProfile: { select: { user: { select: { name: true, email: true } } } },
          },
        },
        documentFile: { select: { id: true, originalName: true, mimeType: true, scanStatus: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, offers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, companyId } = await actor(request);
    await enforceRateLimit(request, "employer_offers_create", 20, 60_000);
    const body = await readValidatedJson(request, createSchema, 32 * 1024);
    const expiresAt = new Date(body.expiresAt);
    if (expiresAt.getTime() <= Date.now()) throw new ApiError("Offer expiry must be in the future.", 400);
    const startDate = body.startDate ? new Date(body.startDate) : null;

    const application = await prisma.application.findUnique({
      where: { id: body.applicationId },
      include: { job: true, candidateProfile: { select: { userId: true } } },
    });
    if (!application) throw new ApiError("Application not found.", 404);
    if (session.role !== "ADMIN" && application.job.companyId !== companyId) throw new ApiError("Application access denied.", 403);
    if (application.status !== "SHORTLISTED") throw new ApiError("An offer can only be created for a selected/shortlisted application.", 409);

    const activeOffer = await prisma.offer.findFirst({
      where: { applicationId: application.id, status: { in: ["SENT", "ACCEPTED"] } },
      select: { id: true, status: true },
    });
    if (activeOffer) throw new ApiError(`This application already has an active ${activeOffer.status.toLowerCase()} offer.`, 409);

    if (body.documentFileId) {
      const file = await prisma.storedFile.findUnique({
        where: { id: body.documentFileId },
        select: { id: true, companyId: true, ownerId: true, deletedAt: true, scanStatus: true, category: true },
      });
      if (!file || file.deletedAt) throw new ApiError("Offer document not found.", 404);
      if (file.scanStatus !== "CLEAN") throw new ApiError("Offer document must pass malware scanning before use.", 409);
      if (session.role !== "ADMIN" && file.companyId !== application.job.companyId && file.ownerId !== session.id) {
        throw new ApiError("Offer document access denied.", 403);
      }
    }

    const offer = await prisma.offer.create({
      data: {
        applicationId: application.id,
        companyId: application.job.companyId,
        createdById: session.id,
        title: body.title,
        compensationAmount: body.compensationAmount == null ? null : new Prisma.Decimal(body.compensationAmount),
        currency: body.currency,
        startDate,
        expiresAt,
        terms: body.terms as Prisma.InputJsonValue,
        documentFileId: body.documentFileId ?? null,
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId: application.job.companyId,
      action: "OFFER_DRAFT_CREATED",
      resource: `Offer:${offer.id}`,
      details: JSON.stringify({ applicationId: application.id, expiresAt: offer.expiresAt.toISOString(), hasDocument: Boolean(offer.documentFileId) }),
    });
    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
