import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function revenueUnavailable(error: unknown, resource: string) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    Number.isInteger((error as { status?: unknown }).status)
  ) {
    const status = Number((error as { status: number }).status);
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ success: false, error: message }, { status });
  }

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

export function revenueSourceForPayment(productType: string) {
  switch (productType.trim().toUpperCase()) {
    case "LEGACY_SUBSCRIPTION":
    case "SUBSCRIPTION":
      return "Subscription";
    case "COPILOT":
      return "Copilot";
    case "COPILOT_ADDON":
      return "Copilot Add Capacity";
    default:
      return "Other Payment";
  }
}

export async function loadRevenueTransactions() {
  const [payments, invoices] = await Promise.all([
    prisma.paymentTransaction.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({
      include: { placement: true },
      orderBy: { createdAt: "desc" },
    }),
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
      revenueSource: revenueSourceForPayment(payment.productType),
      productType: payment.productType,
      planPurchased: payment.planId || "",
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
    status: invoice.status === "PAID" ? "Success" : invoice.status === "OVERDUE" ? "Overdue" : "Pending",
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
    include: { placement: true },
    orderBy: { createdAt: "desc" },
  });
  const agreementIds = [...new Set(invoices.map((invoice) => invoice.agreementId))];
  const agreements = agreementIds.length
    ? await prisma.commercialAgreement.findMany({ where: { id: { in: agreementIds } } })
    : [];
  const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  const placements = invoices.map((invoice) => {
    const agreement = agreementById.get(invoice.agreementId);
    const annualSalary = invoice.placement?.annualCtc ? Number(invoice.placement.annualCtc) : null;
    return {
      id: invoice.id,
      candidateName: invoice.candidateName || "",
      candidateEmail: null,
      employerCompany: invoice.companyName,
      employerContact: agreement?.clientEmail || null,
      recruiterPartner: null,
      jobTitle: invoice.jobTitle || "",
      jobRoleLevel: null,
      annualSalary,
      salaryFormatted: annualSalary === null ? null : formatMoney(annualSalary, invoice.currency),
      commissionPct: agreement?.feeType === "PERCENTAGE" ? agreement.feeValue : null,
      commissionAmount: invoice.amount,
      commissionFormatted: formatMoney(invoice.amount, invoice.currency),
      hiringFee: invoice.totalAmount,
      replacementWarrantyDays: agreement?.replacementDays ?? null,
      joiningDate: invoice.placement?.joinedAt?.toISOString() || null,
      paymentStatus: invoice.status === "PAID" ? "Success" : invoice.status === "OVERDUE" ? "Overdue" : "Pending",
      invoiceId: invoice.invoiceNumber,
      offerLetterRef: null,
      persisted: true,
    };
  });

  const paid = invoices.filter((invoice) => invoice.status === "PAID");
  const currencies = [...new Set(invoices.map((invoice) => invoice.currency))].sort();
  const byCurrency = Object.fromEntries(
    currencies.map((currency) => {
      const currencyInvoices = invoices.filter((invoice) => invoice.currency === currency);
      const paidCurrencyInvoices = currencyInvoices.filter((invoice) => invoice.status === "PAID");
      const placementsWithSalary = paidCurrencyInvoices.filter((invoice) => invoice.placement?.annualCtc);
      const commissionCollected = paidCurrencyInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const billedCollected = paidCurrencyInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const averageSalary = placementsWithSalary.length
        ? placementsWithSalary.reduce((sum, invoice) => sum + Number(invoice.placement!.annualCtc), 0) / placementsWithSalary.length
        : null;
      const averageCommission = paidCurrencyInvoices.length
        ? commissionCollected / paidCurrencyInvoices.length
        : null;

      return [
        currency,
        {
          currency,
          invoicedPlacements: currencyInvoices.length,
          paidPlacements: paidCurrencyInvoices.length,
          pendingInvoices: currencyInvoices.filter((invoice) => invoice.status === "UNPAID" || invoice.status === "PENDING_VERIFICATION").length,
          overdueInvoices: currencyInvoices.filter((invoice) => invoice.status === "OVERDUE").length,
          commissionCollected,
          commissionCollectedFormatted: formatMoney(commissionCollected, currency),
          billedCollected,
          billedCollectedFormatted: formatMoney(billedCollected, currency),
          averageHireSalary: averageSalary === null ? null : formatMoney(averageSalary, currency),
          averageCommissionPerPaidPlacement: averageCommission === null ? null : formatMoney(averageCommission, currency),
        },
      ];
    }),
  );

  return {
    summary: {
      currencyMode: currencies.length <= 1 ? "single" : "multiple",
      currencies,
      invoicedPlacements: invoices.length,
      paidPlacements: paid.length,
      pendingInvoices: invoices.filter((invoice) => invoice.status === "UNPAID" || invoice.status === "PENDING_VERIFICATION").length,
      overdueInvoices: invoices.filter((invoice) => invoice.status === "OVERDUE").length,
      cancelledOrReplaced: null,
      replacementWarrantyCost: null,
      netProfit: null,
      byCurrency,
    },
    placements,
    agreements,
  };
}
