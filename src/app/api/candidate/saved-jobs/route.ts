import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

const allowMockFallbacks = process.env.NODE_ENV !== "production" || process.env.MOCK_DB === "true";

// Fallback in-memory saved jobs
const inMemorySavedJobs: Map<string, Set<string>> = new Map();

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    try {
      const saved = await (prisma as any).savedJob?.findMany?.({
        where: { userId: session.id },
        include: {
          job: {
            include: {
              company: {
                select: { name: true, logoUrl: true, location: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (saved && saved.length > 0) {
        return NextResponse.json({
          success: true,
          savedJobs: saved.map((s: any) => ({
            id: s.id,
            jobId: s.jobId,
            savedAt: s.createdAt,
            job: s.job,
          })),
        });
      }
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to load saved jobs.");
      }
    }

    if (!allowMockFallbacks) {
      return NextResponse.json({
        success: true,
        savedJobs: [],
      });
    }

    const userSaved = Array.from(inMemorySavedJobs.get(session.id) || []);
    return NextResponse.json({
      success: true,
      savedJobs: userSaved.map((jobId) => ({
        id: `saved-${jobId}`,
        jobId,
        savedAt: new Date().toISOString(),
        job: null,
        unavailable: true,
      })),
      warning: userSaved.length > 0 ? "Saved job details are unavailable while the database is offline." : undefined,
    });
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

    const body = await req.json();
    const jobId = body.jobId;
    if (!jobId) {
      return jsonError("jobId is required", 400);
    }

    try {
      const record = await (prisma as any).savedJob?.upsert?.({
        where: {
          userId_jobId: {
            userId: session.id,
            jobId,
          },
        },
        create: {
          userId: session.id,
          jobId,
        },
        update: {},
      });

      return NextResponse.json({
        success: true,
        message: "Job saved successfully",
        savedJob: record,
      });
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to save job.");
      }
      if (!inMemorySavedJobs.has(session.id)) {
        inMemorySavedJobs.set(session.id, new Set());
      }
      inMemorySavedJobs.get(session.id)!.add(jobId);

      return NextResponse.json({
        success: true,
        message: "Job saved successfully",
        savedJob: { id: `saved-${jobId}`, userId: session.id, jobId },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return jsonError("jobId parameter is required", 400);
    }

    try {
      await (prisma as any).savedJob?.deleteMany?.({
        where: {
          userId: session.id,
          jobId,
        },
      });
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to remove saved job.");
      }
      if (inMemorySavedJobs.has(session.id)) {
        inMemorySavedJobs.get(session.id)!.delete(jobId);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Job removed from saved list",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
