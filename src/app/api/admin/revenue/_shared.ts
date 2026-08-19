import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const allowRevenueFixtures =
  process.env.NODE_ENV !== "production" && process.env.MOCK_DB === "true";

export function revenueUnavailable(error: unknown, resource: string) {
  const detail = error instanceof Error ? error.message : "Database query failed";
  return NextResponse.json(
    {
      success: false,
      error: `${resource} is unavailable because persisted revenue data could not be loaded.`,
      code: "REVENUE_DATA_UNAVAILABLE",
      ...(process.env.NODE_ENV !== "production" ? { detail } : {}),
    },
    { status: 503 },
  );
}

export function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function loadRevenueTransactions() {
  const [payments, invoices] = await Promise.all([
    prisma.paymentTransaction.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const companyIds = [...new Set(payments.map((payment) => payment.companyId))];
  const companies = companyIds.length
    ? await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true, location: true },
      })
    : [];
  const companyById = new Map(companies.map((company) => [company.id, company]));

  const paymentRows = payments.map((payment) => {
    const payload = asObject(payment.rawPayload);
    const company = companyById.get(payment.companyId);
    const statusMap: Record<string, string> = {
      SUCCESS: "Success",
      PAID: "Success",
      PENDING: "Pending",
      FAILED: "Failed",
      REJECTED: "Failed",
      REFUNDED: "Refunded",
      CANCELLED: "Cancelled",
    };
    const status = statusMap[payment.status.toUpperCase()] || payment.status;
    const createdDate = payment.createdAt.toISOString();
    return {
      id: payment.gatewayTxId || payment.id,
      invoiceNo: textValue(payload.invoiceNo),
      customerName: textValue(payload.customerName, company?.name || payment.companyId),
      customerType: textValue(payload.customerType, "Employer"),
      company: company?.name || payment.companyId,
      email: textValue(payload.email),
      mobile: textValue(payload.mobile),
      revenueSource: textValue(payload.revenueSource, payment.planId ? "Subscription" : "Manual"),
      planPurchased: textValue(payload.planName, payment.planId || ""),
      amount: payment.amount,
      amountFormatted: formatMoney(payment.amount, payment.currency),
      tax: Number(payload.tax || 0),
      discount: Number(payload.discount || 0),
      couponUsed: textValue(payload.couponCode),
      gateway: payment.provider,
      paymentMethod: textValue(payload.paymentMethod, payment.provider),
      currency: payment.currency,
      status,
      createdDate,
      paidDate: status === "Success" ? payment.updatedAt.toISOString() : "",
      updatedDate: payment.updatedAt.toISOString(),
      country: textValue(payload.country),
      state: textValue(payload.state),
      city: textValue(payload.city, company?.location || ""),
      adminNotes: payment.errorMessage || textValue(payload.notes),
      timeline: [],
      persisted: true,
      recordType: "payment" as const,
    };
  });

  const invoiceRows = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNo: invoice.invoiceNumber,
    customerName: invoice.candidateName || invoice.companyName,
    customerType: "Employer",
    company: invoice.companyName,
    email: "",
    mobile: "",
    revenueSource: invoice.candidateName ? "Managed Hiring" : "Manual",
    planPurchased: invoice.jobTitle || "",
    amount: invoice.totalAmount,
    amountFormatted: formatMoney(invoice.totalAmount, invoice.currency),
    tax: invoice.taxAmount,
    discount: 0,
    couponUsed: "",
    gateway: "",
    paymentMethod: "",
    currency: invoice.currency,
    status: invoice.status === "PAID" ? "Success" : invoice.status === "OVERDUE" ? "Failed" : "Pending",
    createdDate: invoice.createdAt.toISOString(),
    paidDate: invoice.paidDate || "",
    updatedDate: invoice.updatedAt.toISOString(),
    country: "",
    state: "",
    city: "",
    adminNotes: invoice.notes || "",
    timeline: [],
    persisted: true,
    recordType: "invoice" as const,
  }));

  return [...paymentRows, ...invoiceRows].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
  );
}

export async function loadManagedHiringRevenue() {
  const invoices = await prisma.invoice.findMany({
    where: { candidateName: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  const agreementIds = [...new Set(invoices.map((invoice) => invoice.agreementId))];
  const agreements = agreementIds.length
    ? await prisma.commercialAgreement.findMany({ where: { id: { in: agreementIds } } })
    : [];
  const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  const placements = invoices.map((invoice) => {
    const agreement = agreementById.get(invoice.agreementId);
    return {
      id: invoice.id,
      candidateName: invoice.candidateName || "",
      candidateEmail: "",
      employerCompany: invoice.companyName,
      employerContact: agreement?.clientEmail || "",
      recruiterPartner: "",
      jobTitle: invoice.jobTitle || "",
      jobRoleLevel: "",
      annualSalary: 0,
      salaryFormatted: "",
      commissionPct: agreement?.feeType === "PERCENTAGE" ? agreement.feeValue : 0,
      commissionAmount: invoice.amount,
      commissionFormatted: formatMoney(invoice.amount, invoice.currency),
      hiringFee: invoice.totalAmount,
      replacementWarrantyDays: agreement?.replacementDays || 0,
      joiningDate: invoice.createdAt.toISOString(),
      paymentStatus: invoice.status === "PAID" ? "Success" : invoice.status,
      invoiceId: invoice.invoiceNumber,
      offerLetterRef: "",
      persisted: true,
    };
  });
  const paid = invoices.filter((invoice) => invoice.status === "PAID");
  const totalCommissionEarned = paid.reduce((sum, invoice) => sum + invoice.amount, 0);
  const hiringFeesCollected = paid.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  return {
    summary: {
      totalHires: invoices.length,
      successfulHires: paid.length,
      pendingHires: invoices.filter((invoice) => invoice.status === "UNPAID").length,
      cancelledOrReplaced: 0,
      totalCommissionEarned,
      totalCommissionFormatted: formatMoney(totalCommissionEarned),
      hiringFeesCollected,
      replacementWarrantyCost: 0,
      netProfit: totalCommissionEarned,
      netProfitFormatted: formatMoney(totalCommissionEarned),
      averageHireSalary: "Unavailable",
      averageCommissionPerHire: formatMoney(paid.length ? totalCommissionEarned / paid.length : 0),
    },
    placements,
    agreements,
  };
}
