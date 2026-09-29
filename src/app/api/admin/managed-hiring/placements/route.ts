import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const placementStatuses = ["SCHEDULED", "HOLD", "INVOICED", "CANCELLED"] as const;

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(placementStatuses).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const actionSchema = z.object({
  placementId: z.string().uuid(),
  action: z.enum(["HOLD", "RESUME", "CANCEL"]),
  reason: z.string().trim().min(5).max(1000),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_managed_hiring_placements_read:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));

    const where: Prisma.PphPlacementWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { id: { contains: query.search, mode: "insensitive" } },
              { applicationId: { contains: query.search, mode: "insensitive" } },
              { agreementId: { contains: query.search, mode: "insensitive" } },
              {
                application: {
                  is: {
                    job: {
                      is: {
                        title: { contains: query.search, mode: "insensitive" },
                      },
                    },
                  },
                },
              },
              {
                application: {
                  is: {
                    job: {
                      is: {
                        company: {
                          is: {
                            name: { contains: query.search, mode: "insensitive" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                application: {
                  is: {
                    candidateProfile: {
                      is: {
                        user: {
                          is: {
                            name: { contains: query.search, mode: "insensitive" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                application: {
                  is: {
                    candidateProfile: {
                      is: {
                        user: {
                          is: {
                            email: { contains: query.search, mode: "insensitive" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows, statusRows] = await prisma.$transaction([
      prisma.pphPlacement.count({ where }),
      prisma.pphPlacement.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          application: {
            select: {
              id: true,
              status: true,
              candidateProfile: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              job: {
                select: {
                  id: true,
                  title: true,
                  company: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          agreement: {
            select: {
              id: true,
              agreementNumber: true,
              status: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
            },
          },
        },
      }),
      prisma.pphPlacement.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: query.page,
      limit: query.limit,
      statusCounts: Object.fromEntries(
        statusRows.map((row) => [row.status, (row._count as { id?: number } | undefined)?.id ?? 0]),
      ),
      placements: rows.map((row) => ({
        id: row.id,
        applicationId: row.applicationId,
        agreementId: row.agreementId,
        agreementNumber: row.agreement.agreementNumber,
        agreementStatus: row.agreement.status,
        companyId: row.companyId,
        companyName: row.application.job.company.name,
        jobId: row.application.job.id,
        jobTitle: row.application.job.title,
        candidateId: row.application.candidateProfile.user.id,
        candidateName: row.application.candidateProfile.user.name,
        candidateEmail: row.application.candidateProfile.user.email,
        applicationStatus: row.application.status,
        joinedAt: row.joinedAt.toISOString(),
        invoiceEligibleAt: row.invoiceEligibleAt.toISOString(),
        annualCtc: Number(row.annualCtc),
        amount: Number(row.amount),
        taxAmount: Number(row.taxAmount),
        totalAmount: Number(row.totalAmount),
        currency: row.currency,
        creditDays: row.creditDays,
        status: row.status,
        holdReason: row.holdReason,
        invoiceId: row.invoice?.id ?? null,
        invoiceNumber: row.invoice?.invoiceNumber ?? null,
        invoiceStatus: row.invoice?.status ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_managed_hiring_placements_write:${admin.id}`, 20, 60_000);
    const body = await readValidatedJson(request, actionSchema, 8 * 1024);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PphPlacement" WHERE id = ${body.placementId} FOR UPDATE`;
      const current = await tx.pphPlacement.findUnique({
        where: { id: body.placementId },
      });
      if (!current) throw new ApiError("Placement not found.", 404);
      if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Placement changed; reload before saving.", 409);
      }

      const nextStatus =
        body.action === "HOLD"
          ? "HOLD"
          : body.action === "RESUME"
            ? "SCHEDULED"
            : "CANCELLED";

      const allowed =
        (body.action === "HOLD" && current.status === "SCHEDULED") ||
        (body.action === "RESUME" && current.status === "HOLD") ||
        (body.action === "CANCEL" && ["SCHEDULED", "HOLD"].includes(current.status));

      if (!allowed) {
        throw new ApiError(
          `Placement cannot transition from ${current.status} via ${body.action}.`,
          409,
        );
      }

      const changed = await tx.pphPlacement.updateMany({
        where: {
          id: current.id,
          status: current.status,
          updatedAt: current.updatedAt,
        },
        data: {
          status: nextStatus,
          holdReason: body.action === "RESUME" ? null : body.reason,
        },
      });
      if (changed.count !== 1) {
        throw new ApiError("Placement changed; reload before saving.", 409);
      }

      const placement = await tx.pphPlacement.findUniqueOrThrow({
        where: { id: current.id },
      });

      await tx.agreementEvent.create({
        data: {
          agreementId: current.agreementId,
          performedBy: admin.id,
          eventType: `PPH_${body.action}`,
          notes: `Placement ${current.id}: ${body.reason}`,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          companyId: current.companyId,
          action: `PPH_PLACEMENT_${body.action}`,
          resource: `PphPlacement:${current.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            previousStatus: current.status,
            newStatus: nextStatus,
            reason: body.reason,
            agreementId: current.agreementId,
            applicationId: current.applicationId,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return placement;
    });

    return NextResponse.json({
      success: true,
      message: `Placement ${body.action.toLowerCase()} completed and audited.`,
      placement: {
        id: updated.id,
        status: updated.status,
        holdReason: updated.holdReason,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
