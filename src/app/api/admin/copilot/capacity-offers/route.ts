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
import { assertCurrentCopilotTaxPolicy } from "@/lib/copilot/taxPolicy";
import {
  copilotCapacityOfferCreateSchema,
  copilotCapacityOfferPatchSchema,
} from "@/lib/copilot/contracts";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_copilot_capacity_offers_read:${admin.id}`, 60, 60_000);

    const offers = await prisma.copilotCapacityOffer.findMany({
      include: {
        regionalPrices: {
          orderBy: [{ regionCode: "asc" }, { id: "asc" }],
          take: 250,
        },
      },
      orderBy: [{ capacityUnits: "asc" }, { id: "asc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_copilot_capacity_offers_write:${session.id}`, 20, 60_000);
    const body = await readValidatedJson(req, copilotCapacityOfferCreateSchema);

    for (const price of body.prices) {
      try {
        assertCurrentCopilotTaxPolicy({
          regionCode: price.regionCode,
          countries: price.countries,
          taxMode: price.taxMode,
          taxRateBps: price.taxRateBps ?? 0,
        });
      } catch (error) {
        throw new ApiError(error instanceof Error ? error.message : "Invalid Copilot tax policy.", 422);
      }
    }

    const offer = await prisma.$transaction(async (tx) => {
      const created = await tx.copilotCapacityOffer.create({
        data: {
          code: body.code,
          name: body.name,
          description: body.description,
          capacityUnits: body.capacityUnits,
        },
      });

      await tx.copilotCapacityOfferPrice.createMany({
        data: body.prices.map((price) => ({
          offerId: created.id,
          regionCode: price.regionCode,
          countries: price.countries,
          currency: price.currency,
          amountMinor: price.amountMinor,
          taxMode: price.taxMode,
          taxRateBps: price.taxRateBps ?? 0,
          paymentRoute: price.paymentRoute,
          isActive: price.isActive,
        })),
      });

      const complete = await tx.copilotCapacityOffer.findUniqueOrThrow({
        where: { id: created.id },
        include: { regionalPrices: true },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "COPILOT_CAPACITY_OFFER_CREATED",
          resource: `CopilotCapacityOffer:${complete.id}`,
          ipAddress: getClientIp(req) || "unknown",
          details: JSON.stringify({
            code: complete.code,
            priceRegions: complete.regionalPrices.map((price) => price.regionCode),
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return complete;
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_copilot_capacity_offers_write:${session.id}`, 20, 60_000);
    const body = await readValidatedJson(req, copilotCapacityOfferPatchSchema);

    const result = await prisma.$transaction(async (tx) => {
      let entity: "OFFER" | "PRICE";
      let resource: string;
      let changedFields: string[] = [];
      let updated: unknown;

      if (body.type === "OFFER") {
        const current = await tx.copilotCapacityOffer.findUnique({ where: { id: body.offerId } });
        if (!current) throw new ApiError("Copilot capacity offer not found.", 404);
        if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
          throw new ApiError("Copilot capacity offer changed; reload before saving.", 409);
        }

        const {
          type: _type,
          offerId,
          expectedUpdatedAt: _expectedUpdatedAt,
          reason: _reason,
          ...changes
        } = body;
        const changed = await tx.copilotCapacityOffer.updateMany({
          where: { id: offerId, updatedAt: current.updatedAt },
          data: changes,
        });
        if (changed.count !== 1) {
          throw new ApiError("Copilot capacity offer changed; reload before saving.", 409);
        }
        updated = await tx.copilotCapacityOffer.findUniqueOrThrow({ where: { id: offerId } });
        entity = "OFFER";
        resource = `CopilotCapacityOffer:${offerId}`;
        changedFields = Object.keys(changes);
      } else {
        const current = await tx.copilotCapacityOfferPrice.findUnique({ where: { id: body.priceId } });
        if (!current) throw new ApiError("Copilot capacity price not found.", 404);
        if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
          throw new ApiError("Copilot capacity price changed; reload before saving.", 409);
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
        const changed = await tx.copilotCapacityOfferPrice.updateMany({
          where: { id: priceId, updatedAt: current.updatedAt },
          data: changes,
        });
        if (changed.count !== 1) {
          throw new ApiError("Copilot capacity price changed; reload before saving.", 409);
        }
        updated = await tx.copilotCapacityOfferPrice.findUniqueOrThrow({ where: { id: priceId } });
        entity = "PRICE";
        resource = `CopilotCapacityOfferPrice:${priceId}`;
        changedFields = Object.keys(changes);
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "COPILOT_CAPACITY_OFFER_UPDATED",
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
