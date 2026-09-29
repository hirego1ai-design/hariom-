import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib";
import { ApiError, enforceRateLimit } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { reconcileExpiredJobs } from "@/lib/jobExpiry";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "public_jobs_search", 120, 60_000);
    await reconcileExpiredJobs(prisma);
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const location = (searchParams.get("location") || "").trim();
    const department = (searchParams.get("department") || "").trim();
    const type = (searchParams.get("type") || "").trim();
    if ([query, location, department, type].some((value) => value.length > 160)) {
      throw new ApiError("Job search filters are too long.", 400);
    }
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit")) || 10));
    const skip = (page - 1) * limit;

    const now = new Date();
    const where: any = {
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

      if (query) {
        where.AND = [{
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { department: { contains: query, mode: "insensitive" } },
            { company: { name: { contains: query, mode: "insensitive" } } },
          ],
        }];
      }

      if (location) {
        where.location = { contains: location, mode: "insensitive" };
      }

      if (department) {
        where.department = { equals: department, mode: "insensitive" };
      }

      if (type) {
        where.type = { equals: type, mode: "insensitive" };
      }

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              location: true,
            },
          },
        },
      }),
      prisma.jobListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
