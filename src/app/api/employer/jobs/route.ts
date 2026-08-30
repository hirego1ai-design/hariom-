import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { prisma } from "@/lib/prisma";

const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  company: z.string().min(2, "Company name required"),
  location: z.string().min(2, "Location required"),
  type: z.string().default("Full-time"),
  salary: z.string().min(2, "Salary range required"),
  status: z.enum(["ACTIVE", "DRAFT", "CLOSED"]).default("ACTIVE"),
  matchingConfig: z.object({
    weightExperience: z.number().min(0).max(100),
    weightEducation: z.number().min(0).max(100),
    weightSkills: z.number().min(0).max(100),
    autoArchiveScore: z.number().min(0).max(100),
    autoInterviewLimit: z.number().int().min(1).max(100),
    proctoringLevel: z.string().max(40).optional(),
  }).refine(
    (config) => config.weightExperience + config.weightSkills > 0,
    "Experience and skills weights must total more than zero.",
  ).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN")) {
      throw new ApiError("Employer, recruiter, or administrator access required.", 403);
    }

    if (session.role === "ADMIN") {
      const jobs = await prisma.jobListing.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json({ success: true, count: jobs.length, jobs });
    }

    const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
    if (!profile?.companyId) throw new ApiError("Employer profile not found.", 403);
    const jobs = await prisma.jobListing.findMany({
      where: { companyId: profile.companyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "employer_jobs_post");
    const session = await getCurrentSession(request.headers);

    if (!session || (session.role !== "EMPLOYER" && session.role !== "RECRUITER")) {
      throw new ApiError("Forbidden: Employer or recruiter role required.", 403);
    }

    // Resolve authoritative companyId
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (!profile?.companyId) {
      throw new ApiError("Employer profile not found. Please complete employer setup.", 403);
    }
    const companyId = profile.companyId!;

    const body = await readValidatedJson(request, jobSchema);
    const isPublishing = body.status === "ACTIVE";

    // 1. Idempotency Key Inspection
    const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key");
    let requestHash = "";

    if (idempotencyKey) {
      const crypto = await import("crypto");
      requestHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");

      const existingRecord = await prisma.idempotencyRecord.findUnique({
        where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
      });

      if (existingRecord) {
        if (existingRecord.status === "SUCCESS" && existingRecord.responsePayload) {
          if (existingRecord.requestHash !== requestHash) {
            throw new ApiError("Idempotency key already used with a different request payload.", 409);
          }
          // Idempotent Return: Return cached response without re-executing credit deduction or job creation
          return NextResponse.json(existingRecord.responsePayload as any, { status: 201 });
        }
        if (existingRecord.status === "PROCESSING") {
          throw new ApiError("A request with this idempotency key is currently processing.", 409);
        }
      }
    }

    // 2. UNIFIED ATOMIC TRANSACTION: Subscription Check + Credit Reservation + Job Creation + Outbox + Trace + Idempotency
    const result = await prisma.$transaction(async (tx) => {
      let remainingCredits = 999;

      // Reserve Idempotency Record status PROCESSING inside transaction
      if (idempotencyKey) {
        await tx.idempotencyRecord.upsert({
          where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
          update: { status: "PROCESSING", requestHash },
          create: {
            companyId,
            idempotencyKey,
            requestHash,
            status: "PROCESSING",
          },
        });
      }

      if (isPublishing && session.role !== "ADMIN") {
        // A. Check Subscription Expiry
        const sub = await tx.companySubscription.findFirst({ where: { companyId } });
        const subStatus = (sub?.status as string) || "";
        if (sub && (subStatus === "EXPIRED" || subStatus === "CANCELLED" || new Date(sub.endDate) < new Date())) {
          throw new ApiError("Subscription has expired. Please renew your plan to publish jobs.", 403);
        }

        // B. Atomic Conditional Update: Only decrement if jobPostsLeft > 0
        const updateResult = await tx.companyCredits.updateMany({
          where: { companyId, jobPostsLeft: { gt: 0 } },
          data: { jobPostsLeft: { decrement: 1 } },
        });

        if (updateResult.count === 0) {
          throw new ApiError("Insufficient job posting credits. Quotas exhausted.", 402);
        }

        const updatedCredits = await tx.companyCredits.findUnique({ where: { companyId } });
        remainingCredits = updatedCredits?.jobPostsLeft ?? 0;
      }

      // C. Process Job Creation through ROS Gateway (PASSING tx CONTEXT FOR SINGLE ATOMIC COMMIT)
      const { RosGateway } = await import("@/lib/ros/RosGateway");
      const { job: newJob } = await RosGateway.handleJobCreation(
        {
          userId: session.id,
          userRole: session.role as any,
          companyId,
          jobTitle: body.title,
          salaryRange: body.salary,
          location: body.location,
          type: body.type ?? "Full-time",
          matchingConfig: body.matchingConfig,
        },
        tx
      );

      const responsePayload = {
        success: true,
        job: newJob,
        jobPostsLeft: remainingCredits,
        message: isPublishing
          ? `Job published successfully! 1 Job Post Credit consumed (${remainingCredits} remaining).`
          : "Draft saved successfully.",
      };

      // D. Finalize Idempotency Record status SUCCESS
      if (idempotencyKey) {
        const jobObj = newJob as any;
        await tx.idempotencyRecord.update({
          where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
          data: {
            status: "SUCCESS",
            jobId: jobObj?.id || null,
            responsePayload: responsePayload as any,
          },
        });
      }

      return { responsePayload, remainingCredits };
    });

    logAuditEvent({
      userId: session.id,
      action: "JOB_CREATE",
      resource: "/api/employer/jobs",
      details: `Created job listing ${body.title} via ROS Gateway. Credits left: ${result.remainingCredits}`,
    });

    return NextResponse.json(result.responsePayload, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
