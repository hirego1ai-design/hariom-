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
      ? { company: { name: { contains: query.search, mode: "insensitive" as const } } }
      : {};
    const [total, employers] = await prisma.$transaction([
      prisma.employerProfile.count({ where }),
      prisma.employerProfile.findMany({
        where,
        select: { id: true, designation: true, createdAt: true, user: { select: { name: true, email: true, emailVerified: true } }, company: { select: { id: true, name: true, industry: true, location: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return NextResponse.json({ success: true, page: query.page, limit: query.limit, total, data: employers });
  } catch (error) {
    return handleApiError(error);
  }
}
