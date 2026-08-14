import { NextResponse } from "next/server";

export interface HireGoManagedHiringRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  employerCompany: string;
  employerContact: string;
  recruiterPartner: string;
  jobTitle: string;
  jobRoleLevel: "Senior / Leadership" | "Mid-Level" | "Entry-Level";
  annualSalary: number;
  salaryFormatted: string;
  commissionPct: number;
  commissionAmount: number;
  commissionFormatted: string;
  hiringFee: number;
  replacementWarrantyDays: number;
  joiningDate: string;
  paymentStatus: "Success" | "Pending Escrow" | "Under Replacement" | "Defaulted";
  invoiceId: string;
  offerLetterRef: string;
}

// Backward-compatible alias
export type PPHRecord = HireGoManagedHiringRecord;

export const managedHiringSummary = {
  totalHires: 52,
  successfulHires: 48,
  pendingHires: 3,
  cancelledOrReplaced: 1,
  totalCommissionEarned: 1560000,
  totalCommissionFormatted: "₹15.6 Lakhs",
  hiringFeesCollected: 1680000,
  replacementWarrantyCost: 120000,
  netProfit: 1440000,
  netProfitFormatted: "₹14.4 Lakhs",
  averageHireSalary: "₹14.2 LPA",
  averageCommissionPerHire: "₹30,000",
};

export const pphSummary = managedHiringSummary;

export const managedHiringPlacementLogs: HireGoManagedHiringRecord[] = [
  {
    id: "PPH-1091",
    candidateName: "Priya Patel",
    candidateEmail: "priya.p@tech.io",
    employerCompany: "Apex Cybernetics India",
    employerContact: "aditi.rao@apexcyber.ai",
    recruiterPartner: "HireGo AI Direct Match Engine",
    jobTitle: "Lead AI Systems Architect",
    jobRoleLevel: "Senior / Leadership",
    annualSalary: 1600000,
    salaryFormatted: "₹16.0 LPA",
    commissionPct: 15.0,
    commissionAmount: 240000,
    commissionFormatted: "₹2,40,000",
    hiringFee: 240000,
    replacementWarrantyDays: 90,
    joiningDate: "2026-07-15",
    paymentStatus: "Success",
    invoiceId: "INV-2026-0802",
    offerLetterRef: "OFFER-APX-8821.pdf",
  },
  {
    id: "PPH-1092",
    candidateName: "Siddharth Verma",
    candidateEmail: "siddharth.v@gmail.com",
    employerCompany: "Zenith Cloud Corp",
    employerContact: "rohan@zenithcloud.net",
    recruiterPartner: "TopTier Headhunters",
    jobTitle: "Senior DevOps & Kubernetes Engineer",
    jobRoleLevel: "Senior / Leadership",
    annualSalary: 1800000,
    salaryFormatted: "₹18.0 LPA",
    commissionPct: 10.0,
    commissionAmount: 180000,
    commissionFormatted: "₹1,80,000",
    hiringFee: 180000,
    replacementWarrantyDays: 90,
    joiningDate: "2026-07-22",
    paymentStatus: "Success",
    invoiceId: "INV-2026-0814",
    offerLetterRef: "OFFER-ZEN-9921.pdf",
  },
  {
    id: "PPH-1093",
    candidateName: "Ananya Iyer",
    candidateEmail: "ananya.iyer@outlook.com",
    employerCompany: "FinFlow Technologies",
    employerContact: "meera.k@finflow.io",
    recruiterPartner: "HireGo AI Direct Match Engine",
    jobTitle: "Fullstack React & Node Developer",
    jobRoleLevel: "Mid-Level",
    annualSalary: 1200000,
    salaryFormatted: "₹12.0 LPA",
    commissionPct: 8.33,
    commissionAmount: 99960,
    commissionFormatted: "₹99,960",
    hiringFee: 100000,
    replacementWarrantyDays: 60,
    joiningDate: "2026-07-28",
    paymentStatus: "Pending Escrow",
    invoiceId: "INV-2026-0820",
    offerLetterRef: "OFFER-FIN-4402.pdf",
  },
  {
    id: "PPH-1094",
    candidateName: "Rahul Deshmukh",
    candidateEmail: "rahul.d@yahoo.com",
    employerCompany: "HyperScale Analytics",
    employerContact: "kunal@hyperscale.ai",
    recruiterPartner: "HireGo Sourcing Agent",
    jobTitle: "Data Scientist (NLP / LLM)",
    jobRoleLevel: "Mid-Level",
    annualSalary: 1500000,
    salaryFormatted: "₹15.0 LPA",
    commissionPct: 8.33,
    commissionAmount: 124950,
    commissionFormatted: "₹1,24,950",
    hiringFee: 125000,
    replacementWarrantyDays: 60,
    joiningDate: "2026-08-05",
    paymentStatus: "Success",
    invoiceId: "INV-2026-0824",
    offerLetterRef: "OFFER-HPS-5511.pdf",
  },
];

export const pphHireLogs = managedHiringPlacementLogs;
export const managedHiringLogs = managedHiringPlacementLogs;

export async function GET() {
  return NextResponse.json({
    success: true,
    summary: managedHiringSummary,
    data: managedHiringPlacementLogs,
  });
}
