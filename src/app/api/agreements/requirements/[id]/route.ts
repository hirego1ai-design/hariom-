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
import { prisma } from "@/lib/prisma";
import { activateManagedHiringRequirement } from "@/lib/managedHiring/RequirementActivation";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const requirementUpdateSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "IN_DISCUSSION",
    "AGREEMENT_DRAFTED",
    "AGREEMENT_SENT",
    "ACTIVE",
    "CLOSED",
  ]),
  assignedSalesLead: z.string().trim().min(1).max(200).optional(),
  activeAgreementId: z.string().trim().min(1).max(128).optional(),
  expectedUpdatedAt: z.string().datetime(),
  reason: z.string().trim().min(3).max(1000),
}).strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, `agreement_requirement_detail_read:${session.id}`, 60, 60_000);
    const { id } = await params;
    const requirement = await agreementsDb.getRequirementById(id);
    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "Requirement not found" },
        { status: 404 },
      );
    }
    await assertCompanyIdAccess(session, requirement.companyId);
    return NextResponse.json({ success: true, requirement });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(
      req,
      `agreement_requirement_update:${session.id}`,
      30,
      60_000,
    );
    const { id } = await params;
    const body = await readValidatedJson(req, requirementUpdateSchema, 8 * 1024);

    const observed = await prisma.hiringRequirement.findFirst({
      where: { OR: [{ id }, { referenceCode: id }] },
      select: { id: true, updatedAt: true },
    });
    if (!observed) throw new ApiError("Requirement not found.", 404);
    if (observed.updatedAt.toISOString() !== body.expectedUpdatedAt) {
      throw new ApiError("Managed hiring requirement changed; reload before saving.", 409);
    }

    if (body.status === "ACTIVE") {
      const activation = await activateManagedHiringRequirement({
        requirementId: observed.id,
        activeAgreementId: body.activeAgreementId,
        assignedSalesLead: body.assignedSalesLead,
        activatedById: session.id,
        expectedUpdatedAt: body.expectedUpdatedAt,
        reason: body.reason,
        ipAddress: getClientIp(req),
      });
      return NextResponse.json({
        success: true,
        message: "Requirement activated and production job listings created or reconciled.",
        requirement: activation.requirement,
        agreementId: activation.agreementId,
        jobs: activation.jobs.map((job) => ({
          id: job.id,
          title: job.title,
          status: job.status,
          managedRoleKey: job.managedRoleKey,
        })),
      });
    }

    const updatedId = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "HiringRequirement" WHERE id = ${observed.id} FOR UPDATE`;

      const current = await tx.hiringRequirement.findUnique({
        where: { id: observed.id },
      });
      if (!current) throw new ApiError("Requirement not found.", 404);
      if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Managed hiring requirement changed; reload before saving.", 409);
      }

      if (body.activeAgreementId) {
        const agreement = await tx.commercialAgreement.findUnique({
          where: { id: body.activeAgreementId },
          select: { requirementId: true, companyId: true, status: true },
        });
        if (
          !agreement ||
          agreement.requirementId !== current.id ||
          agreement.companyId !== current.companyId
        ) {
          throw new ApiError(
            "activeAgreementId must reference an agreement linked to this requirement and company.",
            409,
          );
        }
        if (
          body.status === "AGREEMENT_SENT" &&
          agreement.status !== "SENT_TO_EMPLOYER"
        ) {
          throw new ApiError(
            "Requirement cannot be marked AGREEMENT_SENT until the linked agreement is sent to the employer.",
            409,
          );
        }
      } else if (body.status === "AGREEMENT_SENT") {
        const linkedAgreement = await tx.commercialAgreement.findFirst({
          where: {
            requirementId: current.id,
            companyId: current.companyId,
            status: "SENT_TO_EMPLOYER",
          },
          select: { id: true },
        });
        if (!linkedAgreement) {
          throw new ApiError(
            "Requirement cannot enter AGREEMENT_SENT without a linked SENT_TO_EMPLOYER agreement.",
            409,
          );
        }
      }

      const changed = await tx.hiringRequirement.updateMany({
        where: { id: current.id, updatedAt: current.updatedAt },
        data: {
          status: body.status,
          ...(body.assignedSalesLead
            ? { assignedSalesLead: body.assignedSalesLead }
            : {}),
        },
      });
      if (changed.count !== 1) {
        throw new ApiError("Managed hiring requirement changed; reload before saving.", 409);
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: current.companyId,
          action: "MANAGED_HIRING_REQUIREMENT_UPDATED",
          resource: `HiringRequirement:${current.id}`,
          ipAddress: getClientIp(req) || "unknown",
          details: JSON.stringify({
            previousStatus: current.status,
            newStatus: body.status,
            assignedSalesLead: body.assignedSalesLead || null,
            activeAgreementId: body.activeAgreementId || null,
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return current.id;
    });

    const requirement = await agreementsDb.getRequirementById(updatedId);
    if (!requirement) throw new ApiError("Requirement could not be reloaded after update.", 500);

    return NextResponse.json({
      success: true,
      message: "Requirement updated and audited successfully.",
      requirement,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
