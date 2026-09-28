import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { revokeAllUserSessions } from "@/lib/auth";

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const updateSchema = z.object({
  userId: z.string().trim().min(1).max(191),
  newRole: z.nativeEnum(Role),
  expectedUpdatedAt: z.string().datetime(),
  reason: z.string().trim().min(3).max(500),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_roles_read:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, adminCount, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          sessionVersion: true,
          createdAt: true,
          updatedAt: true,
          candidateProfile: { select: { id: true } },
          employerProfile: { select: { id: true, companyId: true } },
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
      adminCount,
      currentAdminId: admin.id,
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        hasCandidateProfile: Boolean(user.candidateProfile),
        hasEmployerProfile: Boolean(user.employerProfile),
        companyId: user.employerProfile?.companyId ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_roles_write:${admin.id}`, 10, 60_000);
    const input = await readValidatedJson(request, updateSchema, 8 * 1024);

    if (input.userId === admin.id) {
      throw new ApiError("Administrators cannot change their own role from this screen.", 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Serialize all role mutations so concurrent admin demotions cannot race
      // the last-admin protection check.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('admin-role-governance'))`;

      const target = await tx.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
          sessionVersion: true,
          candidateProfile: { select: { id: true } },
          employerProfile: { select: { id: true } },
        },
      });
      if (!target) throw new ApiError("User not found.", 404);

      if (target.updatedAt.toISOString() !== input.expectedUpdatedAt) {
        throw new ApiError("User role state changed; reload before saving.", 409);
      }
      if (target.role === input.newRole) {
        throw new ApiError("The selected role is already assigned.", 409);
      }

      if (target.role === Role.ADMIN && input.newRole !== Role.ADMIN) {
        const adminCount = await tx.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) {
          throw new ApiError("The last administrator cannot be demoted.", 409);
        }
      }

      if (
        (input.newRole === Role.EMPLOYER || input.newRole === Role.RECRUITER) &&
        !target.employerProfile
      ) {
        throw new ApiError(
          "Employer or recruiter role requires an existing employer profile and company assignment.",
          409,
        );
      }

      if (
        input.newRole === Role.CANDIDATE &&
        (!target.candidateProfile || target.employerProfile)
      ) {
        throw new ApiError(
          "Candidate role requires a candidate profile and no employer profile.",
          409,
        );
      }

      const changed = await tx.user.updateMany({
        where: {
          id: target.id,
          updatedAt: target.updatedAt,
          role: target.role,
        },
        data: {
          role: input.newRole,
          sessionVersion: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new ApiError("User role state changed; reload before saving.", 409);
      }

      const next = await tx.user.findUniqueOrThrow({
        where: { id: target.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          sessionVersion: true,
          updatedAt: true,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "ADMIN_USER_ROLE_CHANGED",
          resource: `User:${target.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            previousRole: target.role,
            newRole: next.role,
            reason: input.reason,
            sessionVersion: next.sessionVersion,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return next;
    });

    // DB sessionVersion is authoritative. Refresh Redis eagerly so revoked
    // sessions fail quickly even before their next database-backed auth check.
    try {
      await revokeAllUserSessions(updated.id, updated.sessionVersion);
    } catch (error) {
      console.warn("[Admin Roles] Session-version cache refresh failed after authoritative DB update.", error);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
