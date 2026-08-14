import { NextResponse, type NextRequest } from "next/server";

export interface FullTransactionRecord {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerType: "Employer" | "Candidate" | "Partner" | "Recruiter";
  company: string;
  email: string;
  mobile: string;
  revenueSource: "Subscription" | "Managed Hiring" | "Pay Per Hire" | "Mock Interview" | "Job Boost" | "API" | "Enterprise" | "Manual";
  planPurchased: string;
  amount: number;
  amountFormatted: string;
  tax: number;
  discount: number;
  couponUsed: string;
  gateway: "Razorpay" | "Stripe" | "PayPal" | "UPI" | "Bank Transfer";
  paymentMethod: string;
  currency: "INR" | "USD";
  status: "Success" | "Pending" | "Failed" | "Refunded" | "Partial Refund" | "Cancelled";
  createdDate: string;
  paidDate: string;
  updatedDate: string;
  country: string;
  state: string;
  city: string;
  adminNotes: string;
  timeline: {
    step: string;
    date: string;
    completed: boolean;
    description: string;
  }[];
}

export const sampleTransactions: FullTransactionRecord[] = [
  {
    id: "TXN-882901",
    invoiceNo: "INV-2026-0801",
    customerName: "Sanjay Singhania",
    customerType: "Employer",
    company: "GlobalTech Solutions Pvt Ltd",
    email: "sanjay.s@globaltech.com",
    mobile: "+91 98201 44510",
    revenueSource: "Subscription",
    planPurchased: "Enterprise Custom Plan (Annual)",
    amount: 1200000,
    amountFormatted: "₹12,00,000",
    tax: 216000,
    discount: 50000,
    couponUsed: "ENT-Q3-ACCELERATE",
    gateway: "Bank Transfer",
    paymentMethod: "RTGS / NEFT",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-20 10:15",
    paidDate: "2026-07-20 11:30",
    updatedDate: "2026-07-20 11:35",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    adminNotes: "VIP Enterprise contract renewal approved with 24 seats & dedicated LLM instance.",
    timeline: [
      { step: "Order Initiated", date: "2026-07-20 10:15", completed: true, description: "Enterprise renewal quote confirmed by procurement" },
      { step: "Invoice Generated", date: "2026-07-20 10:20", completed: true, description: "Tax invoice INV-2026-0801 generated with 18% GST" },
      { step: "Payment Received", date: "2026-07-20 11:30", completed: true, description: "NEFT funds credited via HDFC Bank Virtual Account" },
      { step: "Subscription Activated", date: "2026-07-20 11:35", completed: true, description: "License seats provisioned for 24 team members" },
      { step: "Renewal Scheduled", date: "2027-07-20", completed: false, description: "Annual automated renewal reminder set for T-30 days" },
    ],
  },
  {
    id: "TXN-882902",
    invoiceNo: "INV-2026-0802",
    customerName: "Aditi Rao",
    customerType: "Employer",
    company: "Apex Cybernetics India",
    email: "aditi.rao@apexcyber.ai",
    mobile: "+91 98402 11920",
    revenueSource: "Managed Hiring",
    planPurchased: "HireGo Managed Hiring™ Success Fee (15% CTC)",
    amount: 240000,
    amountFormatted: "₹2,40,000",
    tax: 43200,
    discount: 0,
    couponUsed: "None",
    gateway: "Stripe",
    paymentMethod: "Corporate Credit Card",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-18 14:22",
    paidDate: "2026-07-18 14:25",
    updatedDate: "2026-07-18 14:25",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    adminNotes: "Candidate Priya Patel joined on 2026-07-15. 90-day replacement warranty active.",
    timeline: [
      { step: "Offer Accepted", date: "2026-07-01", completed: true, description: "Candidate accepted offer of ₹16.0 LPA" },
      { step: "Candidate Joined", date: "2026-07-15", completed: true, description: "Verified onboarded by HR partner" },
      { step: "Invoice Dispatched", date: "2026-07-18 14:20", completed: true, description: "HireGo Managed Hiring™ 15% commission invoice generated" },
      { step: "Payment Settled", date: "2026-07-18 14:25", completed: true, description: "Stripe payout verified" },
    ],
  },
  {
    id: "TXN-882903",
    invoiceNo: "INV-2026-0803",
    customerName: "Vikram Malhotra",
    customerType: "Employer",
    company: "Nova AI Labs",
    email: "vikram@novalabs.tech",
    mobile: "+91 97110 33819",
    revenueSource: "Subscription",
    planPurchased: "Growth Monthly Plan",
    amount: 49999,
    amountFormatted: "₹49,999",
    tax: 8999,
    discount: 5000,
    couponUsed: "GROWTH-NEW",
    gateway: "Razorpay",
    paymentMethod: "UPI Auto-Debit",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-15 09:00",
    paidDate: "2026-07-15 09:02",
    updatedDate: "2026-07-15 09:02",
    country: "India",
    state: "Telangana",
    city: "Hyderabad",
    adminNotes: "Recurring auto-debit active on Mandate ID: RZP_MANDATE_9912.",
    timeline: [
      { step: "Invoice Generated", date: "2026-07-15 09:00", completed: true, description: "Monthly recurring cycle trigger" },
      { step: "UPI Mandate Executed", date: "2026-07-15 09:02", completed: true, description: "Auto-debited via UPI Autopay" },
      { step: "Quota Reset", date: "2026-07-15 09:03", completed: true, description: "20 JDs and 500 AI evaluations refreshed" },
    ],
  },
  {
    id: "TXN-882904",
    invoiceNo: "INV-2026-0804",
    customerName: "Aarav Sharma",
    customerType: "Candidate",
    company: "Individual Candidate",
    email: "aarav.sharma@example.com",
    mobile: "+91 99001 88312",
    revenueSource: "Mock Interview",
    planPurchased: "Mastery AI Interview Pack (5 Sessions)",
    amount: 1999,
    amountFormatted: "₹1,999",
    tax: 359,
    discount: 500,
    couponUsed: "STUDENT-PREP",
    gateway: "Razorpay",
    paymentMethod: "Google Pay (UPI)",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-14 16:40",
    paidDate: "2026-07-14 16:41",
    updatedDate: "2026-07-14 16:41",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    adminNotes: "5 Voice/Vision Mock Interview credits loaded into candidate wallet.",
    timeline: [
      { step: "Checkout Started", date: "2026-07-14 16:39", completed: true, description: "Selected AI Interview Mastery Pack" },
      { step: "Payment Confirmed", date: "2026-07-14 16:41", completed: true, description: "Razorpay UPI instant confirmation" },
      { step: "Tokens Credited", date: "2026-07-14 16:41", completed: true, description: "Credits unlocked on practice hub" },
    ],
  },
  {
    id: "TXN-882905",
    invoiceNo: "INV-2026-0805",
    customerName: "Meera Krishnan",
    customerType: "Employer",
    company: "FinFlow Technologies",
    email: "meera.k@finflow.io",
    mobile: "+91 98804 99011",
    revenueSource: "Subscription",
    planPurchased: "Growth Monthly Plan",
    amount: 49999,
    amountFormatted: "₹49,999",
    tax: 8999,
    discount: 0,
    couponUsed: "None",
    gateway: "Stripe",
    paymentMethod: "Credit Card (Visa)",
    currency: "INR",
    status: "Pending",
    createdDate: "2026-07-14 11:10",
    paidDate: "",
    updatedDate: "2026-07-14 12:00",
    country: "India",
    state: "Delhi NCR",
    city: "Gurugram",
    adminNotes: "Card authentication requires 3DS challenge. Customer notified via email.",
    timeline: [
      { step: "Invoice Created", date: "2026-07-14 11:10", completed: true, description: "Renewal invoice queued" },
      { step: "3DS Auth Pending", date: "2026-07-14 11:12", completed: true, description: "Bank requested OTP verification" },
      { step: "Payment Pending", date: "2026-07-14", completed: false, description: "Waiting for user action" },
    ],
  },
  {
    id: "TXN-882906",
    invoiceNo: "INV-2026-0806",
    customerName: "Rohan Varma",
    customerType: "Employer",
    company: "Zenith Cloud Corp",
    email: "rohan@zenithcloud.net",
    mobile: "+91 97720 11488",
    revenueSource: "Managed Hiring",
    planPurchased: "HireGo Managed Hiring™ Credit Top-Up (4 Hires)",
    amount: 100000,
    amountFormatted: "₹1,00,000",
    tax: 18000,
    discount: 10000,
    couponUsed: "ZENITH-CORP",
    gateway: "Razorpay",
    paymentMethod: "NetBanking (ICICI)",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-10 18:20",
    paidDate: "2026-07-10 18:24",
    updatedDate: "2026-07-10 18:24",
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    adminNotes: "Bulk hiring deposit reserved in escrow balance.",
    timeline: [
      { step: "Deposit Request", date: "2026-07-10 18:20", completed: true, description: "Escrow wallet load request" },
      { step: "NetBanking Verified", date: "2026-07-10 18:24", completed: true, description: "ICICI corporate banking success" },
    ],
  },
  {
    id: "TXN-882907",
    invoiceNo: "INV-2026-0807",
    customerName: "Kunal Shah",
    customerType: "Employer",
    company: "HyperScale Analytics",
    email: "kunal@hyperscale.ai",
    mobile: "+91 98450 77201",
    revenueSource: "Job Boost",
    planPurchased: "7-Day Premium Multi-Channel Boost",
    amount: 15000,
    amountFormatted: "₹15,000",
    tax: 2700,
    discount: 0,
    couponUsed: "None",
    gateway: "Stripe",
    paymentMethod: "Mastercard",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-08 15:10",
    paidDate: "2026-07-08 15:11",
    updatedDate: "2026-07-08 15:11",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    adminNotes: "Job #JOB-4818 boosted across top search results and candidate WhatsApp push.",
    timeline: [
      { step: "Boost Configured", date: "2026-07-08 15:10", completed: true, description: "Targeting 25,000 Python & Spark developers" },
      { step: "Payment Captured", date: "2026-07-08 15:11", completed: true, description: "Instant Stripe charge" },
      { step: "Campaign Active", date: "2026-07-08 15:12", completed: true, description: "Ad delivery live" },
    ],
  },
  {
    id: "TXN-882908",
    invoiceNo: "INV-2026-0808",
    customerName: "Priya Patel",
    customerType: "Candidate",
    company: "Individual Candidate",
    email: "priya.p@tech.io",
    mobile: "+91 99120 55430",
    revenueSource: "Mock Interview",
    planPurchased: "Single AI Technical Mock Interview",
    amount: 499,
    amountFormatted: "₹499",
    tax: 89,
    discount: 0,
    couponUsed: "None",
    gateway: "Razorpay",
    paymentMethod: "Paytm UPI",
    currency: "INR",
    status: "Success",
    createdDate: "2026-07-05 20:01",
    paidDate: "2026-07-05 20:02",
    updatedDate: "2026-07-05 20:02",
    country: "India",
    state: "Gujarat",
    city: "Ahmedabad",
    adminNotes: "Single AI System Design session completed. AI score: 98/100.",
    timeline: [
      { step: "Purchase", date: "2026-07-05 20:01", completed: true, description: "Instant purchase" },
      { step: "Session Completed", date: "2026-07-05 20:45", completed: true, description: "Scorecard generated" },
    ],
  },
  {
    id: "TXN-882909",
    invoiceNo: "INV-2026-0809",
    customerName: "Deepak Joshi",
    customerType: "Employer",
    company: "Vanguard Systems",
    email: "deepak@vanguard.io",
    mobile: "+91 98102 66723",
    revenueSource: "Subscription",
    planPurchased: "Starter Monthly Plan",
    amount: 14999,
    amountFormatted: "₹14,999",
    tax: 2699,
    discount: 0,
    couponUsed: "None",
    gateway: "Stripe",
    paymentMethod: "Credit Card",
    currency: "INR",
    status: "Refunded",
    createdDate: "2026-07-02 12:00",
    paidDate: "2026-07-02 12:02",
    updatedDate: "2026-07-04 10:15",
    country: "India",
    state: "Maharashtra",
    city: "Pune",
    adminNotes: "Customer requested plan cancellation within 48h money-back guarantee. Full refund issued.",
    timeline: [
      { step: "Subscription Started", date: "2026-07-02 12:00", completed: true, description: "Starter plan purchased" },
      { step: "Refund Requested", date: "2026-07-04 09:30", completed: true, description: "Ticket #TKT-4109 submitted" },
      { step: "Refund Processed", date: "2026-07-04 10:15", completed: true, description: "Stripe reversal of ₹14,999" },
    ],
  },
  {
    id: "TXN-882910",
    invoiceNo: "INV-2026-0810",
    customerName: "Kavya Nair",
    customerType: "Employer",
    company: "Neural Nexus AI",
    email: "kavya@neuralnexus.tech",
    mobile: "+91 99881 22345",
    revenueSource: "Enterprise",
    planPurchased: "Dedicated LLM Fine-Tuning Add-On",
    amount: 350000,
    amountFormatted: "₹3,50,000",
    tax: 63000,
    discount: 25000,
    couponUsed: "AI-EARLY-BIRD",
    gateway: "Bank Transfer",
    paymentMethod: "Wire Transfer",
    currency: "INR",
    status: "Success",
    createdDate: "2026-06-28 11:00",
    paidDate: "2026-06-29 14:00",
    updatedDate: "2026-06-29 14:00",
    country: "India",
    state: "Kerala",
    city: "Kochi",
    adminNotes: "Custom proprietary Llama-3 70B fine-tuning checkpoint deployed on dedicated GPU cluster.",
    timeline: [
      { step: "SOW Signed", date: "2026-06-28", completed: true, description: "Enterprise AI service add-on agreed" },
      { step: "Funds Received", date: "2026-06-29", completed: true, description: "Wire transfer verified by Accounts" },
    ],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.toLowerCase() || "";
  const source = searchParams.get("source") || "All";
  const status = searchParams.get("status") || "All";
  const gateway = searchParams.get("gateway") || "All";
  const customerType = searchParams.get("customerType") || "All";

  let filtered = sampleTransactions.filter((t) => {
    if (search) {
      const match =
        t.id.toLowerCase().includes(search) ||
        t.invoiceNo.toLowerCase().includes(search) ||
        t.customerName.toLowerCase().includes(search) ||
        t.company.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search) ||
        t.mobile.includes(search);
      if (!match) return false;
    }

    if (source !== "All") {
      if (source === "Managed Hiring" || source === "Pay Per Hire") {
        if (t.revenueSource !== "Managed Hiring" && t.revenueSource !== "Pay Per Hire") return false;
      } else if (t.revenueSource !== source) {
        return false;
      }
    }
    if (status !== "All" && t.status !== status) return false;
    if (gateway !== "All" && t.gateway !== gateway) return false;
    if (customerType !== "All" && t.customerType !== customerType) return false;

    return true;
  });

  return NextResponse.json({
    success: true,
    total: filtered.length,
    data: filtered,
  });
}
