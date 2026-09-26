import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, ApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { copilotAdminPatchSchema } from "@/lib/copilot/contracts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "admin_copilot_commerce_read", 60, 60_000);
    await requireAdminSession(req);

    const [plans, rules] = await Promise.all([
      prisma.copilotPlan.findMany({
        include: { regionalPrices: { orderBy: [{ regionCode: "asc" }] } },
        orderBy: { monthlyCapacityUnits: "asc" },
      }),
      prisma.copilotUsageRule.findMany({ orderBy: { actionKey: "asc" } }),
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
    await enforceRateLimit(req, "admin_copilot_commerce_write", 20, 60_000);
    const session = await requireAdminSession(req);
    const body = await readValidatedJson(req, copilotAdminPatchSchema);

    const result = await prisma.$transaction(async (tx) => {
      if (body.type === "PLAN") {
        const current = await tx.copilotPlan.findUnique({ where: { id: body.planId } });
        if (!current) throw new ApiError("Copilot plan not found.", 404);

        const soft = body.softWarningPct ?? current.softWarningPct;
        const hard = body.hardWarningPct ?? current.hardWarningPct;
        if (soft >= hard) throw new ApiError("Soft warning threshold must remain below hard warning threshold.", 422);

        const { type: _type, planId, ...changes } = body;
        const updated = await tx.copilotPlan.update({ where: { id: planId }, data: changes });
        return { entity: "PLAN", updated };
      }

      if (body.type === "PRICE") {
        const current = await tx.copilotRegionalPrice.findUnique({ where: { id: body.priceId } });
        if (!current) throw new ApiError("Copilot regional price not found.", 404);

        const { type: _type, priceId, ...changes } = body;
        const updated = await tx.copilotRegionalPrice.update({ where: { id: priceId }, data: changes });
        return { entity: "PRICE", updated };
      }

      const current = await tx.copilotUsageRule.findUnique({ where: { actionKey: body.actionKey } });
      if (!current) throw new ApiError("Copilot usage rule not found.", 404);
      const { type: _type, actionKey, ...changes } = body;
      const updated = await tx.copilotUsageRule.update({ where: { actionKey }, data: changes });
      return { entity: "USAGE_RULE", updated };
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        companyId: null,
        action: "COPILOT_COMMERCE_CONFIGURATION_UPDATED",
        resource: `CopilotCommerce:${result.entity}`,
        details: JSON.stringify({
          entity: result.entity,
          // Deliberately record which keys changed without copying values that
          // could later contain provider-sensitive configuration.
          fields: Object.keys(body).filter((key) => !["type", "planId", "priceId", "actionKey"].includes(key)),
        }),
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return handleApiError(error);
  }
}
