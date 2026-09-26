import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { ensureJobSpecificAssessment } from "@/lib/jobSpecificAssessment";
import { OutboxPublisher } from "@/lib/events/Outbox";
import { consumeJobPublicationEntitlement } from "@/lib/subscriptionAccess";

const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  location: z.string().min(2, "Location required"),
  type: z.string().default("Full-time"),
  salary: z.string().min(2, "Salary range required"),
  status: z.enum(["ACTIVE", "DRAFT", "CLOSED"]).default("ACTIVE"),
  department: z.string().trim().max(120).optional(),
  requirements: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  screeningQuestions: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  aiFocusAreas: z.string().trim().max(2_000).optional(),
  requiresJobSpecificAssessment: z.boolean().optional().default(false),
  skillRequirements: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    priority: z.enum(["required", "preferred"]),
  }).strict()).max(100).optional(),
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
  ).refine(
    (config) => config.weightExperience + config.weightEducation + config.weightSkills === 100,
    "Matching weights must total exactly 100.",
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

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (!profile?.companyId) {
      throw new ApiError("Employer profile not found. Please complete employer setup.", 403);
    }
    const companyId = profile.companyId;

    const body = await readValidatedJson(request, jobSchema);
    const requestedStatus = body.status ?? "ACTIVE";
    const isPublishing = requestedStatus === "ACTIVE";
    const requiresGeneratedAssessment = isPublishing && body.requiresJobSpecificAssessment;

    const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key");
    let requestHash = "";

    if (idempotencyKey) {
      const crypto = await import("crypto");
      requestHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");

      const existingRecord = await prisma.idempotencyRecord.findUnique({
        where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
      });

      if (existingRecord) {
        if (existingRecord.requestHash !== requestHash) {
          throw new ApiError("Idempotency key already used with a different request payload.", 409);
        }
        if (existingRecord.status === "SUCCESS" && existingRecord.responsePayload) {
          return NextResponse.json(existingRecord.responsePayload as any, { status: 201 });
        }
        if (existingRecord.status === "PROCESSING") {
          throw new ApiError("A request with this idempotency key is currently processing.", 409);
        }
        if (
          existingRecord.status === "FAILED" &&
          existingRecord.jobId &&
          requiresGeneratedAssessment
        ) {
          try {
            await ensureJobSpecificAssessment(existingRecord.jobId, companyId);
            const resumed = await prisma.$transaction(async (tx) => {
              const job = await tx.jobListing.findFirst({
                where: { id: existingRecord.jobId!, companyId },
              });
              if (!job) throw new ApiError("Draft job could not be resumed.", 404);

              let remainingCredits = (await tx.companyCredits.findUnique({ where: { companyId } }))?.jobPostsLeft ?? 0;
              if (job.status !== JobStatus.ACTIVE) {
                const publication = await consumeJobPublicationEntitlement(tx, companyId);
                remainingCredits = publication.remainingJobPosts;
                await tx.jobListing.update({
                  where: { id: job.id },
                  data: {
                    status: JobStatus.ACTIVE,
                    publishedAt: publication.publishedAt,
                    expiresAt: publication.expiresAt,
                    copilotEnabled: publication.copilotEnabled,
                    copilotActivatedAt: publication.copilotEnabled ? publication.publishedAt : null,
                  },
                });
                await OutboxPublisher.publish({
                  eventType: "JOB_LISTING_CREATED",
                  payload: { jobId: job.id, companyId, title: job.title, status: JobStatus.ACTIVE },
                  correlationId: job.id,
                  companyId,
                  idempotencyKey: `job-published:${job.id}`,
                }, tx);
              }

              const activeJob = await tx.jobListing.findUniqueOrThrow({ where: { id: job.id } });
              const responsePayload = {
                success: true,
                job: activeJob,
                jobPostsLeft: remainingCredits,
                jobSpecificAssessment: "READY",
                message: `Job published successfully with job-specific assessment. 1 Job Post Credit consumed (${remainingCredits} remaining).`,
              };
              await tx.idempotencyRecord.update({
                where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
                data: { status: "SUCCESS", jobId: job.id, responsePayload: responsePayload as any },
              });
              return responsePayload;
            });
            return NextResponse.json(resumed, { status: 201 });
          } catch (resumeError) {
            await prisma.idempotencyRecord.update({
              where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
              data: { status: "FAILED" },
            }).catch(() => null);
            throw resumeError;
          }
        }
      }
    }

    const initialStatus = requiresGeneratedAssessment ? JobStatus.DRAFT : requestedStatus as JobStatus;

    const result = await prisma.$transaction(async (tx) => {
      let remainingCredits = (await tx.companyCredits.findUnique({ where: { companyId } }))?.jobPostsLeft ?? 0;

      if (idempotencyKey) {
        await tx.idempotencyRecord.upsert({
          where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
          update: { status: "PROCESSING", requestHash, responsePayload: undefined },
          create: {
            companyId,
            idempotencyKey,
            requestHash,
            status: "PROCESSING",
          },
        });
      }

      let publicationTerms: Awaited<ReturnType<typeof consumeJobPublicationEntitlement>> | null = null;
      if (isPublishing && !requiresGeneratedAssessment) {
        publicationTerms = await consumeJobPublicationEntitlement(tx, companyId);
        remainingCredits = publicationTerms.remainingJobPosts;
      }

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
          status: initialStatus,
          requiresJobSpecificAssessment: body.requiresJobSpecificAssessment,
          matchingConfig: body.matchingConfig,
          department: body.department,
          requirements: body.requirements,
          screeningQuestions: body.screeningQuestions,
          aiFocusAreas: body.aiFocusAreas,
          skillRequirements: body.skillRequirements,
        },
        tx,
      );

      const persistedJob = publicationTerms
        ? await tx.jobListing.update({
            where: { id: (newJob as { id: string }).id },
            data: {
              publishedAt: publicationTerms.publishedAt,
              expiresAt: publicationTerms.expiresAt,
              copilotEnabled: publicationTerms.copilotEnabled,
              copilotActivatedAt: publicationTerms.copilotEnabled ? publicationTerms.publishedAt : null,
            },
          })
        : newJob;
      const jobObj = persistedJob as any;
      const responsePayload = {
        success: true,
        job: persistedJob,
        jobPostsLeft: remainingCredits,
        jobSpecificAssessment: requiresGeneratedAssessment ? "GENERATING" : "NOT_REQUIRED",
        message: requiresGeneratedAssessment
          ? "Job draft created. HireGo is generating the required job-specific assessment before publication."
          : isPublishing
            ? `Job published successfully! 1 Job Post Credit consumed (${remainingCredits} remaining).`
            : "Draft saved successfully.",
      };

      if (idempotencyKey && !requiresGeneratedAssessment) {
        await tx.idempotencyRecord.update({
          where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
          data: {
            status: "SUCCESS",
            jobId: jobObj?.id || null,
            responsePayload: responsePayload as any,
          },
        });
      } else if (idempotencyKey) {
        await tx.idempotencyRecord.update({
          where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
          data: { jobId: jobObj?.id || null },
        });
      }

      return { responsePayload, remainingCredits, jobId: jobObj?.id as string };
    });

    if (requiresGeneratedAssessment) {
      try {
        await ensureJobSpecificAssessment(result.jobId, companyId);
        const finalPayload = await prisma.$transaction(async (tx) => {
          const publication = await consumeJobPublicationEntitlement(tx, companyId);
          const remainingCredits = publication.remainingJobPosts;
          const activeJob = await tx.jobListing.update({
            where: { id: result.jobId },
            data: {
              status: JobStatus.ACTIVE,
              publishedAt: publication.publishedAt,
              expiresAt: publication.expiresAt,
              copilotEnabled: publication.copilotEnabled,
              copilotActivatedAt: publication.copilotEnabled ? publication.publishedAt : null,
            },
          });
          await OutboxPublisher.publish({
            eventType: "JOB_LISTING_CREATED",
            payload: { jobId: activeJob.id, companyId, title: activeJob.title, status: JobStatus.ACTIVE },
            correlationId: activeJob.id,
            companyId,
            idempotencyKey: `job-published:${activeJob.id}`,
          }, tx);

          const responsePayload = {
            success: true,
            job: activeJob,
            jobPostsLeft: remainingCredits,
            jobSpecificAssessment: "READY",
            message: `Job published successfully with job-specific assessment. 1 Job Post Credit consumed (${remainingCredits} remaining).`,
          };
          if (idempotencyKey) {
            await tx.idempotencyRecord.update({
              where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
              data: {
                status: "SUCCESS",
                jobId: activeJob.id,
                responsePayload: responsePayload as any,
              },
            });
          }
          return responsePayload;
        });

        await logAuditEvent({
          userId: session.id,
          companyId,
          action: "JOB_CREATE",
          resource: `JobListing:${result.jobId}`,
          details: "Published job with automatically generated job-specific assessment.",
        });
        return NextResponse.json(finalPayload, { status: 201 });
      } catch (generationError) {
        if (idempotencyKey) {
          await prisma.idempotencyRecord.update({
            where: { companyId_idempotencyKey: { companyId, idempotencyKey } },
            data: { status: "FAILED", jobId: result.jobId },
          }).catch(() => null);
        }
        await logAuditEvent({
          userId: session.id,
          companyId,
          action: "JOB_SPECIFIC_ASSESSMENT_GENERATION_FAILED",
          resource: `JobListing:${result.jobId}`,
          details: generationError instanceof Error ? generationError.message.slice(0, 1_000) : "Unknown authoring failure",
        }).catch(() => null);

        if (generationError && typeof (generationError as any).status === "number") throw generationError;
        throw new ApiError(
          "Job was saved as a draft because the required job-specific assessment could not be generated. Retry publishing after AI routing and assessment policy are available.",
          503,
        );
      }
    }

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "JOB_CREATE",
      resource: `JobListing:${result.jobId}`,
      details: `Created ${requestedStatus.toLowerCase()} job listing via ROS Gateway. Credits left: ${result.remainingCredits}`,
    });

    return NextResponse.json(result.responsePayload, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

