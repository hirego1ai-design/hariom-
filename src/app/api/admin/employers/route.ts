import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_employers:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));

    const where: Prisma.EmployerProfileWhereInput = {
      user: { is: { role: "EMPLOYER" } },
      ...(query.search
        ? {
            OR: [
              { company: { name: { contains: query.search, mode: "insensitive" } } },
              { user: { is: { name: { contains: query.search, mode: "insensitive" } } } },
              { user: { is: { email: { contains: query.search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [total, employers] = await prisma.$transaction([
      prisma.employerProfile.count({ where }),
      prisma.employerProfile.findMany({
        where,
        select: {
          id: true,
          designation: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              emailVerified: true,
              role: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              location: true,
              createdAt: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      page: query.page,
      limit: query.limit,
      total,
      data: employers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
