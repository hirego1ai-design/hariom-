import { NextResponse } from "next/server";

export const jobBoostSummary = {
  totalRevenue: 320000,
  totalRevenueFormatted: "₹3.2 Lakhs",
  totalAdsSold: 168,
  activeAds: 128,
  expiredAds: 40,
  averageCTR: "6.42%",
  totalAdImpressions: 485000,
  totalClicks: 31137,
  totalCandidateApplications: 4120,
  categories: [
    { type: "7-Day Featured Job", price: "₹15,000", sold: 80, revenue: "₹1,20,000", badge: "Featured Gold" },
    { type: "30-Day Urgent Hiring Boost", price: "₹25,000", sold: 50, revenue: "₹1,25,000", badge: "Urgent Hiring" },
    { type: "Top Search Sponsored Listing", price: "₹10,000", sold: 30, revenue: "₹30,000", badge: "Sponsored" },
    { type: "WhatsApp Candidate Push Campaign", price: "₹15,000", sold: 8, revenue: "₹45,000", badge: "Direct WA Blast" },
  ],
};

export const jobBoostLogs = [
  {
    id: "BOOST-901",
    company: "HyperScale Analytics",
    jobTitle: "Senior Principal Data Scientist",
    packageType: "7-Day Premium Multi-Channel Boost",
    duration: "7 Days",
    amount: 15000,
    amountFormatted: "₹15,000",
    views: 18450,
    clicks: 1420,
    applications: 215,
    ctr: "7.7%",
    status: "Active (3 Days Remaining)",
    startDate: "2026-07-28",
    endDate: "2026-08-04",
  },
  {
    id: "BOOST-902",
    company: "Apex Cybernetics",
    jobTitle: "Rust & C++ High Frequency Developer",
    packageType: "30-Day Urgent Hiring Boost",
    duration: "30 Days",
    amount: 25000,
    amountFormatted: "₹25,000",
    views: 42100,
    clicks: 2980,
    applications: 380,
    ctr: "7.07%",
    status: "Active (18 Days Remaining)",
    startDate: "2026-07-15",
    endDate: "2026-08-14",
  },
  {
    id: "BOOST-903",
    company: "GlobalTech Solutions",
    jobTitle: "Enterprise Java Solutions Architect",
    packageType: "Top Search Sponsored Listing",
    duration: "14 Days",
    amount: 10000,
    amountFormatted: "₹10,000",
    views: 12400,
    clicks: 650,
    applications: 94,
    ctr: "5.24%",
    status: "Expired",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    summary: jobBoostSummary,
    data: jobBoostLogs,
  });
}
