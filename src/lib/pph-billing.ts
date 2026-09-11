import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError } from "./apiSecurity";

export const PPH_RULE = "DAY_25";
export const joiningSchema = z.object({
  applicationId: z.string().min(1).max(128),
  agreementId: z.string().min(1).max(128),
  annualCtc: z.number().finite().positive().max(1_000_000_000),
  joinedAt: z.string().datetime({ offset: true }),
  termsAccepted: z.literal(true),
}).strict();

export function invoiceEligibility(joinedAt: Date, now = new Date()) {
  if (!Number.isFinite(joinedAt.getTime()) || joinedAt > now) {
    throw new ApiError("Joining must be a valid confirmed date, not in the future.", 422);
  }
  return new Date(joinedAt.getTime() + 25 * 86_400_000);
}

export function placementAmounts(annualCtc: number, terms: {
  feeType: string; feeValue: number; taxRatePct: number; discountPercentage: number;
}) {
  if (!Number.isFinite(annualCtc) || annualCtc <= 0 || annualCtc > 1_000_000_000 ||
      !["PERCENTAGE", "FIXED"].includes(terms.feeType) ||
      !Number.isFinite(terms.feeValue) || terms.feeValue < 0 || terms.feeValue > 1_000_000_000 ||
      (terms.feeType === "PERCENTAGE" && terms.feeValue > 100) ||
      [terms.taxRatePct, terms.discountPercentage].some(n => !Number.isFinite(n) || n < 0 || n > 100)) {
    throw new ApiError("Invalid approved commercial terms.", 422);
  }
  const gross = terms.feeType === "PERCENTAGE"
    ? new Prisma.Decimal(annualCtc).mul(terms.feeValue).div(100)
    : new Prisma.Decimal(terms.feeValue);
  const amount = gross.mul(new Prisma.Decimal(100).minus(terms.discountPercentage)).div(100).toDecimalPlaces(2);
  const taxAmount = amount.mul(terms.taxRatePct).div(100).toDecimalPlaces(2);
  return { amount, taxAmount, totalAmount: amount.plus(taxAmount) };
}

export type BillingActor = { id: string; role: string; companyId?: string };
export function authorizeBilling(actor: BillingActor, companyId: string) {
  if (actor.role !== "ADMIN" && (actor.role !== "EMPLOYER" || actor.companyId !== companyId)) {
    throw new ApiError("Only the owning employer or HireGo administrator can approve placement billing.", 403);
  }
}

export async function confirmPphJoining(input: z.infer<typeof joiningSchema>, actor: BillingActor, now = new Date()) {
  const body = joiningSchema.parse(input);
  const joinedAt = new Date(body.joinedAt);
  const eligibleAt = invoiceEligibility(joinedAt, now);
  const annualCtc = new Prisma.Decimal(body.annualCtc).toDecimalPlaces(2);
  const requestHash = createHash("sha256").update(JSON.stringify({ applicationId: body.applicationId,
    agreementId: body.agreementId, annualCtc: annualCtc.toFixed(2), joinedAt: joinedAt.toISOString() })).digest("hex");

  return prisma.$transaction(async tx => {
    // Serialize confirmations for the application, independently of client retry keys.
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${body.applicationId} FOR UPDATE`;
    const app = await tx.application.findUnique({ where: { id: body.applicationId },
      include: { job: { include: { company: true } }, candidateProfile: { include: { user: true } } } });
    if (!app) throw new ApiError("Application not found.", 404);
    authorizeBilling(actor, app.job.companyId);
    const existing = await tx.pphPlacement.findUnique({ where: { applicationId: app.id } });
    if (existing) {
      if (existing.requestHash !== requestHash) throw new ApiError("Joining already recorded with different terms. Contact HireGo for reconciliation.", 409);
      return { duplicate: true, placement: existing };
    }
    if (app.status !== "SHORTLISTED") throw new ApiError("Only a shortlisted application can enter this joining flow. Existing hires require billing reconciliation.", 409);
    await tx.$queryRaw`SELECT id FROM "CommercialAgreement" WHERE id = ${body.agreementId} FOR SHARE`;
    const agreement = await tx.commercialAgreement.findUnique({ where: { id: body.agreementId } });
    if (!agreement || agreement.companyId !== app.job.companyId) throw new ApiError("Agreement does not belong to this company.", 403);
    if (agreement.status !== "ACTIVE" || !agreement.signedAt || agreement.invoiceRule !== PPH_RULE) {
      throw new ApiError("A signed active agreement with the DAY_25 invoice rule is required. Existing agreements must be amended and accepted first.", 409);
    }
    if (joinedAt < agreement.validityStartDate || joinedAt > agreement.validityEndDate || agreement.signedAt > now) {
      throw new ApiError("Joining is outside the accepted agreement validity period.", 422);
    }
    if (!Number.isInteger(agreement.creditDays) || agreement.creditDays < 0 || agreement.creditDays > 365 || agreement.advancePaymentAmount !== 0) {
      throw new ApiError("Invalid payment period or advance payment requires manual reconciliation before scheduling.", 409);
    }
    const amounts = placementAmounts(annualCtc.toNumber(), agreement);
    const placement = await tx.pphPlacement.create({ data: {
      applicationId: app.id, agreementId: agreement.id, companyId: app.job.companyId,
      joinedAt, invoiceEligibleAt: eligibleAt, annualCtc, ...amounts,
      creditDays: agreement.creditDays, approvedBy: actor.id, approvedRole: actor.role, requestHash,
      termsSnapshot: { version: 1, invoiceRule: PPH_RULE, agreementNumber: agreement.agreementNumber,
        agreementUpdatedAt: agreement.updatedAt.toISOString(), signedAt: agreement.signedAt.toISOString(),
        feeType: agreement.feeType, feeValue: agreement.feeValue, taxRatePct: agreement.taxRatePct,
        discountPercentage: agreement.discountPercentage, replacementDays: agreement.replacementDays,
        customClauses: agreement.customClauses, commercialNotes: agreement.commercialNotes,
        companyName: app.job.company.name, candidateName: app.candidateProfile.user.name, jobTitle: app.job.title },
    } });
    await tx.application.update({ where: { id: app.id }, data: { annualCtc: annualCtc.toNumber(), status: "HIRED" } });
    await tx.agreementEvent.create({ data: { agreementId: agreement.id, eventType: "PPH_JOINING_APPROVED",
      performedBy: actor.id, notes: `Placement ${placement.id}; approved role ${actor.role}; invoice eligible ${eligibleAt.toISOString()}` } });
    return { duplicate: false, placement };
  }, { maxWait: 5000, timeout: 10000 });
}

export class PphBillingWorker {
  static async run(limit = 20, stopAt = Date.now() + 20_000, now = new Date()) {
    const report = { invoiced: 0, held: 0 };
    for (let n = 0; n < Math.min(limit, 20) && Date.now() < stopAt; n++) {
      const result = await prisma.$transaction(async tx => {
        const rows = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "PphPlacement" WHERE status = 'SCHEDULED' AND "invoiceEligibleAt" <= ${now}
          ORDER BY "invoiceEligibleAt", id LIMIT 1 FOR UPDATE SKIP LOCKED`;
        if (!rows[0]) return "empty";
        // Hold agreement/application state stable until the invoice commits.
        await tx.$queryRaw`SELECT a.id FROM "CommercialAgreement" a JOIN "PphPlacement" p ON p."agreementId" = a.id WHERE p.id = ${rows[0].id} FOR SHARE OF a`;
        await tx.$queryRaw`SELECT a.id FROM "Application" a JOIN "PphPlacement" p ON p."applicationId" = a.id WHERE p.id = ${rows[0].id} FOR SHARE OF a`;
        const placement = await tx.pphPlacement.findUniqueOrThrow({ where: { id: rows[0].id }, include: { agreement: true, application: true } });
        if (placement.invoiceId || placement.status !== "SCHEDULED" || placement.invoiceEligibleAt > now) return "empty";
        if (placement.agreement.status !== "ACTIVE" || placement.application.status !== "HIRED" ||
            placement.agreement.companyId !== placement.companyId) {
          await tx.pphPlacement.update({ where: { id: placement.id }, data: { status: "HOLD", holdReason: "Agreement or hiring status requires reconciliation." } });
          return "held";
        }
        const snapshot = z.object({ companyName: z.string(), candidateName: z.string().nullable(), jobTitle: z.string() }).parse(placement.termsSnapshot);
        const invoice = await tx.invoice.create({ data: {
          id: randomUUID(), invoiceNumber: `PPH-${placement.id}`, agreementId: placement.agreementId,
          ...snapshot, amount: placement.amount.toNumber(), taxAmount: placement.taxAmount.toNumber(), totalAmount: placement.totalAmount.toNumber(),
          currency: placement.currency, status: "UNPAID",
          dueDate: new Date(now.getTime() + placement.creditDays * 86_400_000).toISOString().slice(0, 10),
          notes: `PPH placement ${placement.id}; joining ${placement.joinedAt.toISOString()}; DAY_25 eligible ${placement.invoiceEligibleAt.toISOString()}`,
        } });
        await tx.pphPlacement.update({ where: { id: placement.id }, data: { status: "INVOICED", invoiceId: invoice.id } });
        await tx.agreementEvent.create({ data: { agreementId: placement.agreementId, performedBy: "SYSTEM_PPH_BILLING",
          eventType: "PPH_INVOICE_CREATED", notes: `Placement ${placement.id}; invoice ${invoice.invoiceNumber}` } });
        return "invoiced";
      }, { maxWait: 2000, timeout: 5000 });
      if (result === "empty") break;
      report[result]++;
    }
    return report;
  }
}
