import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { prisma } from "../lib/prisma";
import { authorizeBilling, confirmPphJoining, invoiceEligibility, joiningSchema, placementAmounts, PphBillingWorker } from "../lib/pph-billing";

const joined = new Date("2026-08-01T04:30:00Z");
const eligible = new Date("2026-08-26T04:30:00Z");
const actor = { id: "employer", role: "EMPLOYER", companyId: "company" };
const input = { applicationId: "app", agreementId: "agreement", annualCtc: 1200000, joinedAt: joined.toISOString(), termsAccepted: true as const };

// In-memory transactional double. No live database, provider or invoice writes.
function fixture(t: TestContext) {
  const agreement = { id: "agreement", companyId: "company", status: "ACTIVE", signedAt: new Date("2026-07-01"),
    invoiceRule: "DAY_25", validityStartDate: new Date("2026-07-01"), validityEndDate: new Date("2027-07-01"),
    creditDays: 15, advancePaymentAmount: 0, feeType: "PERCENTAGE", feeValue: 8.33, taxRatePct: 18,
    discountPercentage: 0, replacementDays: 90, customClauses: [], commercialNotes: null,
    agreementNumber: "TEST", updatedAt: new Date("2026-07-01") };
  let app = { id: "app", status: "SHORTLISTED", job: { companyId: "company", title: "Engineer", company: { name: "Test company" } }, candidateProfile: { user: { name: "Test candidate" } } };
  let placements: any[] = [];
  let invoices: any[] = [];
  let failUpdate = false;
  let queue = Promise.resolve();
  const original = prisma.$transaction;
  (prisma as any).$transaction = (run: any) => {
    const result = queue.then(async () => {
      const oldPlacements = placements.map(p => ({ ...p })); const oldInvoices = [...invoices]; const oldApp = { ...app };
      const tx = {
        $queryRaw: async (strings: TemplateStringsArray, ...values: any[]) => {
          if (!strings.join("").includes('FROM "PphPlacement"')) return [{ id: "app" }];
          assert.match(strings.join(""), /FOR UPDATE SKIP LOCKED/);
          return placements.filter(p => p.status === "SCHEDULED" && p.invoiceEligibleAt <= values[0]).slice(0, 1).map(p => ({ id: p.id }));
        },
        application: { findUnique: async () => app, update: async ({ data }: any) => { app = { ...app, ...data }; return app; } },
        commercialAgreement: { findUnique: async () => agreement },
        pphPlacement: {
          findUnique: async () => placements[0] || null,
          create: async ({ data }: any) => { const p = { id: "test-placement", status: "SCHEDULED", currency: "INR", invoiceId: null, ...data }; placements.push(p); return p; },
          findUniqueOrThrow: async () => ({ ...placements[0], agreement, application: app }),
          update: async ({ data }: any) => { if (failUpdate) throw new Error("simulated persistence failure"); placements[0] = { ...placements[0], ...data }; return placements[0]; },
        },
        invoice: { create: async ({ data }: any) => { invoices.push(data); return data; } },
        agreementEvent: { create: async () => ({}) },
      };
      try { return await run(tx); } catch (error) { placements = oldPlacements; invoices = oldInvoices; app = oldApp; throw error; }
    });
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
  t.after(() => { prisma.$transaction = original; });
  return { agreement, get placements() { return placements; }, get invoices() { return invoices; },
    failUpdate(value: boolean) { failUpdate = value; } };
}

test("eligibility is exactly 25 full days including timezone and month boundary", () => {
  assert.equal(invoiceEligibility(joined, eligible).toISOString(), eligible.toISOString());
  assert.equal(invoiceEligibility(new Date("2026-12-20T10:00:00+05:30"), new Date("2027-02-01")).toISOString(), "2027-01-14T04:30:00.000Z");
  assert.throws(() => invoiceEligibility(new Date("invalid")), /valid/);
  assert.throws(() => invoiceEligibility(eligible, joined), /future/);
});

test("joining requires explicit acceptance and rejects caller-set fees or missing salary", () => {
  assert.equal(joiningSchema.safeParse({ ...input, termsAccepted: false }).success, false);
  assert.equal(joiningSchema.safeParse({ ...input, feeValue: 0 }).success, false);
  assert.equal(joiningSchema.safeParse({ ...input, annualCtc: 0 }).success, false);
});

test("billing approval supports owning employer or HireGo admin, not candidates or foreign employers", () => {
  authorizeBilling(actor, "company"); authorizeBilling({ id: "admin", role: "ADMIN" }, "company");
  for (const role of ["CANDIDATE", "RECRUITER", "EMPLOYER"]) assert.throws(() => authorizeBilling({ id: "other", role, companyId: "foreign" }, "company"), /Only/);
});

test("fees use decimal rounding, contractual discounts and taxes", () => {
  const amounts = placementAmounts(1200000, { feeType: "PERCENTAGE", feeValue: 8.33, discountPercentage: 10, taxRatePct: 18 });
  assert.equal(amounts.amount.toFixed(2), "89964.00"); assert.equal(amounts.totalAmount.toFixed(2), "106157.52");
  assert.throws(() => placementAmounts(1, { feeType: "HYBRID", feeValue: 1, discountPercentage: 0, taxRatePct: 0 }), /Invalid/);
});

test("joining snapshots approved terms without creating an invoice; concurrent replay is unique", async t => {
  const f = fixture(t);
  const results = await Promise.all([confirmPphJoining(input, actor, joined), confirmPphJoining(input, actor, joined)]);
  assert.equal(f.placements.length, 1); assert.equal(f.invoices.length, 0); assert.equal(results[1].duplicate, true);
  assert.equal(f.placements[0].approvedBy, "employer");
  await assert.rejects(confirmPphJoining({ ...input, annualCtc: 2000000 }, actor, joined), /different terms/);
});

test("unsigned, non-DAY_25 and foreign agreements cannot schedule billing", async t => {
  const f = fixture(t);
  f.agreement.invoiceRule = "ON_JOINING";
  await assert.rejects(confirmPphJoining(input, actor, joined), /DAY_25/);
  f.agreement.invoiceRule = "DAY_25"; f.agreement.companyId = "foreign";
  await assert.rejects(confirmPphJoining(input, actor, joined), /belong/);
  f.agreement.companyId = "company"; f.agreement.signedAt = null as unknown as Date;
  await assert.rejects(confirmPphJoining(input, actor, joined), /signed active/);
  assert.equal(f.placements.length, 0);
});

test("worker never bills early and bills once at the boundary despite concurrent ticks", async t => {
  const f = fixture(t); await confirmPphJoining(input, actor, joined);
  await PphBillingWorker.run(20, Date.now() + 10000, new Date(eligible.getTime() - 1)); assert.equal(f.invoices.length, 0);
  await Promise.all([PphBillingWorker.run(20, Date.now() + 10000, eligible), PphBillingWorker.run(20, Date.now() + 10000, eligible)]);
  assert.equal(f.invoices.length, 1); assert.equal(f.placements[0].status, "INVOICED");
  assert.equal(f.invoices[0].dueDate, "2026-09-10");
});

test("worker uses immutable accepted amounts and catches up after downtime", async t => {
  const f = fixture(t); await confirmPphJoining(input, actor, joined);
  f.agreement.feeValue = 90;
  await PphBillingWorker.run(20, Date.now() + 10000, new Date("2026-09-01T04:30:00Z"));
  assert.equal(f.invoices[0].amount, 99960); assert.equal(f.invoices[0].dueDate, "2026-09-16");
});

test("held/cancelled placements do not bill and inactive agreement creates a hold", async t => {
  const f = fixture(t); await confirmPphJoining(input, actor, joined);
  f.placements[0].status = "HOLD"; await PphBillingWorker.run(20, Date.now() + 10000, eligible); assert.equal(f.invoices.length, 0);
  f.placements[0].status = "CANCELLED"; await PphBillingWorker.run(20, Date.now() + 10000, eligible); assert.equal(f.invoices.length, 0);
  f.placements[0].status = "SCHEDULED"; f.agreement.status = "CANCELLED";
  assert.equal((await PphBillingWorker.run(20, Date.now() + 10000, eligible)).held, 1);
  assert.equal(f.placements[0].status, "HOLD"); assert.equal(f.invoices.length, 0);
});

test("invoice and completion rollback together on crash and retry issues exactly once", async t => {
  const f = fixture(t); await confirmPphJoining(input, actor, joined); f.failUpdate(true);
  await assert.rejects(PphBillingWorker.run(20, Date.now() + 10000, eligible), /persistence/);
  assert.equal(f.invoices.length, 0); assert.equal(f.placements[0].status, "SCHEDULED");
  f.failUpdate(false); await PphBillingWorker.run(20, Date.now() + 10000, eligible); assert.equal(f.invoices.length, 1);
});
