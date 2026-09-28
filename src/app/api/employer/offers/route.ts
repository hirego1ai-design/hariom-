import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAuthenticatedSession } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,128}$/;

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
  let recordCompanyId = "";
  let recordKey = "";
  try {
    const { session, companyId } = await actor(request);
    await enforceRateLimit(request, "employer_offers_create", 20, 60_000);
    const body = await readValidatedJson(request, createSchema, 32 * 1024);
    const rawKey = request.headers.get("idempotency-key")?.trim() || "";
    if (!IDEMPOTENCY_KEY.test(rawKey)) {
      throw new ApiError(
        "A valid Idempotency-Key header (16-128 safe characters) is required.",
        400,
      );
    }

    const expiresAt = new Date(body.expiresAt);
    if (expiresAt.getTime() <= Date.now()) throw new ApiError("Offer expiry must be in the future.", 400);
    const startDate = body.startDate ? new Date(body.startDate) : null;

    const application = await prisma.application.findUnique({
      where: { id: body.applicationId },
      include: { job: true, candidateProfile: { select: { userId: true } } },
    });
    if (!application) throw new ApiError("Application not found.", 404);
    if (session.role !== "ADMIN" && application.job.companyId !== companyId) throw new ApiError("Application access denied.", 403);

    recordCompanyId = application.job.companyId;
    recordKey = `OFFER_CREATE:${application.id}:${rawKey}`;
    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");

    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: {
        companyId_idempotencyKey: {
          companyId: recordCompanyId,
          idempotencyKey: recordKey,
        },
      },
    });

    if (existingRecord) {
      if (existingRecord.requestHash !== requestHash) {
        throw new ApiError(
          "Idempotency key already used with a different offer request.",
          409,
        );
      }
      if (existingRecord.status === "SUCCESS" && existingRecord.responsePayload) {
        return NextResponse.json(existingRecord.responsePayload as any, { status: 201 });
      }
      if (existingRecord.status === "PROCESSING") {
        throw new ApiError("This offer creation request is already processing.", 409);
      }
      await prisma.idempotencyRecord.update({
        where: {
          companyId_idempotencyKey: {
            companyId: recordCompanyId,
            idempotencyKey: recordKey,
          },
        },
        data: { status: "PROCESSING", responsePayload: undefined },
      });
    } else {
      try {
        await prisma.idempotencyRecord.create({
          data: {
            companyId: recordCompanyId,
            idempotencyKey: recordKey,
            requestHash,
            status: "PROCESSING",
            jobId: application.jobId,
          },
        });
      } catch {
        const concurrent = await prisma.idempotencyRecord.findUnique({
          where: {
            companyId_idempotencyKey: {
              companyId: recordCompanyId,
              idempotencyKey: recordKey,
            },
          },
        });
        if (concurrent?.requestHash === requestHash) {
          if (concurrent.status === "SUCCESS" && concurrent.responsePayload) {
            return NextResponse.json(concurrent.responsePayload as any, { status: 201 });
          }
          throw new ApiError("This offer creation request is already processing.", 409);
        }
        throw new ApiError("Unable to reserve this offer request safely.", 409);
      }
    }

    if (application.status !== "SHORTLISTED") {
      throw new ApiError("An offer can only be created for a selected/shortlisted application.", 409);
    }

    if (body.documentFileId) {
      const file = await prisma.storedFile.findUnique({
        where: { id: body.documentFileId },
        select: { id: true, companyId: true, ownerId: true, deletedAt: true, scanStatus: true, category: true },
      });
      if (!file || file.deletedAt) throw new ApiError("Offer document not found.", 404);
      if (file.scanStatus !== "CLEAN") throw new ApiError("Offer document must pass malware scanning before use.", 409);
      if (file.category !== "employer-docs") throw new ApiError("Offer attachments must come from the approved employer-docs upload category.", 400);
      if (session.role !== "ADMIN" && file.companyId !== application.job.companyId && file.ownerId !== session.id) {
        throw new ApiError("Offer document access denied.", 403);
      }
    }

    const offer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${application.id} FOR UPDATE`;

      const lockedApplication = await tx.application.findUnique({
        where: { id: application.id },
        select: { status: true },
      });
      if (!lockedApplication || lockedApplication.status !== "SHORTLISTED") {
        throw new ApiError("The application is no longer eligible for a new offer.", 409);
      }

      const activeOffer = await tx.offer.findFirst({
        where: {
          applicationId: application.id,
          status: { in: ["DRAFT", "SENT", "ACCEPTED"] },
        },
        select: { id: true, status: true },
      });
      if (activeOffer) {
        throw new ApiError(
          `This application already has an active ${activeOffer.status.toLowerCase()} offer.`,
          409,
        );
      }

      return tx.offer.create({
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
    });

    const responsePayload = JSON.parse(JSON.stringify({ success: true, offer }));

    await prisma.idempotencyRecord.update({
      where: {
        companyId_idempotencyKey: {
          companyId: recordCompanyId,
          idempotencyKey: recordKey,
        },
      },
      data: {
        status: "SUCCESS",
        jobId: application.jobId,
        responsePayload,
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId: application.job.companyId,
      action: "OFFER_DRAFT_CREATED",
      resource: `Offer:${offer.id}`,
      details: JSON.stringify({ applicationId: application.id, expiresAt: offer.expiresAt.toISOString(), hasDocument: Boolean(offer.documentFileId) }),
    });
    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    if (recordCompanyId && recordKey) {
      await prisma.idempotencyRecord.updateMany({
        where: {
          companyId: recordCompanyId,
          idempotencyKey: recordKey,
          status: "PROCESSING",
        },
        data: { status: "FAILED" },
      }).catch(() => undefined);
    }
    return handleApiError(error);
  }
}
