import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { TestResult } from "./suite.test";

export async function runPromoCodeTests(): Promise<{
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    if (condition) {
      passed++;
      results.push({ name, category: "Promo Codes", passed: true, message: `PASS: ${message}` });
    } else {
      failed++;
      results.push({ name, category: "Promo Codes", passed: false, message: `FAIL: ${message}` });
    }
  };

  // 1. Check database connectivity
  let dbAvailable = false;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbAvailable = true;
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      results.push({
        name: "Promo code PostgreSQL integration suite",
        category: "Promo Codes",
        passed: false,
        skipped: true,
        message: "SKIPPED outside CI: database unavailable (set HIREGO_TEST_DATABASE=1)",
      });
      return { passed, failed, results };
    }
  }

  if (dbAvailable) {
    const testSuffix = crypto.randomUUID().slice(0, 6).toUpperCase();
    const codeValid = `TEST_VALID_${testSuffix}`;
    const codeExpired = `TEST_EXPIRED_${testSuffix}`;
    const codeArchived = `TEST_ARCHIVED_${testSuffix}`;
    const codeExhausted = `TEST_EXHAUST_${testSuffix}`;

    try {
      // 1. Create a valid promo code
      const promo1 = await subscriptionsDb.createPromoCode({
        code: codeValid.toLowerCase(), // test case-insensitivity & normalization
        discountType: "PERCENTAGE",
        discountValue: 25,
        maxUsage: 10,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      assert(
        "Promo code normalization and creation in PostgreSQL",
        promo1.code === codeValid && promo1.discountValue === 25,
        "Code normalized to uppercase and created via Prisma"
      );

      // 2. Validate valid promo code
      const validated1 = await subscriptionsDb.validatePromoCode(codeValid.toLowerCase());
      assert(
        "Valid promo code validation succeeds",
        validated1 !== null && validated1.code === codeValid && validated1.discountType === "PERCENTAGE",
        "Active, unexpired promo code validated successfully"
      );

      // 3. Create expired promo code
      await subscriptionsDb.createPromoCode({
        code: codeExpired,
        discountType: "FLAT",
        discountValue: 1000,
        maxUsage: 100,
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // expired yesterday
      });

      const validatedExpired = await subscriptionsDb.validatePromoCode(codeExpired);
      assert(
        "Expired promo code is rejected by validation",
        validatedExpired === null,
        "Expired promo code returns null"
      );

      // 4. Create and archive promo code
      await subscriptionsDb.createPromoCode({
        code: codeArchived,
        discountType: "PERCENTAGE",
        discountValue: 50,
        maxUsage: 50,
      });
      await subscriptionsDb.archivePromoCode(codeArchived);

      const validatedArchived = await subscriptionsDb.validatePromoCode(codeArchived);
      assert(
        "Archived promo code is rejected by validation",
        validatedArchived === null,
        "Archived promo code returns null"
      );

      // 5. Create exhausted promo code
      const promoExhausted = await subscriptionsDb.createPromoCode({
        code: codeExhausted,
        discountType: "FLAT",
        discountValue: 500,
        maxUsage: 1,
      });

      // Update usage count to maxUsage
      await prisma.promoCode.update({
        where: { code: codeExhausted },
        data: { usageCount: 1 },
      });

      const validatedExhausted = await subscriptionsDb.validatePromoCode(codeExhausted);
      assert(
        "Exhausted promo code (usage >= maxUsage) is rejected",
        validatedExhausted === null,
        "Exhausted promo code returns null"
      );

      // 6. Test Atomic Reservation & Release (Double Spending / Concurrency Protection)
      const reserved = await subscriptionsDb.reservePromoCode(codeValid);
      assert(
        "Promo code atomic reservation increments reservedUsage",
        (reserved.reservedUsage ?? 0) >= 1,
        "reservedUsage incremented atomically via FOR UPDATE transaction"
      );

      // Release reservation (simulate failed payment / abandoned checkout)
      await subscriptionsDb.releasePromoReservation(codeValid);
      const afterRelease = await prisma.promoCode.findUnique({ where: { code: codeValid } });
      assert(
        "Releasing reservation decrements reservedUsage",
        afterRelease?.reservedUsage === 0,
        "reservedUsage decremented back to 0 on checkout rollback"
      );

      // 7. Test Confirm Usage (Successful Payment Webhook)
      await subscriptionsDb.confirmPromoUsage(codeValid);
      const afterConfirm = await prisma.promoCode.findUnique({ where: { code: codeValid } });
      assert(
        "Confirming promo usage increments usageCount",
        afterConfirm?.usageCount === 1,
        "usageCount incremented upon confirmed payment"
      );

      // Cleanup
      await prisma.promoCode.deleteMany({
        where: {
          code: { in: [codeValid, codeExpired, codeArchived, codeExhausted] },
        },
      }).catch(() => undefined);
    } catch (err: any) {
      assert("Promo code suite execution", false, err.message || String(err));
    }
  }

  return { passed, failed, results };
}
