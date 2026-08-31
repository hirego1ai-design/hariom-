import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const applicationSchema = z.object({
  jobId: z.string().uuid(),
  answers: z.object({
    noticePeriod: z.string().trim().max(200).optional(),
    experienceYears: z.string().trim().max(20).optional(),
    whyJoin: z.string().trim().max(5_000).optional(),
  }).strict().optional(),
}).strict();

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
    if (!candidate) return NextResponse.json({ success: true, applications: [] });
    const applications = await prisma.application.findMany({
          where: { candidateProfileId: candidate.id },
          include: {
            job: {
              include: {
                company: true,
              },
            },
            interviews: true,
          },
          orderBy: { createdAt: "desc" },
        });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    const { jobId } = await readValidatedJson(req, applicationSchema);

    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job) {
      return jsonError("Job listing not found", 404);
    }
    if (job.status !== "ACTIVE") {
      return jsonError("This job is no longer accepting applications", 409);
    }

    try {
      const candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.id },
      });
      if (!candidate) {
        return jsonError("Complete your candidate profile before applying.", 409);
      }

      if (job.requiresJobReady) {
        if (!job.jobReadyRoleTitle || !job.jobReadySeniority) {
          return jsonError("This job's Job-Ready requirement is not configured. Please contact support.", 409);
        }
        const readiness = await prisma.candidateReadiness.findUnique({
          where: {
            candidateProfileId_roleTitle_seniority: {
              candidateProfileId: candidate.id,
              roleTitle: job.jobReadyRoleTitle,
              seniority: job.jobReadySeniority,
            },
          },
        });
        const isCurrent = readiness?.status === "JOB_READY" && (!readiness.validUntil || readiness.validUntil > new Date());
        if (!isCurrent) {
          return jsonError("Complete and pass the required Job-Ready assessment before applying to this role.", 403);
        }
      }

      const { RosGateway } = await import("@/lib/ros/RosGateway");
      const submission = await RosGateway.handleApplicationSubmission({
        userId: session.id,
        jobId,
        candidateProfileId: candidate.id,
        companyId: job.companyId,
      });

      return NextResponse.json({
        success: true,
        application: submission.application,
        evaluation: submission.evaluation,
        message: "Application submitted successfully",
      }, { status: 201 });
    } catch (e: any) {
      if (e?.code === "P2002" || e?.name === "DuplicateApplicationError") {
        return jsonError("You have already applied to this job.", 409);
      }
      if (e instanceof ApiError) throw e;
      return jsonError("Application could not be submitted. Please try again.", 503);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
