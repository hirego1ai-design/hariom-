import { NextRequest, NextResponse } from "next/server";
import { Prisma, RequirementStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(RequirementStatus).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_managed_hiring_requirements:${admin.id}`,
      60,
      60_000,
    );

    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    const where: Prisma.HiringRequirementWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { referenceCode: { contains: query.search, mode: "insensitive" } },
              { companyName: { contains: query.search, mode: "insensitive" } },
              { contactPerson: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, requirements] = await prisma.$transaction([
      prisma.hiringRequirement.count({ where }),
      prisma.hiringRequirement.findMany({
        where,
        select: {
          id: true,
          referenceCode: true,
          companyId: true,
          companyName: true,
          contactPerson: true,
          email: true,
          industry: true,
          numberOfPositions: true,
          jobTitles: true,
          experienceYears: true,
          location: true,
          joiningTimeline: true,
          hiringPriority: true,
          replacementExpectation: true,
          salaryRangeMin: true,
          salaryRangeMax: true,
          currency: true,
          status: true,
          assignedSalesLead: true,
          createdAt: true,
          updatedAt: true,
          agreements: {
            where: {
              status: {
                in: ["ACTIVE", "SENT_TO_EMPLOYER", "AMENDMENT_REQUESTED"],
              },
            },
            select: { id: true, status: true, updatedAt: true },
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: query.page,
      limit: query.limit,
      requirements: requirements.map((requirement) => ({
        id: requirement.id,
        referenceCode: requirement.referenceCode,
        companyId: requirement.companyId,
        companyName: requirement.companyName,
        contactPerson: requirement.contactPerson,
        email: requirement.email,
        industry: requirement.industry,
        numberOfPositions: requirement.numberOfPositions,
        jobTitles: requirement.jobTitles,
        experienceYears: requirement.experienceYears,
        location: requirement.location,
        joiningTimeline: requirement.joiningTimeline,
        hiringPriority: requirement.hiringPriority,
        replacementExpectation: requirement.replacementExpectation,
        salaryRangeMin: requirement.salaryRangeMin,
        salaryRangeMax: requirement.salaryRangeMax,
        currency: requirement.currency,
        status: requirement.status,
        assignedSalesLead: requirement.assignedSalesLead,
        activeAgreementId: requirement.agreements[0]?.id ?? null,
        activeAgreementStatus: requirement.agreements[0]?.status ?? null,
        createdAt: requirement.createdAt.toISOString(),
        updatedAt: requirement.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
