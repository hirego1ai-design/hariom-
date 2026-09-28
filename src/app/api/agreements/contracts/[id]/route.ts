import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agreementsDb } from "@/lib/agreements-db";
import {
  assertCompanyIdAccess,
  requireAdminSession,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { buildPublicAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const agreementUpdateSchema = z.object({
  clientLegalName: z.string().trim().min(1).max(200).optional(),
  contactPerson: z.string().trim().min(1).max(200).optional(),
  clientEmail: z.string().trim().email().max(320).optional(),
  clientPhone: z.string().trim().max(40).optional(),
  feeType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  feeValue: z.number().finite().positive().max(1_000_000_000).optional(),
  invoiceRule: z.string().trim().min(1).max(200).optional(),
  replacementDays: z.number().int().min(0).max(3650).optional(),
  validityStartDate: z.string().datetime({ offset: true }).optional(),
  validityEndDate: z.string().datetime({ offset: true }).optional(),
  advancePaymentAmount: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  discountPercentage: z.number().finite().min(0).max(100).optional(),
  creditDays: z.number().int().min(0).max(3650).optional(),
  taxRatePct: z.number().finite().min(0).max(100).optional(),
  customClauses: z.array(z.string().trim().min(1).max(10_000)).max(100).optional(),
  commercialNotes: z.string().trim().max(10_000).optional().or(z.literal("")),
  salesExecutiveNotes: z.string().trim().max(10_000).optional().or(z.literal("")),
  expectedUpdatedAt: z.string().datetime(),
  reason: z.string().trim().min(3).max(2_000),
}).strict().superRefine((value, context) => {
  const changedFields = Object.keys(value).filter(
    (key) => key !== "expectedUpdatedAt" && key !== "reason",
  );
  if (!changedFields.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one agreement term change is required.",
    });
  }
  if (value.feeType === "PERCENTAGE" && value.feeValue !== undefined && value.feeValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["feeValue"],
      message: "Percentage placement fee cannot exceed 100%.",
    });
  }
});

const agreementActionSchema = z.object({
  action: z.enum(["accept", "request_amendment", "send_to_employer"]),
  expectedUpdatedAt: z.string().datetime(),
  signedByName: z.string().trim().min(2).max(200).optional(),
  signedByDesignation: z.string().trim().min(2).max(200).optional(),
  amendmentNotes: z.string().trim().min(3).max(10_000).optional(),
  reason: z.string().trim().min(3).max(2_000).optional(),
}).strict().superRefine((value, context) => {
  if (value.action === "accept") {
    if (!value.signedByName) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["signedByName"], message: "Signer name is required." });
    }
    if (!value.signedByDesignation) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["signedByDesignation"], message: "Signer designation is required." });
    }
  }
  if (value.action === "request_amendment" && !value.amendmentNotes) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["amendmentNotes"], message: "Amendment notes are required." });
  }
  if (value.action === "send_to_employer" && !value.reason) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "A send/review reason is required." });
  }
});

async function loadAgreement(id: string) {
  return prisma.commercialAgreement.findFirst({
    where: { OR: [{ id }, { agreementNumber: id }] },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, `agreement_contract_read:${session.id}`, 60, 60_000);
    const { id } = await params;
    const agreement = await agreementsDb.getAgreementById(id);
    if (!agreement) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }
    await assertCompanyIdAccess(session, agreement.companyId);

    const events = await agreementsDb.getEventsByAgreementId(agreement.id);
    let linkedRequirement = null;
    if (agreement.requirementId) {
      linkedRequirement = await agreementsDb.getRequirementById(agreement.requirementId);
      if (linkedRequirement?.companyId !== agreement.companyId) linkedRequirement = null;
    }

    return NextResponse.json({
      success: true,
      agreement,
      events,
      linkedRequirement,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `agreement_contract_update:${session.id}`, 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(req, agreementUpdateSchema, 128 * 1024);

    const observed = await loadAgreement(id);
    if (!observed) throw new ApiError("Agreement not found.", 404);
    await assertCompanyIdAccess(session, observed.companyId || undefined);

    const updatedId = await prisma.$transaction(async (tx) => {
      const current = await tx.commercialAgreement.findUnique({
        where: { id: observed.id },
      });
      if (!current) throw new ApiError("Agreement not found.", 404);
      if (!["DRAFT", "INTERNAL_REVIEW", "AMENDMENT_REQUESTED"].includes(current.status)) {
        throw new ApiError("Only draft or amendment-requested agreements can be revised.", 409);
      }
      if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Agreement changed; reload before saving.", 409);
      }

      const { expectedUpdatedAt: _version, reason, ...updates } = body;
      const data = {
        ...updates,
        ...(updates.validityStartDate ? { validityStartDate: new Date(updates.validityStartDate) } : {}),
        ...(updates.validityEndDate ? { validityEndDate: new Date(updates.validityEndDate) } : {}),
      };

      const startDate =
        data.validityStartDate instanceof Date ? data.validityStartDate : current.validityStartDate;
      const endDate =
        data.validityEndDate instanceof Date ? data.validityEndDate : current.validityEndDate;
      if (endDate <= startDate) {
        throw new ApiError("Agreement validity end date must be after its start date.", 422);
      }

      const changed = await tx.commercialAgreement.updateMany({
        where: { id: current.id, updatedAt: current.updatedAt },
        data,
      });
      if (changed.count !== 1) {
        throw new ApiError("Agreement changed; reload before saving.", 409);
      }

      await tx.agreementEvent.create({
        data: {
          agreementId: current.id,
          eventType: "DRAFT_UPDATED",
          performedBy: session.id,
          notes: reason,
        },
      });

      if (current.requirementId && current.status === "AMENDMENT_REQUESTED") {
        await tx.hiringRequirement.updateMany({
          where: { id: current.requirementId, companyId: current.companyId },
          data: { status: "AGREEMENT_DRAFTED" },
        });
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: current.companyId,
          action: "COMMERCIAL_AGREEMENT_UPDATED",
          resource: `CommercialAgreement:${current.id}`,
          ipAddress: getClientIp(req) || "unknown",
          details: JSON.stringify({
            reason,
            changedFields: Object.keys(updates).sort(),
            previousStatus: current.status,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return current.id;
    });

    const agreement = await agreementsDb.getAgreementById(updatedId);
    return NextResponse.json({
      success: true,
      message: "Agreement updated and audited successfully.",
      agreement,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, `agreement_contract_action:${session.id}`, 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(req, agreementActionSchema, 32 * 1024);

    const observed = await loadAgreement(id);
    if (!observed) throw new ApiError("Agreement not found.", 404);
    await assertCompanyIdAccess(session, observed.companyId || undefined);

    if (body.action === "accept" && session.role === "ADMIN") {
      throw new ApiError("Administrators cannot sign on behalf of an employer.", 403);
    }
    if (body.action === "request_amendment" && session.role === "ADMIN") {
      throw new ApiError("Administrators cannot request employer amendments.", 403);
    }
    if (body.action === "send_to_employer" && session.role !== "ADMIN") {
      throw new ApiError("Administrator access required.", 403);
    }

    const ipAddress = getClientIp(req) || "unknown";

    const transition = await prisma.$transaction(async (tx) => {
      const current = await tx.commercialAgreement.findUnique({
        where: { id: observed.id },
      });
      if (!current) throw new ApiError("Agreement not found.", 404);
      if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Agreement changed; reload before continuing.", 409);
      }

      if (body.action === "accept") {
        if (current.status !== "SENT_TO_EMPLOYER") {
          throw new ApiError("Agreement must still be awaiting employer acceptance.", 409);
        }
        const signerName = body.signedByName!;
        const designation = body.signedByDesignation!;

        if (current.requirementId) {
          const requirement = await tx.hiringRequirement.findUnique({
            where: { id: current.requirementId },
            select: { status: true, companyId: true },
          });
          if (
            !requirement ||
            requirement.companyId !== current.companyId ||
            requirement.status !== "AGREEMENT_SENT"
          ) {
            throw new ApiError(
              "Linked requirement is not in the expected agreement-sent state.",
              409,
            );
          }
        }

        const changed = await tx.commercialAgreement.updateMany({
          where: {
            id: current.id,
            status: "SENT_TO_EMPLOYER",
            updatedAt: current.updatedAt,
          },
          data: {
            status: "ACTIVE",
            signedByName: signerName,
            signedByDesignation: designation,
            signedAt: new Date(),
            signerIpAddress: ipAddress,
          },
        });
        if (changed.count !== 1) {
          throw new ApiError("Agreement changed; reload before signing.", 409);
        }

        await tx.agreementEvent.create({
          data: {
            agreementId: current.id,
            eventType: "ACCEPTED",
            performedBy: session.id,
            notes: `Digitally accepted by ${signerName} (${designation}); signer IP evidence recorded.`,
          },
        });

        if (current.requirementId) {
          await tx.hiringRequirement.update({
            where: { id: current.requirementId },
            data: { status: "ACTIVE" },
          });
        }

        const auditLog = await tx.auditLog.create({
          data: {
            userId: session.id,
            companyId: current.companyId,
            action: "COMMERCIAL_AGREEMENT_ACCEPTED",
            resource: `CommercialAgreement:${current.id}`,
            ipAddress,
            details: JSON.stringify({
              signedByName: signerName,
              signedByDesignation: designation,
            }),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, session.id);
        return { id: current.id, action: body.action };
      }

      if (body.action === "request_amendment") {
        if (current.status !== "SENT_TO_EMPLOYER") {
          throw new ApiError("Agreement must still be awaiting employer review.", 409);
        }
        const notes = body.amendmentNotes!;

        const changed = await tx.commercialAgreement.updateMany({
          where: {
            id: current.id,
            status: "SENT_TO_EMPLOYER",
            updatedAt: current.updatedAt,
          },
          data: {
            status: "AMENDMENT_REQUESTED",
            amendmentNotes: notes,
          },
        });
        if (changed.count !== 1) {
          throw new ApiError("Agreement changed; reload before requesting an amendment.", 409);
        }

        await tx.agreementEvent.create({
          data: {
            agreementId: current.id,
            eventType: "AMENDMENT_REQUESTED",
            performedBy: session.id,
            notes,
          },
        });

        if (current.requirementId) {
          await tx.hiringRequirement.updateMany({
            where: { id: current.requirementId, companyId: current.companyId },
            data: { status: "AGREEMENT_DRAFTED" },
          });
        }

        const auditLog = await tx.auditLog.create({
          data: {
            userId: session.id,
            companyId: current.companyId,
            action: "COMMERCIAL_AGREEMENT_AMENDMENT_REQUESTED",
            resource: `CommercialAgreement:${current.id}`,
            ipAddress,
            details: JSON.stringify({ notes }),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, session.id);
        return { id: current.id, action: body.action };
      }

      if (!["DRAFT", "INTERNAL_REVIEW", "AMENDMENT_REQUESTED"].includes(current.status)) {
        throw new ApiError("Only a reviewed draft can be sent or resent to the employer.", 409);
      }

      const changed = await tx.commercialAgreement.updateMany({
        where: { id: current.id, updatedAt: current.updatedAt },
        data: {
          status: "SENT_TO_EMPLOYER",
          amendmentNotes: null,
        },
      });
      if (changed.count !== 1) {
        throw new ApiError("Agreement changed; reload before sending.", 409);
      }

      await tx.agreementEvent.create({
        data: {
          agreementId: current.id,
          eventType: "SENT",
          performedBy: session.id,
          notes: body.reason!,
        },
      });

      if (current.requirementId) {
        await tx.hiringRequirement.updateMany({
          where: { id: current.requirementId, companyId: current.companyId },
          data: { status: "AGREEMENT_SENT" },
        });
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: current.companyId,
          action: "COMMERCIAL_AGREEMENT_SENT",
          resource: `CommercialAgreement:${current.id}`,
          ipAddress,
          details: JSON.stringify({ reason: body.reason }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return { id: current.id, action: body.action };
    });

    const agreement = await agreementsDb.getAgreementById(transition.id);
    if (!agreement) throw new ApiError("Agreement could not be reloaded after transition.", 500);

    const communications: Array<{ channel: "EMAIL" | "WHATSAPP"; status: string }> = [];

    if (body.action === "send_to_employer") {
      const agreementLink = buildPublicAppUrl(
        `/employer/managed-hiring/agreements/${agreement.id}`,
      );

      if (agreement.clientEmail) {
        try {
          const delivery = await dispatchCommunication({
            eventKey: "AGREEMENT_SENT",
            channel: "EMAIL",
            audience: "EMPLOYER",
            recipient: agreement.clientEmail,
            variables: {
              company_name: agreement.companyName,
              agreement_reference: agreement.id,
              agreement_link: agreementLink,
            },
            idempotencyKey: `agreement:${agreement.id}:sent:${agreement.updatedAt}:employer:email`,
            correlationId: agreement.id,
            recipientRef: agreement.companyId || session.id,
          });
          communications.push({ channel: "EMAIL", status: delivery.status });
        } catch {
          communications.push({ channel: "EMAIL", status: "DISPATCH_FAILED" });
        }
      }

      if (agreement.clientPhone) {
        try {
          const delivery = await dispatchCommunication({
            eventKey: "AGREEMENT_SENT",
            channel: "WHATSAPP",
            audience: "EMPLOYER",
            recipient: agreement.clientPhone,
            variables: {
              company_name: agreement.companyName,
              agreement_reference: agreement.id,
              agreement_link: agreementLink,
            },
            idempotencyKey: `agreement:${agreement.id}:sent:${agreement.updatedAt}:employer:whatsapp`,
            correlationId: agreement.id,
            recipientRef: agreement.companyId || session.id,
          });
          communications.push({ channel: "WHATSAPP", status: delivery.status });
        } catch {
          communications.push({ channel: "WHATSAPP", status: "DISPATCH_FAILED" });
        }
      }
    } else if (body.action === "accept" && agreement.clientEmail) {
      try {
        const delivery = await dispatchCommunication({
          eventKey: "AGREEMENT_ACCEPTED",
          channel: "EMAIL",
          audience: "EMPLOYER",
          recipient: agreement.clientEmail,
          variables: {
            company_name: agreement.companyName,
            agreement_reference: agreement.id,
          },
          idempotencyKey: `agreement:${agreement.id}:accepted:${agreement.updatedAt}:employer:email`,
          correlationId: agreement.id,
          recipientRef: session.id,
        });
        communications.push({ channel: "EMAIL", status: delivery.status });
      } catch {
        communications.push({ channel: "EMAIL", status: "DISPATCH_FAILED" });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        body.action === "accept"
          ? "Commercial agreement accepted and activated."
          : body.action === "request_amendment"
            ? "Amendment request recorded for administrator review."
            : "Agreement moved to employer review. Notification outcomes are recorded separately.",
      agreement,
      communications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
