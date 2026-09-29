import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_audit_logs:${admin.id}`, 30, 60_000);
    const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));

    const where: Prisma.AuditLogWhereInput = query.search
      ? {
          OR: [
            { action: { contains: query.search, mode: "insensitive" } },
            { resource: { contains: query.search, mode: "insensitive" } },
            { details: { contains: query.search, mode: "insensitive" } },
            { userId: { contains: query.search, mode: "insensitive" } },
            { companyId: { contains: query.search, mode: "insensitive" } },
            { ipAddress: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, rows] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: query.page,
      limit: query.limit,
      logs: rows.map((log) => ({
        id: log.id,
        userId: log.userId,
        companyId: log.companyId,
        action: log.action,
        resource: log.resource,
        ipAddress: log.ipAddress,
        details: log.details,
        timestamp: log.createdAt.toISOString(),
      })),
      source: "persisted_audit_log",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
