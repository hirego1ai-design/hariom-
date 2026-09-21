import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { formatMoney, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_revenue_subscriptions", 60, 60_000);

    const [plans, payments] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            include: {
              company: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.paymentTransaction.findMany({
        where: {
          planId: { not: null },
          status: { in: ["SUCCESS", "PAID"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          planId: true,
          amount: true,
          currency: true,
          provider: true,
          createdAt: true,
        },
      }),
    ]);

    const paymentsByPlan = new Map<string, typeof payments>();
    for (const payment of payments) {
      if (!payment.planId) continue;
      const bucket = paymentsByPlan.get(payment.planId) || [];
      bucket.push(payment);
      paymentsByPlan.set(payment.planId, bucket);
    }

    const data = plans.map((plan) => {
      const planPayments = paymentsByPlan.get(plan.id) || [];
      const revenueCollected = planPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const active = plan.subscriptions.filter((subscription) => subscription.status === "ACTIVE").length;
      const expired = plan.subscriptions.filter((subscription) => subscription.status === "EXPIRED").length;
      const cancelled = plan.subscriptions.filter((subscription) => subscription.status === "CANCELLED").length;

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        priceFormatted: formatMoney(plan.price, plan.currency),
        currency: plan.currency,
        validityMonths: plan.validityMonths,
        isArchived: plan.isArchived,
        totalSubscribers: plan.subscriptions.length,
        active,
        expired,
        cancelled,
        revenueCollected,
        revenueCollectedFormatted: formatMoney(revenueCollected, plan.currency),
        paymentCount: planPayments.length,
        customers: plan.subscriptions.map((subscription) => ({
          id: subscription.id,
          companyId: subscription.company.id,
          company: subscription.company.name,
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate.toISOString(),
          status: subscription.status,
        })),
      };
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return NextResponse.json({
      success: true,
      source: "database",
      totalPlans: data.length,
      summary: {
        totalRevenue,
        totalRevenueFormatted: formatMoney(totalRevenue),
        totalSubscriptions: data.reduce((sum, plan) => sum + plan.totalSubscribers, 0),
        activeSubscriptions: data.reduce((sum, plan) => sum + plan.active, 0),
      },
      data,
    });
  } catch (error) {
    return revenueUnavailable(error, "Subscription revenue");
  }
}
