import { NextRequest, NextResponse } from "next/server";
import { ApiError, getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { toEmployerCandidate } from "@/lib/candidateEvidence";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN") {
      return jsonError("Employer, recruiter, or administrator access required.", 403);
    }

    const { searchParams } = new URL(req.url);
    const requestedLimit = searchParams.get("limit");
    const requestedCursor = searchParams.get("cursor");
    const limit = requestedLimit === null ? DEFAULT_PAGE_SIZE : Number(requestedLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new ApiError(`limit must be an integer between 1 and ${MAX_PAGE_SIZE}.`, 400);
    }
    if (requestedCursor && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedCursor)) {
      throw new ApiError("Invalid candidate cursor.", 400);
    }

    let candidates: any[] = [];
    let nextCursor: string | null = null;

    try {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });

      if (employerProfile) {
        const companyId = employerProfile.companyId;

        // Cursor pagination prevents a large tenant's pipeline from loading
        // every application and nested profile into one request.
        const applications = await prisma.application.findMany({
          where: { job: { companyId } },
          include: {
            candidateProfile: { include: {
              user: { select: { name: true } },
              videoResumes: {
                where: { OR: [{ retentionExpiresAt: null }, { retentionExpiresAt: { gt: new Date() } }] },
                select: { id: true },
                take: 1,
              },
            } },
            job: {
              select: {
                title: true,
                location: true,
                type: true,
              },
            },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          cursor: requestedCursor ? { id: requestedCursor } : undefined,
          skip: requestedCursor ? 1 : 0,
          take: limit + 1,
        });

        const page = applications.slice(0, limit);
        nextCursor = applications.length > limit ? page[page.length - 1]?.id || null : null;

        // Transform applications to candidate format
        candidates = page.map(toEmployerCandidate);
      }
    } catch (dbError) {
      console.error("Candidates DB error:", dbError);
      if (process.env.NODE_ENV === "production") {
        throw new Error("Candidate pipeline database is unavailable.");
      }
    }

    return NextResponse.json({
      success: true,
      candidates,
      pagination: { limit, nextCursor, hasMore: nextCursor !== null },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
