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
    const where = {
      role: "CANDIDATE" as const,
      ...(query.search
        ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { email: { contains: query.search, mode: "insensitive" as const } }] }
        : {}),
    };
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, emailVerified: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return NextResponse.json({ success: true, page: query.page, limit: query.limit, total, data: users });
  } catch (error) {
    return handleApiError(error);
  }
}
