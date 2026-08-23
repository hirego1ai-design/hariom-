import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export interface PPHPricingRule {
  method: "percentage_ctc" | "fixed_fee" | "hybrid_higher";
  percentageRates: {
    standard: number;   // e.g. 8.33% (1 month gross CTC)
    midTier: number;    // e.g. 6.33%
    volumeTier: number; // e.g. 4.33%
    custom: number;
  };
  fixedFeeAmount: number; // e.g. ₹1,50,000 per hire
  hybridRuleDescription: string;
}

export interface PPHInvoiceRule {
  triggerEvent: "immediate_joining" | "15_days" | "30_days" | "45_days" | "60_days" | "90_days" | "custom_days";
  customDays?: number;
  paymentTerms: "immediate" | "net_7" | "net_15" | "net_30" | "net_45" | "net_60" | "custom";
  autoGenerateGSTInvoice: boolean;
  gstRatePct: number;
}

export interface PPHReplacementPolicy {
  warrantyDays: number; // 0, 15, 30, 45, 60, 90, custom
  allowCreditNote: boolean;
  maxFreeReplacements: number;
  autoRefundIfUnfulfilledDays: number;
}

export interface PPHAdvancePaymentRule {
  advanceRequiredPct: number; // 0, 10, 20, 30, 40, 50, 100
  fixedAdvanceAmount: number;
  advanceDiscountTiers: {
    advancePct: number;
    discountPct: number;
  }[];
}

export interface PPHCreditPolicy {
  creditLimitINR: number;
  maxCreditDays: number;
  accountHoldOnOverdue: boolean;
  lateFeeAnnualPct: number;
}

export interface PPHVolumeTier {
  tierId: string;
  minHires: number;
  maxHires: number | null; // null for unlimited
  discountPct: number;
  tierName: string;
}

export interface PPHEmployerContractProfile {
  id: string;
  name: "Startup" | "SMB" | "Enterprise" | "Strategic" | "Custom";
  description: string;
  badgeColor: string;
  defaultPricingMethod: "percentage_ctc" | "fixed_fee" | "hybrid_higher";
  defaultPercentagePct: number;
  defaultFixedFee: number;
  invoiceMilestone: "immediate_joining" | "15_days" | "30_days" | "45_days" | "60_days" | "90_days";
  paymentTerms: "immediate" | "net_7" | "net_15" | "net_30" | "net_45" | "net_60";
  replacementDays: number;
  advancePct: number;
  creditLimitINR: number;
  approvalRequiredAboveDiscount: number;
}

export interface ManagedHiringAuditLog {
  id: string;
  timestamp: string;
  adminUser: string;
  adminRole: string;
  category: "Pricing" | "Invoice Milestone" | "Replacement" | "Credit Policy" | "Contract Profile" | "Approval Workflow";
  action: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

// In-Memory Global State for dynamic updates
export let managedHiringGlobalConfig = {
  frameworkName: "HireGo Managed Hiring™",
  version: "3.2.0",
  lastUpdated: new Date().toISOString(),
  pricing: {
    method: "percentage_ctc" as const,
    percentageRates: {
      standard: 8.33,
      midTier: 6.33,
      volumeTier: 4.33,
      custom: 10.0,
    },
    fixedFeeAmount: 150000,
    hybridRuleDescription: "Evaluates the HIGHER of Fixed Base Fee (₹1.5L) vs. Percentage of CTC (8.33%)",
    slab0to10L: 8.33,
    slab10to25L: 12.5,
    slab25to50L: 15.0,
    slab50LPlus: 18.0,
    minHiringFloor: 35000,
    executiveSurcharge: 3.0,
    volumeDiscounts: [
      { minHires: 5, discountPct: 1.0 },
      { minHires: 10, discountPct: 2.0 },
      { minHires: 25, discountPct: 3.5 },
    ],
    surgeMultiplier: 1.15,
    surgeActive: false,
  },
  agreements: {
    standardAgreementTitle: "HireGo Managed Hiring™ Master Services Agreement (MSA v3.2)",
    requireDigitalSignature: true,
    defaultSlaDays: 14,
    enableCustomAddendums: true,
    autoGenerateMSAOnJobPost: true,
    confidentialityPeriodYears: 3,
  },
  invoicing: {
    invoiceTrigger: "day1_joining" as const,
    paymentTermsDays: 30,
    statutoryGstPct: 18,
    latePaymentInterestPctPerMonth: 1.5,
    autoDunningReminders: true,
    advanceDepositRequired: true,
    defaultAdvanceDeposit: 25000,
  },
  warranty: {
    guaranteeWindowDays: 90,
    replacementSlaDays: 14,
    proRataCreditEnabled: true,
    arbitrationReviewDays: 5,
    maxReplacementsPerHire: 1,
  },
  creditsAndDeposits: {
    walletBonusTier1: { minDeposit: 200000, bonusPct: 5 },
    walletBonusTier2: { minDeposit: 500000, bonusPct: 10 },
    creditExpiryMonths: 12,
    allowPartialDrawdown: true,
  },
  approvals: {
    accountManagerMaxDiscount: 2.0,
    vpSalesMaxDiscount: 5.0,
    cfoApprovalRequiredAboveDiscount: 5.0,
    requireDualApprovalForCredits: true,
    logAllRuleOverrides: true,
  },
  invoiceRule: {
    triggerEvent: "30_days" as const,
    customDays: 30,
    paymentTerms: "net_30" as const,
    autoGenerateGSTInvoice: true,
    gstRatePct: 18.0,
  },
  replacement: {
    warrantyDays: 90,
    allowCreditNote: true,
    maxFreeReplacements: 1,
    autoRefundIfUnfulfilledDays: 45,
  },
  advance: {
    advanceRequiredPct: 20,
    fixedAdvanceAmount: 25000,
    advanceDiscountTiers: [
      { advancePct: 0, discountPct: 0 },
      { advancePct: 20, discountPct: 2.0 },
      { advancePct: 50, discountPct: 5.0 },
      { advancePct: 100, discountPct: 8.33 },
    ],
  },
  credit: {
    creditLimitINR: 1000000,
    maxCreditDays: 45,
    accountHoldOnOverdue: true,
    lateFeeAnnualPct: 18.0,
  },
  volumeTiers: [
    { tierId: "VT-1", minHires: 1, maxHires: 5, discountPct: 0, tierName: "Standard Tier (1–5 hires)" },
    { tierId: "VT-2", minHires: 6, maxHires: 15, discountPct: 5.0, tierName: "Growth Tier (6–15 hires)" },
    { tierId: "VT-3", minHires: 16, maxHires: 30, discountPct: 10.0, tierName: "Scale Tier (16–30 hires)" },
    { tierId: "VT-4", minHires: 31, maxHires: null, discountPct: 15.0, tierName: "Enterprise Tier (31+ hires)" },
  ],
  contractProfiles: [
    {
      id: "CP-STARTUP",
      name: "Startup" as const,
      description: "Seed & Series A startups. Zero advance required, flexible 30-day replacement warranty.",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      defaultPricingMethod: "percentage_ctc" as const,
      defaultPercentagePct: 8.33,
      defaultFixedFee: 100000,
      invoiceMilestone: "immediate_joining" as const,
      paymentTerms: "net_15" as const,
      replacementDays: 60,
      advancePct: 0,
      creditLimitINR: 300000,
      approvalRequiredAboveDiscount: 5.0,
    },
    {
      id: "CP-SMB",
      name: "SMB" as const,
      description: "Growing tech teams (50–200 employees). Standard 8.33% fee with 90-day warranty.",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      defaultPricingMethod: "percentage_ctc" as const,
      defaultPercentagePct: 8.33,
      defaultFixedFee: 150000,
      invoiceMilestone: "30_days" as const,
      paymentTerms: "net_30" as const,
      replacementDays: 90,
      advancePct: 20,
      creditLimitINR: 1000000,
      approvalRequiredAboveDiscount: 8.0,
    },
    {
      id: "CP-ENTERPRISE",
      name: "Enterprise" as const,
      description: "Established corporate clients. Tiered volume discounts, Net-45 billing, dedicated SLA.",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      defaultPricingMethod: "hybrid_higher" as const,
      defaultPercentagePct: 6.33,
      defaultFixedFee: 200000,
      invoiceMilestone: "45_days" as const,
      paymentTerms: "net_45" as const,
      replacementDays: 90,
      advancePct: 30,
      creditLimitINR: 5000000,
      approvalRequiredAboveDiscount: 12.0,
    },
    {
      id: "CP-STRATEGIC",
      name: "Strategic" as const,
      description: "High-volume campus & rapid R&D scale-ups. Custom hybrid rates with Net-60 credit facility.",
      badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      defaultPricingMethod: "percentage_ctc" as const,
      defaultPercentagePct: 4.33,
      defaultFixedFee: 250000,
      invoiceMilestone: "60_days" as const,
      paymentTerms: "net_60" as const,
      replacementDays: 90,
      advancePct: 50,
      creditLimitINR: 15000000,
      approvalRequiredAboveDiscount: 15.0,
    },
  ],
  approvalWorkflow: {
    tiers: [
      { step: 1, role: "Account Sales Executive", triggerCondition: "Standard terms up to 5% discount" },
      { step: 2, role: "Regional Sales Manager", triggerCondition: "Discounts between 5.1% and 10%" },
      { step: 3, role: "Head of Finance", triggerCondition: "Discounts > 10% or Credit Limit > ₹25L" },
      { step: 4, role: "Super Administrator / CPO", triggerCondition: "Non-standard warranties (>90d) or 0% Advance waivers" },
    ],
    autoEscalateHours: 24,
  },
};

export const managedHiringAuditLogs: ManagedHiringAuditLog[] = [
  {
    id: "LOG-MH-901",
    timestamp: "2026-08-01 14:32:10",
    adminUser: "superadmin@hirego.ai",
    adminRole: "Super Administrator",
    category: "Pricing",
    action: "Updated Standard Commission Rate",
    oldValue: "15.00%",
    newValue: "8.33% (1 Month CTC)",
    reason: "Aligned to national standard 1-month gross CTC placement model",
  },
  {
    id: "LOG-MH-902",
    timestamp: "2026-08-01 16:45:00",
    adminUser: "finance.director@hirego.ai",
    adminRole: "Head of Finance",
    category: "Credit Policy",
    action: "Enabled Automated Account Hold",
    oldValue: "false",
    newValue: "true",
    reason: "Mitigate non-payment risk beyond 45 days overdue",
  },
  {
    id: "LOG-MH-903",
    timestamp: "2026-08-02 09:15:22",
    adminUser: "superadmin@hirego.ai",
    adminRole: "Super Administrator",
    category: "Contract Profile",
    action: "Added Strategic Account Tier",
    oldValue: "N/A",
    newValue: "4.33% rate, ₹1.5 Cr credit limit, 90d warranty",
    reason: "Created bespoke profile for Fortune 500 campus hiring ramp",
  },
];

export async function GET(req: Request) {
  try {
    await requireAdminSession(req);
  return NextResponse.json({
    success: true,
    config: managedHiringGlobalConfig,
    auditLogs: managedHiringAuditLogs,
  });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession(req);
    const body = await req.json();
    const { updatedConfig, config, auditEntry, adminActor, reason } = body;

    const payloadConfig = updatedConfig || config;

    if (payloadConfig) {
      managedHiringGlobalConfig = {
        ...managedHiringGlobalConfig,
        ...payloadConfig,
        lastUpdated: new Date().toISOString(),
      };
    }

    const logEntry: ManagedHiringAuditLog = {
      id: `LOG-MH-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      adminUser: session.email,
      adminRole: "Administrator",
      category: auditEntry?.category || "Pricing",
      action: auditEntry?.action || "Commercial Configuration Update",
      oldValue: String(auditEntry?.oldValue || "Active Ruleset"),
      newValue: String(auditEntry?.newValue || "Updated Ruleset"),
      reason: auditEntry?.reason || reason || "Commercial rules deployed via Admin Console",
    };
    managedHiringAuditLogs.unshift(logEntry);

    return NextResponse.json({
      success: true,
      message: "HireGo Managed Hiring™ configuration saved and audit logged successfully.",
      config: managedHiringGlobalConfig,
      auditLogs: managedHiringAuditLogs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
