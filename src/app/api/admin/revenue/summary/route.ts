import { NextResponse } from "next/server";

export async function GET() {
  const summary = {
    mrr: 6240000,
    mrrFormatted: "₹62.4 Lakhs",
    arr: 74880000,
    arrFormatted: "₹7.49 Cr",
    totalRevenue: 34850000,
    totalRevenueFormatted: "₹3.48 Cr",
    currentMonthRevenue: 6240000,
    previousMonthRevenue: 5760000,
    growthPct: "+8.33%",
    netRevenue: 5865600,
    grossRevenue: 6240000,
    pendingRevenue: 349990,
    refundedRevenue: 64998,
    failedPayments: 49999,
    taxesCollected: 951864, // GST 18%
    platformFees: 124800,  // 2% Gateway & Infrastructure fee
    netProfit: 4788936,
    streams: {
      subscriptions: {
        total: 3840000,
        formatted: "₹38.4L",
        share: "61.5%",
        activeAccounts: 84,
        growth: "+12.4%",
      },
      managedHiring: {
        total: 1560000,
        formatted: "₹15.6L",
        share: "25.0%",
        activeHires: 52,
        growth: "+18.2%",
        label: "HireGo Managed Hiring™",
      },
      pph: {
        total: 1560000,
        formatted: "₹15.6L",
        share: "25.0%",
        activeHires: 52,
        growth: "+18.2%",
        label: "HireGo Managed Hiring™",
      },
      mockInterviews: {
        total: 520000,
        formatted: "₹5.2L",
        share: "8.3%",
        activeSessions: 1840,
        growth: "+34.5%",
      },
      jobBoost: {
        total: 320000,
        formatted: "₹3.2L",
        share: "5.2%",
        activeAds: 128,
        growth: "+8.1%",
      },
    },
  };

  return NextResponse.json({ success: true, data: summary });
}
