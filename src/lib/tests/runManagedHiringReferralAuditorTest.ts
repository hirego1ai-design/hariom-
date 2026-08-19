/**
 * Managed Hiring Authoritative Pipeline & Scheduled Reconciliation Auditor Test Suite
 * 
 * Verifies:
 * 1. Authoritative Server-Side Pipeline: Rejection of arbitrary/unauthenticated/invalid client triggers.
 * 2. Dynamic Replacement Guarantee Locking (45/60/90 days from CommercialAgreement SLA).
 * 3. Employer Company Limit (Max 1 reward of ₹5,000 per company, unlimited placements).
 * 4. Early Candidate Exit Warranty Reversal (Unpaid -> REVERSED).
 * 5. Early Candidate Exit on PAID Reward (Financial Policy Check -> Admin Review Audit Log, no silent cash deduction).
 * 6. Scheduled Cron Reconciliation Endpoint (/api/cron/referrals-reconciliation):
 *    - Bearer CRON_SECRET authentication check.
 *    - Transition of expired LOCKED rewards to ELIGIBLE.
 *    - Idempotency & safe retries.
 */

import { NextRequest } from "next/server";
import { referralDb } from "../referral-db";
import { agreementsDb } from "../agreements-db";
import {
  processManagedHiringPlacementReferralReward,
  handleManagedHiringCandidateEarlyExit,
  reconcileManagedHiringWarrantyLocks,
} from "../managed-hiring-referral";
import { GET as cronGetHandler } from "@/app/api/cron/referrals-reconciliation/route";
import { ReferralProductType, ReferralStatus } from "@/types/referral";
import { getAuditLogs } from "../auditLogger";

export async function runManagedHiringAuditorTests(): Promise<{
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  details: string[];
}> {
  const details: string[] = [];
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, errorMsg?: string) {
    if (condition) {
      passedTests++;
      details.push(`[PASS] ${testName}`);
    } else {
      failedTests++;
      details.push(`[FAIL] ${testName} — ${errorMsg || "Assertion failed"}`);
    }
  }

  console.log("----------------------------------------------------------------");
  console.log("  Running Managed Hiring Authoritative Pipeline & Cron Tests    ");
  console.log("----------------------------------------------------------------\n");

  const timestamp = Date.now();
  const testCompanyId = `comp-audit-${timestamp}`;
  const testReferrerId = `usr-referrer-${timestamp}`;
  const testReferralCode = `AUDIT${timestamp.toString().slice(-4)}`;

  // ============================================================================
  // Test 1: Authoritative Pipeline Validation (Invalid / Fake Prerequisites Rejected)
  // ============================================================================
  try {
    const fakeResult = await processManagedHiringPlacementReferralReward({
      hiringRequirementId: `fake-req-${timestamp}`,
      companyId: testCompanyId,
      candidateId: `cand-${timestamp}`,
    });

    assert(
      !fakeResult.processed && fakeResult.message.includes("Authoritative validation failed"),
      "Test 1: Rejects placement when HiringRequirement does not exist",
      `Expected failure, got: ${fakeResult.message}`
    );
  } catch (e: any) {
    assert(false, "Test 1: Exception during invalid requirement test", e.message);
  }

  // ============================================================================
  // Test 2: Valid Authoritative Pipeline Setup & 60-Day Guarantee Locking
  // ============================================================================
  let testReqId = "";
  let testAgrId = "";
  try {
    // 1. Register Attribution for Test Company
    await referralDb.createAttribution({
      referrerId: testReferrerId,
      referredCompanyId: testCompanyId,
      referralCode: testReferralCode,
      attributionSource: "MANAGED_HIRING_AUDIT",
      userType: "EMPLOYER",
    });

    // 2. Create authoritative Hiring Requirement
    const req = await agreementsDb.createRequirement({
      companyName: "Acme Corp Audited",
      contactPerson: "Jane Doe HR",
      email: `hr-${timestamp}@acme.com`,
      primaryMobile: "+91 9999888877",
      industry: "Software",
      numberOfPositions: 2,
      jobTitles: ["Principal Backend Architect"],
      experienceYears: "8+ Years",
      skillsRequired: ["Go", "Distributed Systems"],
      education: "B.Tech",
      salaryRangeMin: 3500000,
      salaryRangeMax: 5000000,
      currency: "INR",
      workMode: "Hybrid",
      location: "Bangalore",
      joiningTimeline: "Immediate",
      hiringPriority: "High",
      replacementExpectation: "60 Days",
    });
    testReqId = req.id;

    // 3. Create authoritative Commercial Agreement with 60-day replacement SLA
    const agr = await agreementsDb.createAgreement({
      requirementId: req.id,
      companyName: "Acme Corp Audited",
      clientLegalName: "Acme Technologies Private Limited",
      contactPerson: "Jane Doe HR",
      clientEmail: `hr-${timestamp}@acme.com`,
      clientPhone: "+91 9999888877",
      feeType: "PERCENTAGE",
      feeValue: 8.33,
      invoiceRule: "ON_JOINING",
      replacementDays: 60,
      validityStartDate: new Date().toISOString(),
      validityEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      advancePaymentAmount: 0,
      discountPercentage: 0,
      creditDays: 30,
      taxRatePct: 18.0,
      customClauses: ["Strict SLA"],
    });
    testAgrId = agr.id;

    // 4. Trigger placement referral
    const placementResult = await processManagedHiringPlacementReferralReward({
      hiringRequirementId: testReqId,
      commercialAgreementId: testAgrId,
      companyId: testCompanyId,
      candidateId: `cand-john-${timestamp}`,
      hiredAt: new Date(),
    });

    assert(
      placementResult.processed &&
        placementResult.reward !== undefined &&
        placementResult.reward?.status === ReferralStatus.LOCKED &&
        placementResult.reward?.rewardAmount === 5000 &&
        placementResult.reward?.lockDurationDays === 60,
      "Test 2: Authoritative placement creates ₹5,000 reward LOCKED for dynamic 60-day SLA",
      `Result: ${JSON.stringify(placementResult)}`
    );
  } catch (e: any) {
    assert(false, "Test 2: Exception during authoritative placement", e.message);
  }

  // ============================================================================
  // Test 3: Maximum 1 Managed Hiring Reward Limit per Company (Rule 5)
  // ============================================================================
  try {
    const secondPlacement = await processManagedHiringPlacementReferralReward({
      hiringRequirementId: testReqId,
      commercialAgreementId: testAgrId,
      companyId: testCompanyId,
      candidateId: `cand-second-${timestamp}`,
      hiredAt: new Date(),
    });

    assert(
      secondPlacement.processed &&
        secondPlacement.reward?.status === ReferralStatus.LIMIT_REACHED &&
        secondPlacement.reward?.rewardAmount === 0,
      "Test 3: Second placement for same company gives ₹0 reward (LIMIT_REACHED) while allowing placement",
      `Result: ${JSON.stringify(secondPlacement)}`
    );
  } catch (e: any) {
    assert(false, "Test 3: Exception during company limit test", e.message);
  }

  // ============================================================================
  // Test 4: Replacement Guarantee Reversal on Candidate Exit (Unpaid -> REVERSED)
  // ============================================================================
  try {
    const exitResult = await handleManagedHiringCandidateEarlyExit({
      hiringRequirementId: testReqId,
      candidateId: `cand-john-${timestamp}`,
      reason: "Candidate failed 30-day technical probation",
    });

    assert(
      exitResult.reversed && exitResult.count >= 1 && !exitResult.requiresAdminReview,
      "Test 4: Candidate exit during warranty transitions unpaid LOCKED reward to REVERSED",
      `Result: ${JSON.stringify(exitResult)}`
    );
  } catch (e: any) {
    assert(false, "Test 4: Exception during early exit test", e.message);
  }

  // ============================================================================
  // Test 5: Candidate Exit on Already PAID Reward (Financial Policy Check)
  // ============================================================================
  try {
    const paidCompanyId = `comp-paid-${timestamp}`;
    const paidReferrerId = `usr-paid-ref-${timestamp}`;

    await referralDb.createAttribution({
      referrerId: paidReferrerId,
      referredCompanyId: paidCompanyId,
      referralCode: `PAID${timestamp.toString().slice(-4)}`,
      attributionSource: "MANAGED_HIRING_AUDIT",
      userType: "EMPLOYER",
    });

    const paidReq = await agreementsDb.createRequirement({
      companyName: "Beta Corp",
      contactPerson: "Bob HR",
      email: `bob-${timestamp}@beta.com`,
      primaryMobile: "+91 8888777766",
      industry: "Fintech",
      numberOfPositions: 1,
      jobTitles: ["Tech Lead"],
      experienceYears: "6+ Years",
      skillsRequired: ["Node.js"],
      education: "MCA",
      salaryRangeMin: 2500000,
      salaryRangeMax: 3500000,
      currency: "INR",
      workMode: "Remote",
      location: "Mumbai",
      joiningTimeline: "Immediate",
      hiringPriority: "Standard",
      replacementExpectation: "90 Days",
    });

    const paidAgr = await agreementsDb.createAgreement({
      requirementId: paidReq.id,
      companyName: "Beta Corp",
      clientLegalName: "Beta Fintech Ltd",
      contactPerson: "Bob HR",
      clientEmail: `bob-${timestamp}@beta.com`,
      clientPhone: "+91 8888777766",
      feeType: "PERCENTAGE",
      feeValue: 8.33,
      invoiceRule: "ON_JOINING",
      replacementDays: 90,
      validityStartDate: new Date().toISOString(),
      validityEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const rewardRes = await processManagedHiringPlacementReferralReward({
      hiringRequirementId: paidReq.id,
      commercialAgreementId: paidAgr.id,
      companyId: paidCompanyId,
      candidateId: `cand-paid-${timestamp}`,
      hiredAt: new Date(),
    });

    const reward = rewardRes.reward!;
    // Manually simulate payout lifecycle to PAID
    reward.status = ReferralStatus.PAID;
    reward.payoutId = `payout-${timestamp}`;
    (referralDb as any).rewards.set(reward.id, reward);

    // Trigger candidate exit on PAID reward
    const paidExitResult = await handleManagedHiringCandidateEarlyExit({
      hiringRequirementId: paidReq.id,
      candidateId: `cand-paid-${timestamp}`,
      reason: "Candidate resigned on Day 40 within 90-day warranty",
    });

    assert(
      paidExitResult.requiresAdminReview &&
        paidExitResult.paidAdjustmentCount >= 1 &&
        reward.status === ReferralStatus.PAID,
      "Test 5: Financial policy check on PAID reward prevents silent deduction & triggers admin review audit",
      `Result: ${JSON.stringify(paidExitResult)}`
    );
  } catch (e: any) {
    assert(false, "Test 5: Exception during paid exit test", e.message);
  }

  // ============================================================================
  // Test 6: Scheduled Cron Reconciliation Endpoint (/api/cron/referrals-reconciliation)
  // ============================================================================
  try {
    process.env.CRON_SECRET = "audit_super_secret_cron_key_2026";

    // 6a. Unauthorized check
    const unauthReq = new NextRequest("http://localhost:3000/api/cron/referrals-reconciliation", {
      method: "GET",
      headers: { authorization: "Bearer invalid_secret" },
    });
    const unauthRes = await cronGetHandler(unauthReq);
    assert(
      unauthRes.status === 401,
      "Test 6a: Cron endpoint returns 401 Unauthorized for invalid Bearer token",
      `Expected status 401, got ${unauthRes.status}`
    );

    // 6b. Setup expired LOCKED reward in test harness
    const expiredCompanyId = `comp-exp-${timestamp}`;
    const expiredReferrerId = `usr-exp-ref-${timestamp}`;

    await referralDb.createAttribution({
      referrerId: expiredReferrerId,
      referredCompanyId: expiredCompanyId,
      referralCode: `EXP${timestamp.toString().slice(-4)}`,
      attributionSource: "MANAGED_HIRING_AUDIT",
      userType: "EMPLOYER",
    });

    const expReq = await agreementsDb.createRequirement({
      companyName: "Gamma Corp",
      contactPerson: "George HR",
      email: `george-${timestamp}@gamma.com`,
      primaryMobile: "+91 7777666655",
      industry: "AI",
      numberOfPositions: 1,
      jobTitles: ["ML Engineer"],
      experienceYears: "3+ Years",
      skillsRequired: ["Python", "PyTorch"],
      education: "B.Tech",
      salaryRangeMin: 2000000,
      salaryRangeMax: 3000000,
      currency: "INR",
      workMode: "Remote",
      location: "Hyderabad",
      joiningTimeline: "Immediate",
      hiringPriority: "Standard",
      replacementExpectation: "45 Days",
    });

    const expAgr = await agreementsDb.createAgreement({
      requirementId: expReq.id,
      companyName: "Gamma Corp",
      clientLegalName: "Gamma AI Private Limited",
      contactPerson: "George HR",
      clientEmail: `george-${timestamp}@gamma.com`,
      clientPhone: "+91 7777666655",
      feeType: "PERCENTAGE",
      feeValue: 8.33,
      invoiceRule: "ON_JOINING",
      replacementDays: 45,
      validityStartDate: new Date().toISOString(),
      validityEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Hired 50 days ago (past 45-day warranty lock)
    const hiredDatePast = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
    const expPlacement = await processManagedHiringPlacementReferralReward({
      hiringRequirementId: expReq.id,
      commercialAgreementId: expAgr.id,
      companyId: expiredCompanyId,
      candidateId: `cand-exp-${timestamp}`,
      hiredAt: hiredDatePast,
    });

    assert(
      expPlacement.processed && expPlacement.reward?.status === ReferralStatus.LOCKED,
      "Test 6b: Past-hire placement initially created in LOCKED state",
      `Result: ${JSON.stringify(expPlacement)}`
    );

    // 6c. Execute Cron Reconciliation with valid CRON_SECRET
    const authReq = new NextRequest("http://localhost:3000/api/cron/referrals-reconciliation", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const cronRes = await cronGetHandler(authReq);
    const cronBody = await cronRes.json();

    assert(
      cronRes.status === 200 && cronBody.success && cronBody.unlockedCount >= 1,
      "Test 6c: Authorized cron run successfully unlocks expired warranty locks to ELIGIBLE",
      `Cron response: ${JSON.stringify(cronBody)}`
    );

    // Verify underlying reward transitioned to ELIGIBLE
    const updatedReward = (referralDb as any).rewards.get(expPlacement.reward!.id);
    assert(
      updatedReward.status === ReferralStatus.ELIGIBLE &&
        updatedReward.isLocked === false &&
        updatedReward.unlockedAt !== null,
      "Test 6d: Underlying reward record state is ELIGIBLE with unlockedAt populated",
      `Reward status: ${updatedReward?.status}`
    );

    // 6e. Idempotency test: immediate retry should unlock 0 rewards
    const retryReq = new NextRequest("http://localhost:3000/api/cron/referrals-reconciliation", {
      method: "GET",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const retryRes = await cronGetHandler(retryReq);
    const retryBody = await retryRes.json();

    assert(
      retryRes.status === 200 && retryBody.success && retryBody.unlockedCount === 0,
      "Test 6e: Immediate retry is idempotent (0 duplicate unlocks)",
      `Retry response: ${JSON.stringify(retryBody)}`
    );
  } catch (e: any) {
    assert(false, "Test 6: Exception during cron reconciliation test", e.message);
  }

  // ============================================================================
  // Test 7: Audit Log Verification
  // ============================================================================
  try {
    const logs = await getAuditLogs(20);
    const hasLockEvent = logs.some((l) => l.action.includes("MANAGED_HIRING_REWARD_LOCKED"));
    const hasReversalEvent = logs.some((l) => l.action.includes("MANAGED_HIRING_REWARD_REVERSED"));
    const hasAdjustmentEvent = logs.some((l) => l.action.includes("REFERRAL_FINANCIAL_ADJUSTMENT_REQUIRED"));
    const hasCronEvent = logs.some((l) => l.action.includes("REFERRAL_WARRANTY_LOCK_EXPIRED_UNLOCKED") || l.action.includes("REFERRALS_RECONCILIATION_COMPLETED"));

    assert(
      hasLockEvent && hasReversalEvent && hasAdjustmentEvent && hasCronEvent,
      "Test 7: Comprehensive audit trail recorded across all lifecycle events",
      `Found actions: ${logs.map((l) => l.action).join(", ")}`
    );
  } catch (e: any) {
    assert(false, "Test 7: Exception during audit log verification", e.message);
  }

  console.log("\n----------------------------------------------------------------");
  console.log(`RESULTS: ${passedTests} / ${passedTests + failedTests} Passed | ${failedTests} Failed`);
  console.log("----------------------------------------------------------------\n");

  return {
    passed: failedTests === 0,
    totalTests: passedTests + failedTests,
    passedTests,
    failedTests,
    details,
  };
}
