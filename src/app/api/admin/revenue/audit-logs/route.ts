import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";

export interface RevenueAuditLogRecord {
  id: string;
  time: string;
  adminName: string;
  adminEmail: string;
  action:
    | "Payment Created"
    | "Invoice Generated"
    | "Refund Initiated"
    | "Refund Approved"
    | "Subscription Activated"
    | "Subscription Cancelled"
    | "Plan Upgraded"
    | "Plan Downgraded"
    | "Manual Payment Added"
    | "Revenue Edited";
  targetResource: string;
  previousValue: string;
  updatedValue: string;
  ipAddress: string;
  browser: string;
  device: string;
  location: string;
}

export const auditLogs: RevenueAuditLogRecord[] = [
  {
    id: "AUD-9901",
    time: "2026-08-01 15:42:10",
    adminName: "Super Admin (Finance)",
    adminEmail: "finance.admin@hirego.ai",
    action: "Refund Approved",
    targetResource: "INV-2026-0809 (Vanguard Systems)",
    previousValue: "Status: Refund Pending (₹14,999)",
    updatedValue: "Status: Refunded via Stripe",
    ipAddress: "157.48.12.90",
    browser: "Chrome 127.0.0",
    device: "macOS Ventura Desktop",
    location: "Bengaluru, India",
  },
  {
    id: "AUD-9902",
    time: "2026-07-28 10:14:02",
    adminName: "RaAz (Lead Admin)",
    adminEmail: "admin@hirego.ai",
    action: "Subscription Activated",
    targetResource: "INV-2026-0801 (GlobalTech Solutions)",
    previousValue: "Status: Awaiting RTGS Transfer Verification",
    updatedValue: "Status: Active (24 Enterprise ATS Seats Unlocked)",
    ipAddress: "103.21.144.1",
    browser: "Chrome 128.0.0",
    device: "Windows 11 PC",
    location: "Mumbai, India",
  },
  {
    id: "AUD-9903",
    time: "2026-07-25 18:22:15",
    adminName: "System Automated Engine",
    adminEmail: "cron.billing@hirego.ai",
    action: "Invoice Generated",
    targetResource: "INV-2026-0803 (Nova AI Labs)",
    previousValue: "Draft Cycle",
    updatedValue: "Tax Invoice INV-2026-0803 Generated (₹49,999)",
    ipAddress: "127.0.0.1",
    browser: "Node-Fetch Backend Agent",
    device: "AWS Mumbai ap-south-1 Node",
    location: "Mumbai, India",
  },
  {
    id: "AUD-9904",
    time: "2026-07-22 14:05:44",
    adminName: "Finance Officer",
    adminEmail: "accounts@hirego.ai",
    action: "Plan Upgraded",
    targetResource: "Apex Cybernetics India",
    previousValue: "Growth Plan (₹49,999/mo)",
    updatedValue: "HireGo Managed Hiring™ Partnership (15% Senior / 8.33% Mid)",
    ipAddress: "49.207.210.12",
    browser: "Firefox 129.0",
    device: "Ubuntu Linux Desktop",
    location: "Hyderabad, India",
  },
  {
    id: "AUD-9905",
    time: "2026-07-18 11:30:19",
    adminName: "Super Admin (Finance)",
    adminEmail: "finance.admin@hirego.ai",
    action: "Manual Payment Added",
    targetResource: "Neural Nexus AI (TXN-882910)",
    previousValue: "Unallocated Wire Transfer ₹3,50,000",
    updatedValue: "Allocated to Dedicated LLM Fine-Tuning Service",
    ipAddress: "157.48.12.90",
    browser: "Chrome 127.0.0",
    device: "macOS Ventura Desktop",
    location: "Bengaluru, India",
  },
];

export async function GET(req: NextRequest) {
  requireAdminSession(req);
  return NextResponse.json({
    success: true,
    total: auditLogs.length,
    data: auditLogs,
  });
}
