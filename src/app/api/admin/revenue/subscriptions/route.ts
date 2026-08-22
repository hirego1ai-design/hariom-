import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";

export interface SubscriptionPlanSummary {
  id: string;
  name: string;
  priceFormatted: string;
  cadence: "Monthly" | "Annual";
  totalSubscribers: number;
  active: number;
  expired: number;
  cancelled: number;
  monthlyRevenue: string;
  annualRevenue: string;
  renewalRate: string;
  churnRate: string;
  arpu: string;
  mrr: string;
  arr: string;
  features: string[];
  customers: {
    id: string;
    company: string;
    owner: string;
    email: string;
    mobile: string;
    seats: number;
    renewalDate: string;
    amount: string;
    status: "Active" | "Past Due" | "Expiring Soon" | "Cancelled";
    paymentHistoryCount: number;
    lastPaymentDate: string;
  }[];
}

export const subscriptionPlans: SubscriptionPlanSummary[] = [
  {
    id: "plan-enterprise",
    name: "Enterprise Custom Plan",
    priceFormatted: "₹12,00,000 / year",
    cadence: "Annual",
    totalSubscribers: 26,
    active: 24,
    expired: 1,
    cancelled: 1,
    monthlyRevenue: "₹24.0 Lakhs",
    annualRevenue: "₹2.88 Cr",
    renewalRate: "95.8%",
    churnRate: "4.2%",
    arpu: "₹1,00,000/mo",
    mrr: "₹24,00,000",
    arr: "₹2,88,00,000",
    features: ["Unlimited Active JDs", "Custom Fine-tuned LLMs", "Dedicated Account Manager", "Unlimited ATS Seats", "99.99% Enterprise SLA"],
    customers: [
      { id: "CUST-E1", company: "GlobalTech Solutions", owner: "Sanjay Singhania", email: "sanjay.s@globaltech.com", mobile: "+91 98201 44510", seats: 24, renewalDate: "2027-07-20", amount: "₹12,00,000", status: "Active", paymentHistoryCount: 4, lastPaymentDate: "2026-07-20" },
      { id: "CUST-E2", company: "TCS Innovation Labs", owner: "Rajesh Ramaswamy", email: "rajesh.r@tcs-inno.com", mobile: "+91 98301 22910", seats: 50, renewalDate: "2027-04-10", amount: "₹18,00,000", status: "Active", paymentHistoryCount: 6, lastPaymentDate: "2026-04-10" },
      { id: "CUST-E3", company: "Infosys Cloud Units", owner: "Pooja Hegde", email: "pooja.h@infosys-cloud.com", mobile: "+91 98450 11984", seats: 35, renewalDate: "2026-08-30", amount: "₹15,00,000", status: "Expiring Soon", paymentHistoryCount: 3, lastPaymentDate: "2025-08-30" },
    ],
  },
  {
    id: "plan-growth",
    name: "Growth Plan",
    priceFormatted: "₹49,999 / month",
    cadence: "Monthly",
    totalSubscribers: 28,
    active: 23,
    expired: 3,
    cancelled: 2,
    monthlyRevenue: "₹11.5 Lakhs",
    annualRevenue: "₹1.38 Cr",
    renewalRate: "89.2%",
    churnRate: "7.1%",
    arpu: "₹49,999/mo",
    mrr: "₹11,49,977",
    arr: "₹1,37,99,724",
    features: ["20 Active JDs", "500 AI Screenings/mo", "5 Recruiter Seats", "Automated MCQ & Coding Tests"],
    customers: [
      { id: "CUST-G1", company: "Nova AI Labs", owner: "Vikram Malhotra", email: "vikram@novalabs.tech", mobile: "+91 97110 33819", seats: 5, renewalDate: "2026-08-15", amount: "₹49,999", status: "Active", paymentHistoryCount: 8, lastPaymentDate: "2026-07-15" },
      { id: "CUST-G2", company: "FinFlow Technologies", owner: "Meera Krishnan", email: "meera.k@finflow.io", mobile: "+91 98804 99011", seats: 5, renewalDate: "2026-08-14", amount: "₹49,999", status: "Past Due", paymentHistoryCount: 5, lastPaymentDate: "2026-06-14" },
      { id: "CUST-G3", company: "ScaleByte Systems", owner: "Amitav Roy", email: "amitav@scalebyte.com", mobile: "+91 97001 22819", seats: 5, renewalDate: "2026-08-28", amount: "₹49,999", status: "Active", paymentHistoryCount: 12, lastPaymentDate: "2026-07-28" },
    ],
  },
  {
    id: "plan-starter",
    name: "Starter Plan",
    priceFormatted: "₹14,999 / month",
    cadence: "Monthly",
    totalSubscribers: 44,
    active: 37,
    expired: 4,
    cancelled: 3,
    monthlyRevenue: "₹2.9 Lakhs",
    annualRevenue: "₹34.8 Lakhs",
    renewalRate: "84.1%",
    churnRate: "9.5%",
    arpu: "₹14,999/mo",
    mrr: "₹5,54,963",
    arr: "₹66,59,556",
    features: ["5 Active JDs", "50 AI Screenings/mo", "2 Recruiter Seats", "Standard Candidate Matching"],
    customers: [
      { id: "CUST-S1", company: "PixelPulse Media", owner: "Rhea Sen", email: "rhea@pixelpulse.co", mobile: "+91 98220 99401", seats: 2, renewalDate: "2026-08-10", amount: "₹14,999", status: "Active", paymentHistoryCount: 4, lastPaymentDate: "2026-07-10" },
      { id: "CUST-S2", company: "Vanguard Systems", owner: "Deepak Joshi", email: "deepak@vanguard.io", mobile: "+91 98102 66723", seats: 2, renewalDate: "2026-07-02", amount: "₹14,999", status: "Cancelled", paymentHistoryCount: 1, lastPaymentDate: "2026-07-02" },
    ],
  },
  {
    id: "plan-campus",
    name: "Campus Recruitment Accelerator",
    priceFormatted: "₹2,50,000 / drive",
    cadence: "Monthly",
    totalSubscribers: 12,
    active: 10,
    expired: 2,
    cancelled: 0,
    monthlyRevenue: "₹5.0 Lakhs",
    annualRevenue: "₹60.0 Lakhs",
    renewalRate: "91.0%",
    churnRate: "0.0%",
    arpu: "₹2,50,000",
    mrr: "₹5,00,000",
    arr: "₹60,00,000",
    features: ["Mass MCQ & Proctoring for 2,500+ Students", "Automated AI Shortlisting", "College Placement Portal Integration"],
    customers: [
      { id: "CUST-C1", company: "NIT Trichy Hiring Cell", owner: "Dr. K. Swaminathan", email: "placement@nitt.edu", mobile: "+91 94440 12890", seats: 15, renewalDate: "2026-09-01", amount: "₹2,50,000", status: "Active", paymentHistoryCount: 2, lastPaymentDate: "2026-07-01" },
    ],
  },
  {
    id: "plan-recruiter",
    name: "Independent Recruiter Pro",
    priceFormatted: "₹7,999 / month",
    cadence: "Monthly",
    totalSubscribers: 22,
    active: 18,
    expired: 2,
    cancelled: 2,
    monthlyRevenue: "₹1.4 Lakhs",
    annualRevenue: "₹16.8 Lakhs",
    renewalRate: "81.8%",
    churnRate: "12.0%",
    arpu: "₹7,999/mo",
    mrr: "₹1,43,982",
    arr: "₹17,27,784",
    features: ["Direct Talent Sourcing Pool", "WhatsApp Bot Outreach Credits", "Verified Candidate Phone Unlocks"],
    customers: [
      { id: "CUST-R1", company: "TopTier Headhunters", owner: "Karan Johar", email: "karan@toptierhr.in", mobile: "+91 98111 44556", seats: 1, renewalDate: "2026-08-19", amount: "₹7,999", status: "Active", paymentHistoryCount: 7, lastPaymentDate: "2026-07-19" },
    ],
  },
];

export async function GET(req: NextRequest) {
  requireAdminSession(req);
  return NextResponse.json({
    success: true,
    totalPlans: subscriptionPlans.length,
    data: subscriptionPlans,
  });
}
