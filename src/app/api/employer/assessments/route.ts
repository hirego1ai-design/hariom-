import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { z } from "zod";
import { logAuditEvent } from "@/lib/auditLogger";

const createAssessmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1),
  passingPercentage: z.number().int().min(0).max(100),
  jobListingId: z.string().min(1, "Job listing ID is required"),
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "employer_create_assessment", 20, 60000);
    const session = await requireEmployerOrAdminSession(request);
    if (session.role !== "ADMIN") {
      throw new ApiError(
        "Employer job assessments are generated automatically from the job role and approved skills. Configure whether an assessment is required from the job workflow.",
        403,
      );
    }
    const data = await readValidatedJson(request, createAssessmentSchema);

    let companyId: string | undefined;

    const job = await prisma.jobListing.findUnique({
      where: { id: data.jobListingId },
    });

    if (!job) {
      throw new ApiError("Job listing not found", 404);
    }

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;

      if (job.companyId !== companyId) {
        throw new ApiError("Forbidden: Job listing does not belong to your company", 403);
      }
    } else {
      companyId = job.companyId;
    }

    const assessment = await prisma.mcqAssessment.create({
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        durationMinutes: data.durationMinutes,
        passingPercentage: data.passingPercentage,
        jobListingId: data.jobListingId,
        isActive: false, // Starts in draft mode; recruiter publishes deliberately after adding questions
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "CREATE_ASSESSMENT",
      resource: `Assessment:${assessment.id}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "employer_get_assessments", 50, 60000);
    const session = await requireEmployerOrAdminSession(request);

    const { searchParams } = new URL(request.url);
    const requestedLimit = searchParams.get("limit");
    const requestedCursor = searchParams.get("cursor");
    const limit = requestedLimit === null ? null : Number(requestedLimit);
    if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
      throw new ApiError("limit must be an integer between 1 and 100.", 400);
    }
    if (
      requestedCursor &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedCursor)
    ) {
      throw new ApiError("Invalid assessment cursor.", 400);
    }

    let whereClause = {};

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      whereClause = {
        jobListing: {
          companyId: company.id,
        },
      };
    }

    const assessments = await prisma.mcqAssessment.findMany({
      where: whereClause,
      include: {
        jobListing: {
          select: {
            title: true,
            department: true,
          }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: requestedCursor ? { id: requestedCursor } : undefined,
      skip: requestedCursor ? 1 : 0,
      take: limit === null ? undefined : limit + 1,
    });

    const page = limit === null ? assessments : assessments.slice(0, limit);
    const nextCursor =
      limit !== null && assessments.length > limit
        ? page[page.length - 1]?.id || null
        : null;

    return NextResponse.json({
      success: true,
      assessments: page,
      ...(limit !== null
        ? { pagination: { limit, nextCursor, hasMore: nextCursor !== null } }
        : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
