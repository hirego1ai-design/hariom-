import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, type TestContext } from "node:test";
import { GET } from "../app/api/cron/referrals-reconciliation/route";
import { prisma } from "../lib/prisma";
import { reconcileManagedHiringWarrantyLocks } from "../lib/managed-hiring-referral";

test("Vercel schedules the referral reconciliation route daily", () => {
  const configuration = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    crons?: Array<{ path?: string; schedule?: string }>;
  };
  assert.ok(configuration.crons?.some((cron) =>
    cron.path === "/api/cron/referrals-reconciliation" && cron.schedule === "0 2 * * *"));
});

function configure(t: TestContext, values: { nodeEnv: string; secret?: string }) {
  const environment = process.env as Record<string, string | undefined>;
  const previous = { nodeEnv: environment.NODE_ENV, secret: environment.CRON_SECRET, mockDb: environment.MOCK_DB };
  environment.NODE_ENV = values.nodeEnv;
  environment.MOCK_DB = "true";
  if (values.secret === undefined) delete environment.CRON_SECRET;
  else environment.CRON_SECRET = values.secret;
  t.after(() => {
    if (previous.nodeEnv === undefined) delete environment.NODE_ENV; else environment.NODE_ENV = previous.nodeEnv;
    if (previous.secret === undefined) delete environment.CRON_SECRET; else environment.CRON_SECRET = previous.secret;
    if (previous.mockDb === undefined) delete environment.MOCK_DB; else environment.MOCK_DB = previous.mockDb;
  });
}

test("referral cron rejects an unauthenticated non-production request", async (t) => {
  configure(t, { nodeEnv: "development" });
  const response = await GET(new Request("http://localhost/api/cron/referrals-reconciliation") as never);
  assert.equal(response.status, 401);
});

test("referral cron rejects an invalid configured secret", async (t) => {
  configure(t, { nodeEnv: "production", secret: "configured-cron-secret" });
  const response = await GET(new Request("https://hirego.test/api/cron/referrals-reconciliation", {
    headers: { authorization: "Bearer wrong-secret" },
  }) as never);
  assert.equal(response.status, 401);
});

test("concurrent referral reconciliation accounts for an expired reward once", async (t) => {
  configure(t, { nodeEnv: "production", secret: "configured-cron-secret" });
  const row = {
    id: "reward-test",
    referrerId: "referrer-test",
    rewardAmount: 500,
    lockExpiresAt: new Date(0),
    lockDurationDays: 45,
    status: "LOCKED",
  };
  const delegate = prisma.referralReward as unknown as Record<string, unknown>;
  const originalFindMany = delegate.findMany;
  const originalUpdateMany = delegate.updateMany;
  delegate.findMany = async () => [{ ...row }];
  delegate.updateMany = async () => {
    if (row.status !== "LOCKED") return { count: 0 };
    row.status = "ELIGIBLE";
    return { count: 1 };
  };
  const originalTransaction = prisma.$transaction;
  const originalAuditCreate = prisma.auditLog.create;
  const originalOutboxCreate = prisma.securityAuditOutboxEvent.create;
  (prisma as unknown as Record<string, unknown>).$transaction = async (run: (db: typeof prisma) => unknown) => run(prisma);
  (prisma.auditLog as unknown as Record<string, unknown>).create = async ({ data }: { data: Record<string, unknown> }) => ({
    id: "audit-test", createdAt: new Date(), ...data,
  });
  (prisma.securityAuditOutboxEvent as unknown as Record<string, unknown>).create = async () => ({});
  t.after(() => {
    delegate.findMany = originalFindMany;
    delegate.updateMany = originalUpdateMany;
    (prisma as unknown as Record<string, unknown>).$transaction = originalTransaction;
    (prisma.auditLog as unknown as Record<string, unknown>).create = originalAuditCreate;
    (prisma.securityAuditOutboxEvent as unknown as Record<string, unknown>).create = originalOutboxCreate;
  });

  const results = await Promise.all([
    reconcileManagedHiringWarrantyLocks(),
    reconcileManagedHiringWarrantyLocks(),
  ]);
  assert.equal(results.reduce((total, result) => total + result.unlocked, 0), 1);
  assert.equal(results.reduce((total, result) => total + result.totalAmountUnlocked, 0), 500);
});
