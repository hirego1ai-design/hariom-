import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { sendEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/auditLogger";

const offerSchema = z.object({
  applicationId: z.string().uuid(),
  action: z.enum(["DRAFT", "SEND"]),
  positionTitle: z.string().trim().min(1).max(200),
  annualCompensation: z.number().finite().positive().max(1_000_000_000),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default("INR"),
  joiningDate: z.string().datetime({ offset: true }).nullable().optional(),
  terms: z.object({
    summary: z.string().trim().min(1).max(10_000),
  }).strict(),
  documentFileId: z.string().uuid().nullable().optional(),
}).strict();

const withdrawSchema = z.object({
  offerId: z.string().uuid(),
  action: z.literal("WITHDRAW"),
  reason: z.string().trim().min(5).max(1000),
}).strict();

async function employerContext(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "ADMIN"].includes(session.role)) {
    throw new ApiError("Employer or administrator access required.", 403);
  }
  const companyId = session.role === "ADMIN" ? null : (await getSessionCompany(session)).id;
  return { session, companyId };
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "employer_offers_read", 60, 60_000);
    const { session, companyId } = await employerContext(request);
    const requestedCompanyId = request.nextUrl.searchParams.get("companyId");
    const scopeCompanyId = session.role === "ADMIN" ? requestedCompanyId : companyId;
    if (!scopeCompanyId) throw new ApiError("companyId is required for administrator offer listing.", 400);

    const offers = await prisma.offer.findMany({
      where: { companyId: scopeCompanyId },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            job: { select: { id: true, title: true } },
            candidateProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        documentFile: { select: { id: true, originalName: true, mimeType: true, scanStatus: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, offers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "employer_offer_write", 20, 60_000);
    const { session, companyId } = await employerContext(request);
    const body = await readValidatedJson(request, offerSchema, 32 * 1024);

    const offer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${body.applicationId} FOR UPDATE`;
      const application = await tx.application.findUnique({
        where: { id: body.applicationId },
        include: {
          job: { include: { company: true } },
          candidateProfile: { include: { user: true } },
          offer: true,
        },
      });
      if (!application) throw new ApiError("Application not found.", 404);
      if (session.role !== "ADMIN" && application.job.companyId !== companyId) {
        throw new ApiError("Application does not belong to your company.", 403);
      }
      if (application.status !== "SHORTLISTED") {
        throw new ApiError("An offer can be created only after the application is shortlisted.", 409);
      }
      if (application.offer && application.offer.status !== "DRAFT") {
        throw new ApiError("This application already has a sent or completed offer lifecycle.", 409);
      }
      if (body.action === "SEND" && !body.documentFileId) {
        throw new ApiError("A private offer document is required before sending.", 422);
      }

      if (body.documentFileId) {
        const file = await tx.storedFile.findFirst({
          where: {
            id: body.documentFileId,
            deletedAt: null,
            companyId: application.job.companyId,
            category: "offer-documents",
            scanStatus: "CLEAN",
          },
          select: { id: true },
        });
        if (!file) throw new ApiError("Offer document is missing, quarantined, or outside this company.", 422);
      }

      const data = {
        companyId: application.job.companyId,
        createdById: session.id,
        status: body.action === "SEND" ? "SENT" as const : "DRAFT" as const,
        positionTitle: body.positionTitle,
        currency: body.currency,
        annualCompensation: new Prisma.Decimal(body.annualCompensation).toDecimalPlaces(2),
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,
        terms: body.terms as Prisma.InputJsonValue,
        documentFileId: body.documentFileId || null,
        sentAt: body.action === "SEND" ? new Date() : null,
        respondedAt: null,
        responseNote: null,
      };

      return application.offer
        ? tx.offer.update({ where: { id: application.offer.id }, data })
        : tx.offer.create({ data: { applicationId: application.id, ...data } });
    });

    if (offer.status === "SENT") {
      const application = await prisma.application.findUnique({
        where: { id: offer.applicationId },
        include: { job: { include: { company: true } }, candidateProfile: { include: { user: true } } },
      });
      const candidate = application?.candidateProfile.user;
      if (application && candidate) {
        await prisma.notification.create({
          data: {
            userId: candidate.id,
            title: "Offer received",
            message: `${application.job.company.name} sent you an offer for ${application.job.title}. Review it in your HireGo offers page.`,
            type: "OFFER",
          },
        }).catch(() => undefined);
        if (candidate.email) {
          await sendEmail({
            to: candidate.email,
            subject: `Offer received for ${application.job.title}`,
            html: `<p>Hi ${candidate.name || "Candidate"},</p><p>${application.job.company.name} has sent you an offer for <strong>${application.job.title}</strong>.</p><p>Sign in to HireGo to review the private offer document and accept or decline it.</p>`,
          }).catch(() => undefined);
        }
      }
    }

    await logAuditEvent({
      userId: session.id,
      companyId: offer.companyId,
      action: offer.status === "SENT" ? "OFFER_SENT" : "OFFER_DRAFT_SAVED",
      resource: `Offer:${offer.id}`,
      details: JSON.stringify({ applicationId: offer.applicationId, status: offer.status }),
    });

    return NextResponse.json({ success: true, offer }, { status: offer.status === "SENT" ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await enforceRateLimit(request, "employer_offer_withdraw", 10, 60_000);
    const { session, companyId } = await employerContext(request);
    const body = await readValidatedJson(request, withdrawSchema, 8 * 1024);

    const offer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${body.offerId} FOR UPDATE`;
      const current = await tx.offer.findUnique({ where: { id: body.offerId } });
      if (!current) throw new ApiError("Offer not found.", 404);
      if (session.role !== "ADMIN" && current.companyId !== companyId) throw new ApiError("Offer access denied.", 403);
      if (current.status !== "SENT") throw new ApiError("Only a pending sent offer can be withdrawn.", 409);
      return tx.offer.update({
        where: { id: current.id },
        data: { status: "WITHDRAWN", responseNote: body.reason, respondedAt: new Date() },
      });
    });

    await logAuditEvent({
      userId: session.id,
      companyId: offer.companyId,
      action: "OFFER_WITHDRAWN",
      resource: `Offer:${offer.id}`,
      details: body.reason,
    });
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return handleApiError(error);
  }
}
