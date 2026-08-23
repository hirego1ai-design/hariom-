import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    let applications: any[] = [];

    try {
      const candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.id },
      });

      if (candidate) {
        applications = await prisma.application.findMany({
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
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Database fallback
      applications = [];
    }

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return jsonError("jobId is required", 400);
    }

    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job) {
      return jsonError("Job listing not found", 404);
    }

    let application: any = null;

    try {
      let candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.id },
      });

      if (!candidate) {
        candidate = await prisma.candidateProfile.create({
          data: {
            userId: session.id,
            headline: "Candidate",
            location: "India",
          },
        });
      }

      const { RosGateway } = await import("@/lib/ros/RosGateway");
      const { application: newApp, evalResult } = await RosGateway.handleApplicationSubmission({
        userId: session.id,
        jobId,
        candidateProfileId: candidate.id,
        companyId: job.companyId,
      });
      application = newApp;
    } catch (e: any) {
      return jsonError(e.message || "Failed to submit application", 500);
    }

    return NextResponse.json({ success: true, application, message: "Application submitted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
