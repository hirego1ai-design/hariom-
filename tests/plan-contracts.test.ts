import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { checkoutSchema, createPlanSchema, updatePlanSchema } from "../lib/payments/planContracts";
import { subscriptionCredits } from "../lib/payments/subscriptionCredits";
import { prisma } from "../lib/prisma";
import { subscriptionsDb } from "../lib/subscriptions-db";

const plan = {
  name: "Contract test", description: "Not a live plan", price: 100, currency: "INR",
  jobPostsQuota: 0, resumeUnlocksQuota: 0, aiInterviewsQuota: 0,
  applicationsQuota: 0, resumeDownloadsQuota: 0, backgroundVerificationsQuota: 0,
  featuresAllowed: ["JOB_POSTING"], validityMonths: 1,
};

test("checkout accepts existing legacy and new UUID plan identifiers", () => {
  for (const planId of ["plan-1789100000000", "plan-monthly-pro", randomUUID()]) {
    assert.equal(checkoutSchema.parse({ planId }).planId, planId);
  }
});

test("checkout rejects malformed IDs and client supplied commercial amounts", () => {
  for (const planId of ["", " ", "../plan", "plan?price=0", "a".repeat(129)]) {
    assert.equal(checkoutSchema.safeParse({ planId }).success, false);
  }
  assert.equal(checkoutSchema.safeParse({ planId: randomUUID(), price: 1 }).success, false);
});

test("zero quota remains zero through validated plan and credit provisioning", () => {
  const parsed = createPlanSchema.parse(plan);
  assert.ok(Object.values(subscriptionCredits(parsed)).every(value => value === 0));
});

test("plan validation rejects invalid prices, quotas, validity and unknown mutable fields", () => {
  for (const change of [
    { price: -1 }, { price: Infinity }, { jobPostsQuota: -1 }, { aiInterviewsQuota: 1.5 },
    { validityMonths: 0 }, { resumeDownloadsQuota: 2147483648 }, { currency: "inr" },
    { price: "100" }, { createdAt: "2026-01-01" }, { featuresAllowed: ["bad feature"] },
  ]) assert.equal(createPlanSchema.safeParse({ ...plan, ...change }).success, false);
});

test("updates whitelist commercial fields without accepting model metadata", () => {
  assert.deepEqual(updatePlanSchema.parse({ id: "plan-existing", applicationsQuota: 0 }),
    { id: "plan-existing", applicationsQuota: 0 });
  assert.equal(updatePlanSchema.safeParse({ id: "plan-existing" }).success, false);
  assert.equal(updatePlanSchema.safeParse({ id: "plan-existing", createdAt: "2026-01-01" }).success, false);
});

test("admin-created plans persist zero quotas and produce checkout-compatible unique IDs without a database", async t => {
  const captured: Array<Record<string, unknown>> = [];
  const delegate = prisma.subscriptionPlan;
  const original = delegate.create;
  delegate.create = (async (args: { data: Record<string, unknown> }) => {
    captured.push(args.data);
    return args.data;
  }) as unknown as typeof delegate.create;
  t.after(() => { delegate.create = original; });
  const first = await subscriptionsDb.createSubscriptionPlan(createPlanSchema.parse(plan));
  const second = await subscriptionsDb.createSubscriptionPlan(createPlanSchema.parse(plan));
  assert.notEqual(first.id, second.id);
  assert.equal(checkoutSchema.parse({ planId: first.id }).planId, first.id);
  assert.equal(captured.length, 2);
  for (const row of captured) {
    for (const field of ["applicationsQuota", "resumeDownloadsQuota", "backgroundVerificationsQuota"]) {
      assert.equal(row[field], 0);
    }
  }
});
