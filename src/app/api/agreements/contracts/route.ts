import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { agreementsDb } from "@/lib/agreements-db";
import {
  getSessionCompany,
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
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const agreementCreateSchema = z.object({
  companyId: z.string().trim().min(1).max(128),
  requirementId: z.string().trim().min(1).max(128).optional(),
  templateId: z.string().trim().min(1).max(128),
  expectedTemplateUpdatedAt: z.string().datetime(),
  expectedRequirementUpdatedAt: z.string().datetime().optional(),
  reason: z.string().trim().min(3).max(1000),
  companyName: optionalText(200),
  clientLegalName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  clientEmail: z.string().trim().email().max(320),
  clientPhone: optionalText(40),
  feeType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  feeValue: z.number().finite().positive().max(1_000_000_000).optional(),
  invoiceRule: z.string().trim().min(1).max(100).optional(),
  replacementDays: z.number().int().min(0).max(3650).optional(),
  validityStartDate: z.string().datetime({ offset: true }).optional(),
  validityEndDate: z.string().datetime({ offset: true }).optional(),
  advancePaymentAmount: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  discountPercentage: z.number().finite().min(0).max(100).optional(),
  creditDays: z.number().int().min(0).max(365).optional(),
  taxRatePct: z.number().finite().min(0).max(100).optional(),
  customClauses: z.array(z.string().trim().min(1).max(10_000)).max(100).optional(),
  commercialNotes: optionalText(10_000),
  salesExecutiveNotes: optionalText(10_000),
}).strict().superRefine((value, context) => {
  if (value.requirementId && !value.expectedRequirementUpdatedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedRequirementUpdatedAt"],
      message: "Observed requirement version is required.",
    });
  }
});

function addUtcMonths(value: Date, months: number): Date {
  const result = new Date(value);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

// Guard: Tenant isolation enforced via authoritative EmployerProfile.companyId -> Company FK boundary.
export async function GET(req: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "RECRUITER") {
      throw new ApiError("Commercial agreements are available only to company administrators.", 403);
    }
    await enforceRateLimit(req, `agreements_contracts_get:${session.id}`, 60, 60_000);
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");
    const queryCompanyId = searchParams.get("companyId");
    const status = searchParams.get("status");

    let list = await agreementsDb.getAgreements();

    if (session.role !== "ADMIN") {
      const tenantCompany = await getSessionCompany(session);
      list = list.filter((agreement) => agreement.companyId === tenantCompany.id);
    } else if (queryCompanyId) {
      list = list.filter((agreement) => agreement.companyId === queryCompanyId);
    }

    if (company) {
      list = list.filter((agreement) =>
        agreement.companyName.toLowerCase().includes(company.toLowerCase()),
      );
    }

    if (status) {
      list = list.filter((agreement) => agreement.status === status);
    }

    return NextResponse.json({ success: true, count: list.length, agreements: list });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(
      req,
      `agreements_contracts_post:${session.id}`,
      20,
      60_000,
    );
    const body = await readValidatedJson(
      req,
      agreementCreateSchema,
      128 * 1024,
    );

    const created = await prisma.$transaction(async (tx) => {
      // Lock the reviewed commercial template and requirement so the terms/state
      // cannot change between validation and contract creation.
      await tx.$queryRaw`SELECT id FROM "AgreementTemplate" WHERE id = ${body.templateId} FOR UPDATE`;
      const template = await tx.agreementTemplate.findUnique({
        where: { id: body.templateId },
      });
      if (!template || template.isArchived) {
        throw new ApiError("A current agreement template is required.", 422);
      }
      if (template.updatedAt.toISOString() !== body.expectedTemplateUpdatedAt) {
        throw new ApiError(
          "Agreement template changed; reload before drafting the contract.",
          409,
        );
      }

      const targetCompany = await tx.company.findUnique({
        where: { id: body.companyId },
        select: { id: true, name: true },
      });
      if (!targetCompany) {
        throw new ApiError("A valid companyId is required.", 400);
      }

      let requirement: {
        id: string;
        companyId: string | null;
        status: string;
        updatedAt: Date;
      } | null = null;

      if (body.requirementId) {
        await tx.$queryRaw`SELECT id FROM "HiringRequirement" WHERE id = ${body.requirementId} FOR UPDATE`;
        requirement = await tx.hiringRequirement.findUnique({
          where: { id: body.requirementId },
          select: {
            id: true,
            companyId: true,
            status: true,
            updatedAt: true,
          },
        });
        if (!requirement || requirement.companyId !== targetCompany.id) {
          throw new ApiError(
            "Requirement does not belong to the selected company.",
            403,
          );
        }
        if (
          requirement.updatedAt.toISOString() !==
          body.expectedRequirementUpdatedAt
        ) {
          throw new ApiError(
            "Hiring requirement changed; reload before drafting the contract.",
            409,
          );
        }
        if (!["SUBMITTED", "IN_DISCUSSION"].includes(requirement.status)) {
          throw new ApiError(
            "This requirement already progressed beyond initial agreement drafting. Open its existing agreement instead.",
            409,
          );
        }
      }

      const feeType = body.feeType ?? template.feeType;
      const feeValue = body.feeValue ?? template.feeValue;
      const invoiceRule = body.invoiceRule ?? template.invoiceRule;
      const replacementDays =
        body.replacementDays ?? template.replacementDays;
      const advancePaymentAmount =
        body.advancePaymentAmount ?? template.advancePayment;
      const discountPercentage =
        body.discountPercentage ?? template.standardDiscountPct;
      const creditDays = body.creditDays ?? template.creditTermsDays;
      const taxRatePct = body.taxRatePct ?? template.taxRatePct;
      const customClauses = body.customClauses ?? template.specialClauses;
      const commercialNotes =
        body.commercialNotes || template.commercialNotes || "";

      if (!["PERCENTAGE", "FIXED"].includes(feeType)) {
        throw new ApiError(
          "Managed hiring billing supports only PERCENTAGE or FIXED placement fees.",
          422,
        );
      }
      if (!Number.isFinite(feeValue) || feeValue <= 0) {
        throw new ApiError(
          "Placement fee must be a positive approved value.",
          422,
        );
      }
      if (feeType === "PERCENTAGE" && feeValue > 100) {
        throw new ApiError(
          "Percentage placement fee cannot exceed 100%.",
          422,
        );
      }

      // The live PPH billing worker currently implements signed DAY_25 billing.
      if (requirement && invoiceRule !== "DAY_25") {
        throw new ApiError(
          "Managed hiring agreements must use the DAY_25 invoice rule supported by the production PPH billing workflow.",
          422,
        );
      }
      if (requirement && advancePaymentAmount !== 0) {
        throw new ApiError(
          "Managed hiring DAY_25 placement billing does not support advance payment.",
          422,
        );
      }

      const startDate = body.validityStartDate
        ? new Date(body.validityStartDate)
        : new Date();
      const templateMonths = Math.max(
        1,
        Math.min(template.validityMonths, 120),
      );
      const endDate = body.validityEndDate
        ? new Date(body.validityEndDate)
        : addUtcMonths(startDate, templateMonths);

      if (
        !Number.isFinite(startDate.getTime()) ||
        !Number.isFinite(endDate.getTime()) ||
        endDate <= startDate
      ) {
        throw new ApiError(
          "Agreement validity end date must be after its start date.",
          422,
        );
      }

      const agreementNumber =
        `HGO-CMA-${new Date().getUTCFullYear()}-${randomUUID()
          .replaceAll("-", "")
          .slice(0, 12)
          .toUpperCase()}`;

      const agreement = await tx.commercialAgreement.create({
        data: {
          agreementNumber,
          companyId: targetCompany.id,
          requirementId: requirement?.id ?? null,
          templateId: template.id,
          companyName: targetCompany.name,
          clientLegalName: body.clientLegalName,
          contactPerson: body.contactPerson,
          clientEmail: body.clientEmail,
          clientPhone: body.clientPhone || "",
          status: "DRAFT",
          feeType,
          feeValue,
          invoiceRule,
          replacementDays,
          validityStartDate: startDate,
          validityEndDate: endDate,
          advancePaymentAmount,
          discountPercentage,
          creditDays,
          taxRatePct,
          customClauses,
          commercialNotes: commercialNotes || null,
          salesExecutiveNotes: body.salesExecutiveNotes || null,
        },
      });

      await tx.agreementEvent.create({
        data: {
          agreementId: agreement.id,
          eventType: "CREATED",
          performedBy: session.id,
          notes: body.reason,
        },
      });

      if (requirement) {
        const transitioned = await tx.hiringRequirement.updateMany({
          where: {
            id: requirement.id,
            updatedAt: requirement.updatedAt,
            status: requirement.status as any,
          },
          data: { status: "AGREEMENT_DRAFTED" },
        });
        if (transitioned.count !== 1) {
          throw new ApiError(
            "Hiring requirement changed; reload before drafting the contract.",
            409,
          );
        }
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: targetCompany.id,
          action: "COMMERCIAL_AGREEMENT_DRAFTED",
          resource: `CommercialAgreement:${agreement.id}`,
          ipAddress: getClientIp(req) || "unknown",
          details: JSON.stringify({
            agreementNumber: agreement.agreementNumber,
            requirementId: requirement?.id ?? null,
            templateId: template.id,
            templateUpdatedAt: template.updatedAt.toISOString(),
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return agreement;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Commercial agreement drafted and audited.",
        agreement: created,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
