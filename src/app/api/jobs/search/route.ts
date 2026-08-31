import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const department = searchParams.get("department") || "";
    const type = searchParams.get("type") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit")) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE",
    };

      if (query) {
        where.OR = [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ];
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
        orderBy: { createdAt: "desc" },
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
