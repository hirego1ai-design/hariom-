import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { formatMoney, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_revenue_subscriptions:${admin.id}`, 60, 60_000);

    const [plans, subscriptionCounts, payments] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          subscriptions: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 50,
            include: {
              company: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.companySubscription.groupBy({
        by: ["planId", "status"],
        _count: { _all: true },
      }),
      prisma.paymentTransaction.findMany({
        where: {
          productType: { in: ["LEGACY_SUBSCRIPTION", "SUBSCRIPTION"] },
          planId: { not: null },
          status: { in: ["SUCCESS", "PAID"] },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
      const revenueByCurrency = Object.fromEntries(
        [...new Set(planPayments.map((payment) => payment.currency))].sort().map((currency) => {
          const total = planPayments
            .filter((payment) => payment.currency === currency)
            .reduce((sum, payment) => sum + payment.amount, 0);
          return [currency, { total, formatted: formatMoney(total, currency) }];
        }),
      );
      const statusCounts = subscriptionCounts.filter((row) => row.planId === plan.id);
      const countFor = (status: string) =>
        statusCounts
          .filter((row) => row.status === status)
          .reduce((sum, row) => sum + row._count._all, 0);
      const active = countFor("ACTIVE");
      const expired = countFor("EXPIRED");
      const cancelled = countFor("CANCELLED");
      const totalSubscribers = statusCounts.reduce((sum, row) => sum + row._count._all, 0);

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        priceFormatted: formatMoney(plan.price, plan.currency),
        currency: plan.currency,
        validityMonths: plan.validityMonths,
        isArchived: plan.isArchived,
        totalSubscribers,
        customerPreviewLimit: 50,
        active,
        expired,
        cancelled,
        revenueByCurrency,
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

    const currencies = [...new Set(payments.map((payment) => payment.currency))].sort();
    const byCurrency = Object.fromEntries(
      currencies.map((currency) => {
        const currencyPayments = payments.filter((payment) => payment.currency === currency);
        const totalRevenue = currencyPayments.reduce((sum, payment) => sum + payment.amount, 0);
        return [
          currency,
          {
            currency,
            totalRevenue,
            totalRevenueFormatted: formatMoney(totalRevenue, currency),
            paymentCount: currencyPayments.length,
          },
        ];
      }),
    );

    return NextResponse.json({
      success: true,
      source: "database",
      totalPlans: data.length,
      summary: {
        currencyMode: currencies.length <= 1 ? "single" : "multiple",
        currencies,
        byCurrency,
        totalSubscriptions: data.reduce((sum, plan) => sum + plan.totalSubscribers, 0),
        activeSubscriptions: data.reduce((sum, plan) => sum + plan.active, 0),
      },
      data,
    });
  } catch (error) {
    return revenueUnavailable(error, "Subscription revenue");
  }
}
