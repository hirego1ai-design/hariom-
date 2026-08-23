import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { prisma } from "@/lib/prisma";

const updateJobSchema = z.object({
  title: z.string().min(3).optional(),
  company: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  type: z.string().optional(),
  salary: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "CLOSED", "PAUSED"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN")) {
      throw new ApiError("Employer, recruiter, or administrator access required.", 403);
    }
    const { id } = await params;
    const job = await prisma.jobListing.findUnique({
      where: { id },
    });
    if (!job) {
      throw new ApiError("Job listing not found.", 404);
    }
    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
      if (!profile?.companyId || job.companyId !== profile.companyId) {
        throw new ApiError("Forbidden: job listing does not belong to your company.", 403);
      }
    }
    return NextResponse.json({ success: true, job });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await enforceRateLimit(request, "employer_jobs_put");
    const session = await getCurrentSession(request.headers);

    if (!session || (session.role !== "EMPLOYER" && session.role !== "ADMIN")) {
      throw new ApiError("Forbidden: Employer or Admin role required.", 403);
    }

    const body = await readValidatedJson(request, updateJobSchema);

    const profile = session.role === "ADMIN"
      ? null
      : await prisma.employerProfile.findUnique({ where: { userId: session.id } });
    if (session.role !== "ADMIN" && !profile?.companyId) {
      throw new ApiError("Employer profile not found.", 403);
    }
    const companyId = profile?.companyId;

    // Load existing job state
    const oldJob = await prisma.jobListing.findUnique({
      where: { id },
    });
    if (!oldJob) {
      throw new ApiError("Job listing not found.", 404);
    }
    if (session.role !== "ADMIN" && oldJob.companyId !== companyId) {
      throw new ApiError("Forbidden: job listing does not belong to your company.", 403);
    }

    const isPublishingDraft = oldJob.status === "DRAFT" && body.status === "ACTIVE";

    const updateData = {
      title: body.title !== undefined ? body.title : undefined,
      location: body.location !== undefined ? body.location : undefined,
      type: body.type !== undefined ? body.type : undefined,
      salaryRange: body.salary !== undefined ? body.salary : undefined,
      status: body.status !== undefined ? (body.status as any) : undefined,
    };

    // Publishing consumes a credit and changes the job state in one database
    // transaction.  A concurrent publish can therefore never create a second
    // active job without an available credit.
    const updatedJob = isPublishingDraft && session.role !== "ADMIN"
      ? await prisma.$transaction(async (tx) => {
          const debited = await tx.companyCredits.updateMany({
            where: { companyId: companyId!, jobPostsLeft: { gt: 0 } },
            data: { jobPostsLeft: { decrement: 1 } },
          });
          if (debited.count !== 1) {
            throw new ApiError("Insufficient job posting credits. Please subscribe to a plan.", 402);
          }
          return tx.jobListing.update({ where: { id }, data: updateData });
        })
      : await prisma.jobListing.update({ where: { id }, data: updateData });

    logAuditEvent({
      userId: session.id,
      action: "JOB_UPDATE",
      resource: `/api/employer/jobs/${id}`,
      details: `Updated job listing ${updatedJob.title} (${updatedJob.id}). Published from draft: ${isPublishingDraft}`,
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    return handleApiError(error);
  }
}
