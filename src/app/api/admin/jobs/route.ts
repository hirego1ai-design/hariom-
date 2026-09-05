import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const where = query.search
      ? { OR: [{ title: { contains: query.search, mode: "insensitive" as const } }, { company: { name: { contains: query.search, mode: "insensitive" as const } } }] }
      : {};
    const [total, jobs] = await prisma.$transaction([
      prisma.jobListing.count({ where }),
      prisma.jobListing.findMany({
        where,
        select: { id: true, title: true, department: true, location: true, type: true, status: true, createdAt: true, company: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return NextResponse.json({ success: true, page: query.page, limit: query.limit, total, data: jobs });
  } catch (error) {
    return handleApiError(error);
  }
}
