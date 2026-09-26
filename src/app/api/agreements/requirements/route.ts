import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agreementsDb } from "@/lib/agreements-db";
import {
  getSessionCompany,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const bounded = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalMoney = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().finite().nonnegative().max(1_000_000_000).optional(),
);

const requirementInputSchema = z
  .object({
    companyId: z.string().trim().min(1).max(128).optional(),
    companyName: optionalText(200),
    contactPerson: bounded("Contact person", 200),
    email: z.string().trim().email().max(320),
    primaryMobile: bounded("Primary mobile", 40),
    secondaryMobile: optionalText(40),
    alternatePhone: optionalText(40),
    gstin: optionalText(40),
    gst: optionalText(40),
    pan: optionalText(40),
    billingAddress: optionalText(2_000),
    website: optionalText(2_000),

    industry: bounded("Industry", 200),
    numberOfPositions: z.coerce.number().int().min(1).max(10_000),
    multipleRoles: z.boolean().optional(),
    jobTitles: z.union([
      z.array(bounded("Job title", 200)).min(1).max(100),
      bounded("Job titles", 10_000),
    ]),
    department: optionalText(200),
    experienceYears: bounded("Experience requirement", 500),
    employmentType: optionalText(100),
    workMode: bounded("Work mode", 100),
    location: bounded("Location", 500),
    shift: optionalText(200),
    noticePeriod: optionalText(200),
    joiningTimeline: bounded("Joining timeline", 500),

    mandatorySkills: z.array(bounded("Mandatory skill", 200)).max(200).optional(),
    skillsRequired: z
      .union([
        z.array(bounded("Required skill", 200)).max(200),
        bounded("Required skills", 10_000),
      ])
      .optional(),
    preferredSkills: z.array(bounded("Preferred skill", 200)).max(200).optional(),
    education: bounded("Education requirement", 500),
    certifications: optionalText(2_000),
    languages: optionalText(2_000),
    tools: optionalText(2_000),

    salaryRangeMin: optionalMoney,
    salaryRangeMax: optionalMoney,
    budgetMin: optionalMoney,
    budgetMax: optionalMoney,
    currency: z.string().trim().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code."),
    variableComponent: optionalText(500),
    bonusIncentives: optionalText(2_000),
    benefits: z.array(bounded("Benefit", 500)).max(100).optional(),

    hiringPriority: bounded("Hiring priority", 100),
    replacementExpectation: bounded("Replacement expectation", 200),
    additionalNotes: optionalText(10_000),
    notes: optionalText(10_000),
    jdFileName: optionalText(500),
    jdFileUrl: optionalText(2_000),

    newMandatorySkill: optionalText(200),
    positions: z.array(z.object({
      jobTitle: bounded("Position job title", 200),
      numberOfPositions: z.coerce.number().int().min(1).max(10_000),
      experienceYears: bounded("Position experience requirement", 500),
      workMode: bounded("Position work mode", 100),
      location: bounded("Position location", 500),
    }).strict()).min(1).max(100).optional(),
    newMandatorySkill: optionalText(200),
    newPreferredSkill: optionalText(200),
  })
  .superRefine((body, ctx) => {
    const min = body.salaryRangeMin ?? body.budgetMin;
    const max = body.salaryRangeMax ?? body.budgetMax;
    if (min === undefined || max === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both minimum and maximum salary/budget are required.",
        path: ["salaryRangeMin"],
      });
      return;
    }
    if (max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum salary/budget must be greater than or equal to the minimum.",
        path: ["salaryRangeMax"],
      });
    }
  });

function normalizedTitles(value: z.infer<typeof requirementInputSchema>["jobTitles"]): string[] {
  const titles = Array.isArray(value)
    ? value
    : value.split(",").map((item) => item.trim());
  return [...new Set(titles.map((item) => item.trim()).filter(Boolean))];
}

function normalizedSkills(
  mandatory: string[] | undefined,
  fallback: string[] | string | undefined,
): string[] {
  const values = mandatory?.length
    ? mandatory
    : Array.isArray(fallback)
      ? fallback
      : typeof fallback === "string"
        ? fallback.split(",")
        : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

// Guard: Tenant isolation enforced via authoritative EmployerProfile.companyId -> Company FK boundary.
export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "agreements_requirements_get", 60, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    let requirements = await agreementsDb.getRequirements();

    if (session.role === "ADMIN") {
      const url = new URL(req.url);
      const queryCompanyId = url.searchParams.get("companyId");
      if (queryCompanyId) {
        requirements = requirements.filter(
          (requirement) => requirement.companyId === queryCompanyId,
        );
      }
    } else {
      const company = await getSessionCompany(session);
      requirements = requirements.filter(
        (requirement) => requirement.companyId === company.id,
      );
    }

    return NextResponse.json({
      success: true,
      count: requirements.length,
      requirements,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "agreements_requirements_post", 20, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    const body = await readValidatedJson(req, requirementInputSchema, 128 * 1024);

    const targetCompany =
      session.role === "ADMIN"
        ? await prisma.company.findUnique({
            where: { id: body.companyId ?? "" },
            select: { id: true, name: true },
          })
        : await getSessionCompany(session);

    if (!targetCompany) {
      throw new ApiError("A valid companyId is required.", 400);
    }

    const jobTitles = normalizedTitles(body.jobTitles);
    if (!jobTitles.length) {
      throw new ApiError("At least one job title is required.", 422);
    }

    const skillsRequired = normalizedSkills(
      body.mandatorySkills,
      body.skillsRequired,
    );
    const salaryRangeMin = body.salaryRangeMin ?? body.budgetMin;
    const salaryRangeMax = body.salaryRangeMax ?? body.budgetMax;
    if (salaryRangeMin === undefined || salaryRangeMax === undefined) {
      throw new ApiError("Salary/budget range is required.", 422);
    }

    const newReq = await agreementsDb.createRequirement({
      companyId: targetCompany.id,
      companyName: targetCompany.name,
      contactPerson: body.contactPerson,
      email: body.email,
      primaryMobile: body.primaryMobile,
      secondaryMobile: body.secondaryMobile || body.alternatePhone || "",
      website: body.website || undefined,
      gstin: body.gstin || body.gst || "",
      pan: body.pan || "",
      billingAddress: body.billingAddress || "",
      industry: body.industry,
      numberOfPositions: body.numberOfPositions,
      multipleRoles: body.multipleRoles ?? jobTitles.length > 1,
      jobTitles,
      department: body.department || undefined,
      experienceYears: body.experienceYears,
      employmentType: body.employmentType || undefined,
      skillsRequired,
      preferredSkills: body.preferredSkills || [],
      education: body.education,
      certifications: body.certifications || "",
      languages: body.languages || undefined,
      tools: body.tools || undefined,
      salaryRangeMin,
      salaryRangeMax,
      currency: body.currency,
      variableComponent: body.variableComponent || undefined,
      bonusIncentives: body.bonusIncentives || undefined,
      benefits: body.benefits || [],
      workMode: body.workMode,
      location: body.location,
      shift: body.shift || undefined,
      noticePeriod: body.noticePeriod || undefined,
      joiningTimeline: body.joiningTimeline,
      hiringPriority: body.hiringPriority,
      replacementExpectation: body.replacementExpectation,
      positions: body.positions,
      additionalNotes: body.additionalNotes || body.notes || "",
      jdFileName: body.jdFileName || undefined,
      jdFileUrl: body.jdFileUrl || undefined,
      assignedSalesLead: undefined,
      activeAgreementId: undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Hiring requirement submitted successfully.",
        referenceCode: newReq.referenceCode,
        requirement: newReq,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
