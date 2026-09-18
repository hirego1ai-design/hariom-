import type { Prisma } from "@prisma/client";

/** Called inside one transaction: serialize cleanup against fulfillment/retries. */
export async function failCheckoutOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const claimed = await tx.paymentOrder.updateMany({
    // Only an unsettled checkout may be failed. Replays against FAILED or
    // REJECTED orders must not refresh timestamps or repeat cleanup effects;
    // a captured SUCCESS is immutable here.
    where: { orderId, status: { in: ["INITIATED", "CREATED"] } },
    data: { status: "FAILED" },
  });
  if (claimed.count !== 1) return;
  const order = await tx.paymentOrder.findUnique({ where: { orderId } });
  if (!order || order.promoReservationState !== "RESERVED" || !order.promoCode) return;
  const promos = await tx.$queryRaw<Array<{ id: string; reservedUsage: number }>>`
    SELECT "id", "reservedUsage" FROM "PromoCode" WHERE "code" = ${order.promoCode} FOR UPDATE
  `;
  const promo = promos[0];
  if (promo && promo.reservedUsage > 0) {
    await tx.promoCode.update({ where: { id: promo.id }, data: { reservedUsage: { decrement: 1 } } });
  }
  await tx.paymentOrder.update({ where: { orderId }, data: { promoReservationState: "RELEASED" } });
}
