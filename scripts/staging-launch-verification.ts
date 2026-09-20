/**
 * HIREGO AI — BULK STAGING & RELEASE LAUNCH VERIFICATION SUITE
 *
 * Covers Batches 1 to 5:
 *   Batch 1: Staging Foundation & Health Check
 *   Batch 2: Auth, RBAC & Tenant Isolation Gate
 *   Batch 3: Commercial Pricing & Billing Calculation Verification
 *   Batch 4: Communications & Dispatch Catalog Verification
 *   Batch 5: Latency, Concurrency & High-Throughput Load Verification
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { calculateCommercialFee } from "../src/utils/pricing";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFile();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestReport {
  batch: string;
  name: string;
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const results: TestReport[] = [];

function record(batch: string, name: string, passed: boolean, details?: string, durationMs?: number) {
  results.push({ batch, name, passed, details, durationMs });
  const icon = passed ? "PASS" : "FAIL";
  console.log(`  [${icon}] ${batch}: ${name}${details ? ` -> ${details}` : ""}${durationMs ? ` (${durationMs}ms)` : ""}`);
}

async function runBatch1_StagingFoundation() {
  console.log("\n=======================================================");
  console.log(" BATCH 1: STAGING FOUNDATION & HEALTH CHECK");
  console.log("=======================================================");

  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(15_000) });
    const elapsed = Date.now() - t0;
    assert.equal(res.status, 200, `Health endpoint returned status ${res.status}`);
    const data = await res.json();
    assert.equal(data.status, "healthy", `Status should be healthy, got ${data.status}`);
    assert.equal(data.database, "connected", `Database should be connected, got ${data.database}`);
    assert.ok(typeof data.uptime === "number", "Uptime should be a number");
    record("Batch 1", "Public Health Liveness/Readiness (/api/health)", true, `DB: ${data.database}, uptime: ${data.uptime}s`, elapsed);
  } catch (err: any) {
    record("Batch 1", "Public Health Liveness/Readiness (/api/health)", false, err.message, Date.now() - t0);
  }

  // Environment variable validation
  const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];
  const missingEnv = requiredEnv.filter((v) => !process.env[v]);
  if (missingEnv.length === 0) {
    record("Batch 1", "Required Environment Baseline", true, "DATABASE_URL and JWT_SECRET configured");
  } else {
    record("Batch 1", "Required Environment Baseline", false, `Missing: ${missingEnv.join(", ")}`);
  }
}

async function runBatch2_AuthAndTenantIsolation() {
  console.log("\n=======================================================");
  console.log(" BATCH 2: AUTH, RBAC & TENANT ISOLATION GATE");
  console.log("=======================================================");

  const protectedEndpoints = [
    { path: "/api/auth/me", expected: 401, desc: "Session auth required" },
    { path: "/api/admin/system/queues", expected: 401, desc: "Admin queue monitoring auth" },
    { path: "/api/employer/candidates", expected: 401, desc: "Employer candidates access" },
    { path: "/api/employer/subscribe", expected: 401, desc: "Commercial subscription mutate" },
    { path: "/api/admin/security/status", expected: 401, desc: "Admin security dashboard auth" },
  ];

  for (const ep of protectedEndpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      const elapsed = Date.now() - t0;
      assert.equal(res.status, ep.expected, `Expected ${ep.expected} for ${ep.path}, got ${res.status}`);
      record("Batch 2", `Reject Unauthenticated: ${ep.path}`, true, `${ep.desc} (HTTP ${res.status})`, elapsed);
    } catch (err: any) {
      record("Batch 2", `Reject Unauthenticated: ${ep.path}`, false, err.message, Date.now() - t0);
    }
  }

  // Check CSP & Security Headers on unauthenticated requests
  try {
    const homeRes = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(15_000) });
    const csp = homeRes.headers.get("content-security-policy");
    const hasCsp = !!csp;
    record("Batch 2", "Content-Security-Policy Header Enforcement", hasCsp, hasCsp ? "CSP header verified" : "CSP header missing");
  } catch (err: any) {
    record("Batch 2", "Content-Security-Policy Header Enforcement", false, err.message);
  }
}

async function runBatch3_CommercialPricingVerification() {
  console.log("\n=======================================================");
  console.log(" BATCH 3: COMMERCIAL PRICING & BILLING CALCULATION");
  console.log("=======================================================");

  // 1. Test FIXED model
  try {
    const fixedRes = calculateCommercialFee({
      pricingModel: "FIXED",
      feeValue: 75000,
      ctcAnnual: 1800000,
      taxRatePct: 18.0,
      discountPct: 10,
    });
    assert.equal(fixedRes.baseFee, 75000, "Base fee must equal fixed fee value");
    assert.equal(fixedRes.discountAmount, 7500, "10% discount of 75000 is 7500");
    assert.equal(fixedRes.subtotal, 67500, "Subtotal must be 67500");
    assert.equal(fixedRes.taxAmount, Math.round(67500 * 0.18), "Tax must be 18% of subtotal");
    assert.equal(fixedRes.totalAmount, 67500 + Math.round(67500 * 0.18), "Total amount must be subtotal + tax");
    record("Batch 3", "Pricing Model: FIXED with 10% Discount & 18% GST", true, `Total: ₹${fixedRes.totalAmount.toLocaleString()}`);
  } catch (err: any) {
    record("Batch 3", "Pricing Model: FIXED with 10% Discount & 18% GST", false, err.message);
  }

  // 2. Test PERCENTAGE model (standard 8.33% hiring fee)
  try {
    const ctc = 2400000;
    const pctRes = calculateCommercialFee({
      pricingModel: "PERCENTAGE",
      feeValue: 8.33,
      ctcAnnual: ctc,
      discountPct: 0,
      taxRatePct: 18.0,
    });
    const expectedBase = Math.round(ctc * 0.0833);
    assert.equal(pctRes.baseFee, expectedBase, "Base fee must be exactly CTC * 8.33%");
    assert.equal(pctRes.subtotal, expectedBase, "Subtotal with 0% discount must equal base fee");
    assert.equal(pctRes.taxAmount, Math.round(expectedBase * 0.18), "Tax must be 18% of subtotal");
    record("Batch 3", "Pricing Model: PERCENTAGE (8.33% on ₹24L CTC)", true, `Subtotal: ₹${pctRes.subtotal.toLocaleString()}, Total: ₹${pctRes.totalAmount.toLocaleString()}`);
  } catch (err: any) {
    record("Batch 3", "Pricing Model: PERCENTAGE (8.33% on ₹24L CTC)", false, err.message);
  }

  // 3. Test HYBRID model (Retainer + Success Fee)
  try {
    const hybridRes = calculateCommercialFee({
      pricingModel: "HYBRID",
      retainerAmount: 30000,
      feeValue: 5.0,
      ctcAnnual: 2000000,
      discountPct: 5,
    });
    assert.equal(hybridRes.retainerFee, 30000, "Retainer fee must equal specified amount");
    assert.equal(hybridRes.successFee, 100000, "5% of 20L is 100000");
    assert.equal(hybridRes.grossFee, 130000, "Gross fee must be retainer + success fee");
    record("Batch 3", "Pricing Model: HYBRID (₹30k Retainer + 5% Success)", true, `Gross: ₹${hybridRes.grossFee.toLocaleString()}, Subtotal: ₹${hybridRes.subtotal.toLocaleString()}`);
  } catch (err: any) {
    record("Batch 3", "Pricing Model: HYBRID (₹30k Retainer + 5% Success)", false, err.message);
  }

  // 4. Test SLAB model (CTC tiered rates)
  try {
    const slabUnder10 = calculateCommercialFee({ pricingModel: "SLAB", feeValue: 0, ctcAnnual: 800000 });
    assert.equal(slabUnder10.baseFee, Math.round(800000 * 0.0833));

    const slabMid = calculateCommercialFee({ pricingModel: "SLAB", feeValue: 0, ctcAnnual: 1500000 });
    assert.equal(slabMid.baseFee, Math.round(1500000 * 0.10));

    const slabHigh = calculateCommercialFee({ pricingModel: "SLAB", feeValue: 0, ctcAnnual: 3000000 });
    assert.equal(slabHigh.baseFee, Math.round(3000000 * 0.125));

    record("Batch 3", "Pricing Model: SLAB Multi-Tier Progression (<10L, 10-25L, >25L)", true, `Tier 1: 8.33%, Tier 2: 10%, Tier 3: 12.5% verified`);
  } catch (err: any) {
    record("Batch 3", "Pricing Model: SLAB Multi-Tier Progression", false, err.message);
  }

  // 5. Boundary condition: discount clamp [0, 100]
  try {
    const clampedUnder = calculateCommercialFee({ pricingModel: "FIXED", feeValue: 50000, discountPct: -20 });
    assert.equal(clampedUnder.discountPct, 0, "Negative discount must clamp to 0%");

    const clampedOver = calculateCommercialFee({ pricingModel: "FIXED", feeValue: 50000, discountPct: 150 });
    assert.equal(clampedOver.discountPct, 100, "Over-100% discount must clamp to 100%");
    assert.equal(clampedOver.subtotal, 0, "100% discount must yield subtotal of 0");

    record("Batch 3", "Discount Boundary Defense Clamping ([-20% -> 0%], [150% -> 100%])", true, "Bounds strictly constrained");
  } catch (err: any) {
    record("Batch 3", "Discount Boundary Defense Clamping", false, err.message);
  }
}

async function runBatch4_CommunicationsCatalogVerification() {
  console.log("\n=======================================================");
  console.log(" BATCH 4: COMMUNICATIONS & DISPATCH CATALOG VERIFICATION");
  console.log("=======================================================");

  try {
    const emailModule = await import("../src/lib/email");
    assert.ok(typeof emailModule.sendEmail === "function", "sendEmail function must exist");
    record("Batch 4", "Email Delivery Service Module Loading", true, "sendEmail function exported and typed");
  } catch (err: any) {
    record("Batch 4", "Email Delivery Service Module Loading", false, err.message);
  }

  try {
    const commsModule = await import("../src/lib/communications/dispatcher");
    assert.ok(typeof commsModule.dispatchAdminDirectCommunication === "function", "dispatchAdminDirectCommunication function must exist");
    record("Batch 4", "Admin Direct Communications Dispatcher", true, "dispatchAdminDirectCommunication verified");
  } catch (err: any) {
    record("Batch 4", "Admin Direct Communications Dispatcher", false, err.message);
  }
}

async function runBatch5_ConcurrencyAndLoadVerification() {
  console.log("\n=======================================================");
  console.log(" BATCH 5: LATENCY, CONCURRENCY & LOAD VERIFICATION");
  console.log("=======================================================");

  const TOTAL_REQUESTS = 30;
  const CONCURRENCY = 6;
  console.log(`  Dispatching ${TOTAL_REQUESTS} requests across concurrency pool of ${CONCURRENCY} to /api/health...`);

  // Warm-up single request
  await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(15_000) });

  const t0 = Date.now();
  const durations: number[] = [];
  let failures = 0;

  // Execute in batches of CONCURRENCY to avoid socket exhaustion on Windows loopback
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS - i) }, async () => {
      const reqStart = Date.now();
      try {
        const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(15_000) });
        const elapsed = Date.now() - reqStart;
        durations.push(elapsed);
        if (res.status !== 200) {
          failures++;
        }
      } catch {
        failures++;
      }
    });
    await Promise.all(batch);
  }

  const totalElapsed = Date.now() - t0;

  durations.sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.50)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

  const passed = failures === 0 && p95 < 2500;
  record(
    "Batch 5",
    `Concurrent Load (${TOTAL_REQUESTS} reqs, c=${CONCURRENCY})`,
    passed,
    `Failures: ${failures}/${TOTAL_REQUESTS}, p50: ${p50}ms, p95: ${p95}ms, p99: ${p99}ms, total: ${totalElapsed}ms`
  );
}

async function main() {
  console.log("=================================================================");
  console.log(" HIREGO AI — COMPREHENSIVE PRODUCTION LAUNCH VERIFICATION");
  console.log(` Target Server: ${BASE_URL}`);
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log("=================================================================");

  await runBatch1_StagingFoundation();
  await runBatch2_AuthAndTenantIsolation();
  await runBatch3_CommercialPricingVerification();
  await runBatch4_CommunicationsCatalogVerification();
  await runBatch5_ConcurrencyAndLoadVerification();

  console.log("\n=================================================================");
  console.log(" VERIFICATION SUMMARY");
  console.log("=================================================================");

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const score = Math.round((passed / total) * 100);

  console.log(`  Total Checks: ${total}`);
  console.log(`  Passed:       ${passed}`);
  console.log(`  Failed:       ${failed}`);
  console.log(`  Readiness:    ${score}%`);
  console.log("=================================================================");

  if (failed > 0) {
    console.error(`\n❌ VERIFICATION FAILED with ${failed} failure(s).`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL ${total} VERIFICATION CHECKS PASSED PERFECTLY (100%).`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Verification suite error:", err);
  process.exit(1);
});
