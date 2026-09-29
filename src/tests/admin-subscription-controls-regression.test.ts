import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("admin subscription controls use one canonical screen and reject stale commercial writes", () => {
  const page = fs.readFileSync(new URL("../app/admin/subscriptions/page.tsx", import.meta.url), "utf8");
  const legacyPage = fs.readFileSync(new URL("../app/admin/settings/plan-management/page.tsx", import.meta.url), "utf8");
  const plansRoute = fs.readFileSync(new URL("../app/api/admin/subscription-plans/route.ts", import.meta.url), "utf8");
  const settingsRoute = fs.readFileSync(new URL("../app/api/admin/subscriptions/settings/route.ts", import.meta.url), "utf8");
  const planContracts = fs.readFileSync(new URL("../lib/payments/planContracts.ts", import.meta.url), "utf8");
  const planMutations = fs.readFileSync(new URL("../lib/adminSubscriptionPlanMutations.ts", import.meta.url), "utf8");
  const settingsMutations = fs.readFileSync(new URL("../lib/adminSubscriptionSettingsMutations.ts", import.meta.url), "utf8");

  assert(legacyPage.includes('redirect("/admin/subscriptions")'));

  assert(plansRoute.includes("requireAdminSession(request)"));
  assert(plansRoute.includes('admin_subscription_plans_read:${session.id}'));
  assert(plansRoute.includes('admin_subscription_plans_write:${session.id}'));
  assert(!plansRoute.includes("getCurrentSession"));
  assert(plansRoute.includes("Invalid expectedUpdatedAt timestamp."));

  assert(settingsRoute.includes("requireAdminSession(request)"));
  assert(settingsRoute.includes('admin_subscription_settings_read:${admin.id}'));
  assert(settingsRoute.includes('admin_subscription_settings_write:${admin.id}'));
  assert(settingsRoute.includes("expectedUpdatedAt: z.string().datetime()"));

  assert(planContracts.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(planMutations.includes("existing.updatedAt.toISOString() !== expectedUpdatedAt"));
  assert(settingsMutations.includes("existing.updatedAt.toISOString() !== payload.expectedUpdatedAt"));

  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes('role="dialog"'));
  assert(page.includes("payload.expectedUpdatedAt = plan.updatedAt"));
  assert(page.includes("target.expectedUpdatedAt"));
  assert(page.includes('cost.trim() !== ""'));
  assert(page.includes("disabled={saving || !costValid}"));
  assert(!page.includes('onClick={() => void archivePlan(item.id)}'));
});
