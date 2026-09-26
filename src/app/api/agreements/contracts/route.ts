import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agreementsDb } from "@/lib/agreements-db";
import {
  getSessionCompany,
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

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const agreementCreateSchema = z.object({
  companyId: z.string().trim().min(1).max(128),
  requirementId: z.string().trim().min(1).max(128).optional(),
  templateId: z.string().trim().min(1).max(128),
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
}).strict();

function addUtcMonths(value: Date, months: number): Date {
  const result = new Date(value);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

// Guard: Tenant isolation enforced via authoritative EmployerProfile.companyId -> Company FK boundary.
export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "agreements_contracts_get", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
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
    await enforceRateLimit(req, "agreements_contracts_post", 20, 60_000);
    const session = await requireAdminSession(req);
    const body = await readValidatedJson(req, agreementCreateSchema, 128 * 1024);

    const [targetCompany, template] = await Promise.all([
      prisma.company.findUnique({
        where: { id: body.companyId },
        select: { id: true, name: true },
      }),
      prisma.agreementTemplate.findUnique({
        where: { id: body.templateId },
      }),
    ]);

    if (!targetCompany) {
      throw new ApiError("A valid companyId is required.", 400);
    }
    if (!template || template.isArchived) {
      throw new ApiError("A current agreement template is required.", 422);
    }

    let requirement: { id: string; companyId: string | null; status: string } | null = null;
    if (body.requirementId) {
      requirement = await prisma.hiringRequirement.findUnique({
        where: { id: body.requirementId },
        select: { id: true, companyId: true, status: true },
      });
      if (!requirement || requirement.companyId !== targetCompany.id) {
        throw new ApiError(
          "Requirement does not belong to the selected company.",
          403,
        );
      }
      if (["CLOSED"].includes(requirement.status)) {
        throw new ApiError("Closed requirements cannot receive a new agreement.", 409);
      }
    }

    const feeType = body.feeType ?? template.feeType;
    const feeValue = body.feeValue ?? template.feeValue;
    const invoiceRule = body.invoiceRule ?? template.invoiceRule;
    const replacementDays = body.replacementDays ?? template.replacementDays;
    const advancePaymentAmount =
      body.advancePaymentAmount ?? template.advancePayment;
    const discountPercentage =
      body.discountPercentage ?? template.standardDiscountPct;
    const creditDays = body.creditDays ?? template.creditTermsDays;
    const taxRatePct = body.taxRatePct ?? template.taxRatePct;
    const customClauses = body.customClauses ?? template.specialClauses;
    const commercialNotes = body.commercialNotes || template.commercialNotes || "";

    if (!["PERCENTAGE", "FIXED"].includes(feeType)) {
      throw new ApiError(
        "Managed hiring billing supports only PERCENTAGE or FIXED placement fees.",
        422,
      );
    }
    if (!Number.isFinite(feeValue) || feeValue <= 0) {
      throw new ApiError("Placement fee must be a positive approved value.", 422);
    }
    if (feeType === "PERCENTAGE" && feeValue > 100) {
      throw new ApiError("Percentage placement fee cannot exceed 100%.", 422);
    }

    // The live PPH billing worker currently implements the signed DAY_25 rule.
    // Fail early instead of accepting commercial terms that cannot complete the
    // production joining -> invoice workflow.
    if (requirement && invoiceRule !== "DAY_25") {
      throw new ApiError(
        "Managed hiring agreements must use the DAY_25 invoice rule supported by the production PPH billing workflow.",
        422,
      );
    }
    if (requirement && advancePaymentAmount !== 0) {
      throw new ApiError(
        "Managed hiring DAY_25 placement billing does not support advance payment. Amend the commercial model before activation.",
        422,
      );
    }

    const startDate = body.validityStartDate
      ? new Date(body.validityStartDate)
      : new Date();
    const templateMonths = Math.max(1, Math.min(template.validityMonths, 120));
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

    const newAgreement = await agreementsDb.createAgreement(
      {
        requirementId: requirement?.id,
        templateId: template.id,
        companyId: targetCompany.id,
        companyName: targetCompany.name,
        clientLegalName: body.clientLegalName,
        contactPerson: body.contactPerson,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone || "",
        feeType,
        feeValue,
        invoiceRule,
        replacementDays,
        validityStartDate: startDate.toISOString(),
        validityEndDate: endDate.toISOString(),
        advancePaymentAmount,
        discountPercentage,
        creditDays,
        taxRatePct,
        customClauses,
        commercialNotes,
        salesExecutiveNotes: body.salesExecutiveNotes || "",
      },
      session.name || session.email,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Commercial agreement drafted successfully.",
        agreement: newAgreement,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
