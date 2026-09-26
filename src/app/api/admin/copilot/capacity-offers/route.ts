import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  copilotCapacityOfferCreateSchema,
  copilotCapacityOfferPatchSchema,
} from "@/lib/copilot/contracts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "admin_copilot_capacity_offers_read", 60, 60_000);
    await requireAdminSession(req);
    const offers = await prisma.copilotCapacityOffer.findMany({
      include: { regionalPrices: { orderBy: { regionCode: "asc" } } },
      orderBy: { capacityUnits: "asc" },
    });
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "admin_copilot_capacity_offers_write", 20, 60_000);
    const session = await requireAdminSession(req);
    const body = await readValidatedJson(req, copilotCapacityOfferCreateSchema);

    for (const price of body.prices) {
      if (price.paymentRoute === "MERCHANT_OF_RECORD") {
        throw new ApiError("Merchant-of-record offers cannot be activated until an approved provider adapter is connected.", 409);
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
          paymentRoute: price.paymentRoute,
          isActive: price.isActive,
        })),
      });
      return tx.copilotCapacityOffer.findUniqueOrThrow({
        where: { id: created.id },
        include: { regionalPrices: true },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "COPILOT_CAPACITY_OFFER_CREATED",
        resource: `CopilotCapacityOffer:${offer.id}`,
        details: JSON.stringify({ code: offer.code, priceRegions: offer.regionalPrices.map((price) => price.regionCode) }),
      },
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await enforceRateLimit(req, "admin_copilot_capacity_offers_write", 20, 60_000);
    const session = await requireAdminSession(req);
    const body = await readValidatedJson(req, copilotCapacityOfferPatchSchema);

    const result = await prisma.$transaction(async (tx) => {
      if (body.type === "OFFER") {
        const current = await tx.copilotCapacityOffer.findUnique({ where: { id: body.offerId } });
        if (!current) throw new ApiError("Copilot capacity offer not found.", 404);
        const { type: _type, offerId, ...changes } = body;
        return {
          entity: "OFFER",
          updated: await tx.copilotCapacityOffer.update({ where: { id: offerId }, data: changes }),
        };
      }

      const current = await tx.copilotCapacityOfferPrice.findUnique({ where: { id: body.priceId } });
      if (!current) throw new ApiError("Copilot capacity price not found.", 404);
      if (body.paymentRoute === "MERCHANT_OF_RECORD") {
        throw new ApiError("Merchant-of-record offers cannot be activated until an approved provider adapter is connected.", 409);
      }
      const { type: _type, priceId, ...changes } = body;
      return {
        entity: "PRICE",
        updated: await tx.copilotCapacityOfferPrice.update({ where: { id: priceId }, data: changes }),
      };
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "COPILOT_CAPACITY_OFFER_UPDATED",
        resource: `CopilotCapacityOffer:${result.entity}`,
        details: JSON.stringify({ entity: result.entity }),
      },
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return handleApiError(error);
  }
}
