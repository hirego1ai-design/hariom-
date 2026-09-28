import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { copilotAdminPatchSchema } from "@/lib/copilot/contracts";
import { assertCurrentCopilotTaxPolicy } from "@/lib/copilot/taxPolicy";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_copilot_commerce_read:${admin.id}`, 60, 60_000);

    const [plans, rules] = await Promise.all([
      prisma.copilotPlan.findMany({
        include: { regionalPrices: { orderBy: [{ regionCode: "asc" }, { id: "asc" }], take: 250 } },
        orderBy: [{ monthlyCapacityUnits: "asc" }, { id: "asc" }],
        take: 100,
      }),
      prisma.copilotUsageRule.findMany({
        orderBy: [{ actionKey: "asc" }, { id: "asc" }],
        take: 500,
      }),
    ]);

    return NextResponse.json({
      success: true,
      product: "COPILOT",
      plans,
      usageRules: rules,
      warning: "Usage weights and internal cost estimates are administration-only and must never be exposed by employer APIs.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_copilot_commerce_write:${session.id}`, 20, 60_000);
    const body = await readValidatedJson(req, copilotAdminPatchSchema);

    const result = await prisma.$transaction(async (tx) => {
      let entity: "PLAN" | "PRICE" | "USAGE_RULE";
      let resource: string;
      let changedFields: string[] = [];
      let updated: unknown;

      if (body.type === "PLAN") {
        const current = await tx.copilotPlan.findUnique({ where: { id: body.planId } });
        if (!current) throw new ApiError("Copilot plan not found.", 404);
        if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
          throw new ApiError("Copilot plan changed; reload before saving.", 409);
        }

        const soft = body.softWarningPct ?? current.softWarningPct;
        const hard = body.hardWarningPct ?? current.hardWarningPct;
        if (soft >= hard) {
          throw new ApiError("Soft warning threshold must remain below hard warning threshold.", 422);
        }

        const {
          type: _type,
          planId,
          expectedUpdatedAt: _expectedUpdatedAt,
          reason: _reason,
          ...changes
        } = body;
        const changed = await tx.copilotPlan.updateMany({
          where: { id: planId, updatedAt: current.updatedAt },
          data: changes,
        });
        if (changed.count !== 1) {
          throw new ApiError("Copilot plan changed; reload before saving.", 409);
        }
        updated = await tx.copilotPlan.findUniqueOrThrow({ where: { id: planId } });
        entity = "PLAN";
        resource = `CopilotPlan:${planId}`;
        changedFields = Object.keys(changes);
      } else if (body.type === "PRICE") {
        const current = await tx.copilotRegionalPrice.findUnique({ where: { id: body.priceId } });
        if (!current) throw new ApiError("Copilot regional price not found.", 404);
        if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
          throw new ApiError("Copilot regional price changed; reload before saving.", 409);
        }

        const effective = {
          regionCode: current.regionCode,
          countries: body.countries ?? current.countries,
          taxMode: body.taxMode ?? current.taxMode,
          taxRateBps: body.taxRateBps ?? current.taxRateBps,
        };
        try {
          assertCurrentCopilotTaxPolicy(effective);
        } catch (error) {
          throw new ApiError(error instanceof Error ? error.message : "Invalid Copilot tax policy.", 422);
        }

        const {
          type: _type,
          priceId,
          expectedUpdatedAt: _expectedUpdatedAt,
          reason: _reason,
          ...changes
        } = body;
        const changed = await tx.copilotRegionalPrice.updateMany({
          where: { id: priceId, updatedAt: current.updatedAt },
          data: changes,
        });
        if (changed.count !== 1) {
          throw new ApiError("Copilot regional price changed; reload before saving.", 409);
        }
        updated = await tx.copilotRegionalPrice.findUniqueOrThrow({ where: { id: priceId } });
        entity = "PRICE";
        resource = `CopilotRegionalPrice:${priceId}`;
        changedFields = Object.keys(changes);
      } else {
        const current = await tx.copilotUsageRule.findUnique({ where: { actionKey: body.actionKey } });
        if (!current) throw new ApiError("Copilot usage rule not found.", 404);
        if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
          throw new ApiError("Copilot usage rule changed; reload before saving.", 409);
        }

        const {
          type: _type,
          actionKey,
          expectedUpdatedAt: _expectedUpdatedAt,
          reason: _reason,
          ...changes
        } = body;
        const changed = await tx.copilotUsageRule.updateMany({
          where: { actionKey, updatedAt: current.updatedAt },
          data: changes,
        });
        if (changed.count !== 1) {
          throw new ApiError("Copilot usage rule changed; reload before saving.", 409);
        }
        updated = await tx.copilotUsageRule.findUniqueOrThrow({ where: { actionKey } });
        entity = "USAGE_RULE";
        resource = `CopilotUsageRule:${actionKey}`;
        changedFields = Object.keys(changes);
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "COPILOT_COMMERCE_CONFIGURATION_UPDATED",
          resource,
          ipAddress: getClientIp(req) || "unknown",
          details: JSON.stringify({
            entity,
            fields: changedFields,
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return { entity, updated };
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return handleApiError(error);
  }
}
