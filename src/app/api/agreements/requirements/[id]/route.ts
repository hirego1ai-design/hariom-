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
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { activateManagedHiringRequirement } from "@/lib/managedHiring/RequirementActivation";

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
}).strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await enforceRateLimit(req, "agreement_requirement_detail_read", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
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

    const current = await prisma.hiringRequirement.findFirst({
      where: { OR: [{ id }, { referenceCode: id }] },
      select: { id: true, companyId: true, status: true },
    });
    if (!current) {
      throw new ApiError("Requirement not found.", 404);
    }

    if (body.activeAgreementId) {
      const agreement = await prisma.commercialAgreement.findUnique({
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

      if (body.status === "AGREEMENT_SENT" && agreement.status !== "SENT_TO_EMPLOYER") {
        throw new ApiError(
          "Requirement cannot be marked AGREEMENT_SENT until the linked agreement is sent to the employer.",
          409,
        );
      }
      if (body.status === "ACTIVE" && agreement.status !== "ACTIVE") {
        throw new ApiError(
          "Requirement cannot be marked ACTIVE until the linked agreement is signed and active.",
          409,
        );
      }
    } else if (["AGREEMENT_SENT", "ACTIVE"].includes(body.status)) {
      const requiredAgreementStatus =
        body.status === "ACTIVE" ? "ACTIVE" : "SENT_TO_EMPLOYER";
      const linkedAgreement = await prisma.commercialAgreement.findFirst({
        where: {
          requirementId: current.id,
          companyId: current.companyId,
          status: requiredAgreementStatus,
        },
        select: { id: true },
      });
      if (!linkedAgreement) {
        throw new ApiError(
          `Requirement cannot enter ${body.status} without a linked ${requiredAgreementStatus} agreement.`,
          409,
        );
      }
    }

    if (body.status === "ACTIVE") {
      const activation = await activateManagedHiringRequirement({
        requirementId: current.id,
        activeAgreementId: body.activeAgreementId,
        assignedSalesLead: body.assignedSalesLead,
        activatedById: session.id,
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

    const updated = await agreementsDb.updateRequirementStatus(
      current.id,
      body.status,
      body.assignedSalesLead,
      body.activeAgreementId,
    );

    if (!updated) {
      throw new ApiError("Requirement not found.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Requirement updated successfully",
      requirement: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
