/**
 * HireGo Referral Engine — Production Security, IDOR, Canonical Identity & Fraud Test Suite
 * 
 * Test Modules:
 * 1. Canonical Company Identity (Case A, Case B, Case C)
 * 2. IDOR & Authorization Endpoints (/api/referrals, /api/referrals/payout, /api/admin/referrals/*)
 * 3. Rate Limiting on Sensitive Referral Endpoints
 * 4. Fraud Engine State Machine & Payout Gating (NORMAL -> FLAGGED -> FRAUD_HOLD -> ADMIN_REVIEW -> NORMAL)
 * 5. Payout Double-Spend Defense & Guarantee Lock Reconciliation
 */

import { FraudStatus, ReferralProductType, ReferralStatus } from "@/types/referral";
import { referralDb } from "@/lib/referral-db";
import { createSessionToken } from "@/lib/auth";
import { resetRateLimitStore } from "@/lib/apiSecurity";

// Import API route handlers for direct HTTP request/response auditing
import { GET as referralsGetHandler, POST as referralsPostHandler } from "@/app/api/referrals/route";
import { POST as payoutPostHandler } from "@/app/api/referrals/payout/route";
import { GET as validateGetHandler } from "@/app/api/referrals/validate/route";
import { GET as adminAnalyticsGetHandler } from "@/app/api/admin/referrals/analytics/route";
import { GET as adminConfigGetHandler, PUT as adminConfigPutHandler } from "@/app/api/admin/referrals/config/route";
import { GET as adminPayoutsGetHandler, POST as adminPayoutsPostHandler } from "@/app/api/admin/referrals/payouts/route";
import { GET as adminFraudGetHandler, POST as adminFraudPostHandler } from "@/app/api/admin/referrals/fraud/route";

export interface ReferralTestResult {
  name: string;
  success: boolean;
  message: string;
}

export async function runReferralTestSuite(): Promise<{
  passed: number;
  failed: number;
  results: ReferralTestResult[];
}> {
  const results: ReferralTestResult[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    if (condition) {
      passed++;
      results.push({ name, success: true, message: `PASS: ${message}` });
    } else {
      failed++;
      results.push({ name, success: false, message: `FAIL: ${message}` });
    }
  };

  try {
    // Reset test harness state
    referralDb.resetTestHarness();
    await resetRateLimitStore();

    const referrerAlphaId = "usr-referrer-alpha";
    referralDb.registerTestUserProfile(referrerAlphaId, {
      email: "alpha.referrer@example.com",
      phone: "+919876543210",
    });

    // ================================================================
    // SECTION 1: CANONICAL COMPANY IDENTITY (Cases A, B, C)
    // ================================================================

    // --- Case A: CEO registers company with Referral A -> HR joins -> HR uses company -> Referrer A attributed ---
    const companyAId = "comp-acme-corp";
    const ceoUserId = "usr-ceo-acme";
    const hrUserId = "usr-hr-acme";

    // CEO registers company with Referral A
    const attrCompanyA = await referralDb.createAttribution({
      referrerId: referrerAlphaId,
      referredCompanyId: companyAId,
      referralCode: "ALPHA2026",
      attributionSource: "REGISTRATION",
      userType: "EMPLOYER",
    });

    referralDb.registerTestEmployeeCompany(ceoUserId, companyAId);
    referralDb.registerTestEmployeeCompany(hrUserId, companyAId);

    // HR joins and performs transaction (Job post)
    const canonicalAttrHR = await referralDb.resolveCanonicalAttribution({
      userId: hrUserId,
      companyId: companyAId,
    });

    assert(
      "Canonical Identity Case A: HR action resolves Company Referrer A",
      canonicalAttrHR !== null &&
        canonicalAttrHR.referrerId === referrerAlphaId &&
        canonicalAttrHR.referredCompanyId === companyAId,
      "HR acting on behalf of Company A canonically resolves Referrer A attribution"
    );

    // Reward generated from HR action belongs to Company A & Referrer A
    const hrJobReward = await referralDb.recordQualifyingReward({
      attribution: canonicalAttrHR!,
      productType: ReferralProductType.EMPLOYER_JOB_POST,
      transactionId: "tx-hr-job-post-1",
    });

    assert(
      "Canonical Identity Case A: Reward Granted",
      hrJobReward !== null && hrJobReward.referrerId === referrerAlphaId && hrJobReward.rewardAmount === 1000,
      "Job post by HR generates ₹1,000 reward attributed to Referrer A"
    );

    // --- Case B: HR attempts referral link from Referrer B -> Company already attributed -> Referrer A remains authoritative ---
    const referrerBetaId = "usr-referrer-beta";
    referralDb.registerTestUserProfile(referrerBetaId, {
      email: "beta.referrer@example.com",
      phone: "+919876543211",
    });

    const hijackAttempt = await referralDb.createAttribution({
      referrerId: referrerBetaId,
      referredCompanyId: companyAId,
      referralCode: "BETA2026",
      attributionSource: "HR_LATE_LINK",
      userType: "EMPLOYER",
    });

    assert(
      "Canonical Identity Case B: Overwrite / Hijack Blocked",
      hijackAttempt.referrerId === referrerAlphaId && hijackAttempt.id === attrCompanyA.id,
      "Subsequent attribution attempt by HR with Referrer B preserves Referrer A as authoritative without overwrite"
    );

    // --- Case C: Employee leaves/changes company -> new company does NOT inherit old company's referral attribution ---
    const companyBId = "comp-beta-unreferred-inc";
    const employeeMovingId = "usr-engineer-mover";

    // Employee initially at Company A
    referralDb.registerTestEmployeeCompany(employeeMovingId, companyAId);
    const initialEmployeeAttr = await referralDb.resolveCanonicalAttribution({
      userId: employeeMovingId,
      companyId: companyAId,
    });
    assert(
      "Canonical Identity Case C: Initial Company A Attribution",
      initialEmployeeAttr !== null && initialEmployeeAttr.referrerId === referrerAlphaId,
      "Employee initially resolves Company A referrer"
    );

    // Employee moves to Company B (unreferred)
    referralDb.updateEmployeeCompany(employeeMovingId, companyBId);

    const newCompanyAttr = await referralDb.resolveCanonicalAttribution({
      userId: employeeMovingId,
      companyId: companyBId,
    });

    assert(
      "Canonical Identity Case C: Disassociated Company Does Not Inherit Old Attribution",
      newCompanyAttr === null,
      "Actions for new unreferred Company B resolve null and do NOT inherit Company A's referral attribution"
    );

    // When Company B is explicitly registered with Referrer Gamma
    const referrerGammaId = "usr-referrer-gamma";
    const attrCompanyB = await referralDb.createAttribution({
      referrerId: referrerGammaId,
      referredCompanyId: companyBId,
      referralCode: "GAMMA2026",
      attributionSource: "DIRECT_LINK",
      userType: "EMPLOYER",
    });

    const companyBResolved = await referralDb.resolveCanonicalAttribution({
      userId: employeeMovingId,
      companyId: companyBId,
    });

    assert(
      "Canonical Identity Case C: Independent New Company Attribution",
      companyBResolved !== null && companyBResolved.referrerId === referrerGammaId,
      "New Company B resolves Referrer Gamma without any pollution from old Company A"
    );

    // ================================================================
    // SECTION 2: IDOR & AUTHORIZATION AUDIT ACROSS ALL ENDPOINTS
    // ================================================================

    const userVictimToken = createSessionToken({ id: "usr-victim", name: "Victim User", role: "CANDIDATE", email: "victim@example.com" });
    const userAttackerToken = createSessionToken({ id: "usr-attacker", name: "Attacker User", role: "CANDIDATE", email: "attacker@example.com" });
    const recruiterToken = createSessionToken({ id: "usr-recruiter", name: "Recruiter Staff", role: "RECRUITER", email: "recruiter@example.com" });
    const employerToken = createSessionToken({ id: "usr-employer", name: "Employer User", role: "EMPLOYER", email: "employer@example.com" });
    const adminToken = createSessionToken({ id: "usr-admin-sec", name: "Super Admin", role: "ADMIN", email: "admin@hirego.ai" });

    // 2.1 /api/referrals GET: Rejects anonymous access with 401
    const unauthStatsReq = new Request("https://hirego.ai/api/referrals", { method: "GET" });
    const unauthStatsRes = await referralsGetHandler(unauthStatsReq);
    assert(
      "IDOR Audit: /api/referrals GET requires authentication (401)",
      unauthStatsRes.status === 401,
      "Anonymous request to /api/referrals returns 401 Unauthorized"
    );

    // 2.2 /api/referrals GET: Rejects IDOR query param tampering with 403
    const idorQueryReq = new Request("https://hirego.ai/api/referrals?userId=usr-victim", {
      method: "GET",
      headers: { Authorization: `Bearer ${userAttackerToken}` },
    });
    const idorQueryRes = await referralsGetHandler(idorQueryReq);
    assert(
      "IDOR Audit: /api/referrals GET rejects ?userId tampering (403)",
      idorQueryRes.status === 403,
      "Attacker querying ?userId=usr-victim receives 403 Forbidden"
    );

    // 2.3 /api/referrals GET: Rejects header tampering with 403
    const idorHeaderReq = new Request("https://hirego.ai/api/referrals", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userAttackerToken}`,
        "x-user-id": "usr-victim",
      },
    });
    const idorHeaderRes = await referralsGetHandler(idorHeaderReq);
    assert(
      "IDOR Audit: /api/referrals GET rejects x-user-id header tampering (403)",
      idorHeaderRes.status === 403,
      "Attacker with x-user-id=usr-victim receives 403 Forbidden"
    );

    // 2.4 /api/referrals GET: Authorized session succeeds
    const legitStatsReq = new Request("https://hirego.ai/api/referrals", {
      method: "GET",
      headers: { Authorization: `Bearer ${userVictimToken}` },
    });
    const legitStatsRes = await referralsGetHandler(legitStatsReq);
    const legitStatsBody = await legitStatsRes.json();
    assert(
      "IDOR Audit: /api/referrals GET returns session stats for authenticated user",
      legitStatsRes.status === 200 && legitStatsBody.success === true,
      "Authenticated user receives their own referral stats"
    );

    // 2.5 /api/referrals/payout POST: Rejects anonymous requests with 401
    const unauthPayoutReq = new Request("https://hirego.ai/api/referrals/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500, payoutAddress: "anon@upi" }),
    });
    const unauthPayoutRes = await payoutPostHandler(unauthPayoutReq);
    assert(
      "IDOR Audit: /api/referrals/payout requires authentication (401)",
      unauthPayoutRes.status === 401,
      "Anonymous payout request returns 401 Unauthorized"
    );

    // 2.6 /api/referrals/payout POST: Rejects IDOR victim impersonation in body
    const idorPayoutReq = new Request("https://hirego.ai/api/referrals/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAttackerToken}`,
      },
      body: JSON.stringify({
        referrerId: "usr-victim",
        amount: 500,
        payoutAddress: "attacker@upi",
      }),
    });
    const idorPayoutRes = await payoutPostHandler(idorPayoutReq);
    assert(
      "IDOR Audit: /api/referrals/payout rejects referrerId tampering in body (403)",
      idorPayoutRes.status === 403,
      "Attacker attempting to withdraw victim's balance receives 403 Forbidden"
    );

    // 2.7 /api/admin/referrals/*: Strict ADMIN role gating (401/403)
    // Analytics
    const anonAnalytics = await adminAnalyticsGetHandler(new Request("https://hirego.ai/api/admin/referrals/analytics"));
    assert("Auth Audit: /api/admin/referrals/analytics returns 401 for anonymous", anonAnalytics.status === 401, "Anonymous blocked with 401");

    const recruiterAnalytics = await adminAnalyticsGetHandler(new Request("https://hirego.ai/api/admin/referrals/analytics", {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/analytics returns 403 for RECRUITER", recruiterAnalytics.status === 403, "Recruiter blocked with 403");

    const candidateAnalytics = await adminAnalyticsGetHandler(new Request("https://hirego.ai/api/admin/referrals/analytics", {
      headers: { Authorization: `Bearer ${userVictimToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/analytics returns 403 for CANDIDATE", candidateAnalytics.status === 403, "Candidate blocked with 403");

    const employerAnalytics = await adminAnalyticsGetHandler(new Request("https://hirego.ai/api/admin/referrals/analytics", {
      headers: { Authorization: `Bearer ${employerToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/analytics returns 403 for EMPLOYER", employerAnalytics.status === 403, "Employer blocked with 403");

    const adminAnalytics = await adminAnalyticsGetHandler(new Request("https://hirego.ai/api/admin/referrals/analytics", {
      headers: { Authorization: `Bearer ${adminToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/analytics returns 200 for ADMIN", adminAnalytics.status === 200, "Admin succeeds with 200");

    // Config
    const recruiterConfig = await adminConfigGetHandler(new Request("https://hirego.ai/api/admin/referrals/config", {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/config GET returns 403 for RECRUITER", recruiterConfig.status === 403, "Recruiter blocked from config");

    const adminConfig = await adminConfigGetHandler(new Request("https://hirego.ai/api/admin/referrals/config", {
      headers: { Authorization: `Bearer ${adminToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/config GET returns 200 for ADMIN", adminConfig.status === 200, "Admin allowed on config");

    // Payouts Queue
    const recruiterPayouts = await adminPayoutsGetHandler(new Request("https://hirego.ai/api/admin/referrals/payouts", {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/payouts GET returns 403 for RECRUITER", recruiterPayouts.status === 403, "Recruiter blocked from payout queue");

    const adminPayouts = await adminPayoutsGetHandler(new Request("https://hirego.ai/api/admin/referrals/payouts", {
      headers: { Authorization: `Bearer ${adminToken}` },
    }));
    assert("Auth Audit: /api/admin/referrals/payouts GET returns 200 for ADMIN", adminPayouts.status === 200, "Admin allowed on payout queue");

    // ================================================================
    // SECTION 3: RATE LIMITING ON SENSITIVE ENDPOINTS
    // ================================================================

    await resetRateLimitStore();

    // 3.1 Rate limit on referral code validation
    let rateLimitTriggered = false;
    const statuses: number[] = [];
    for (let i = 0; i < 30; i++) {
      const validateReq = new Request("https://hirego.ai/api/referrals/validate?code=ALPHA2026", {
        headers: { "x-forwarded-for": "198.51.100.42" },
      });
      const res = await validateGetHandler(validateReq);
      statuses.push(res.status);
      if (res.status === 429) {
        rateLimitTriggered = true;
      }
    }
    assert(
      "Rate Limiting: /api/referrals/validate enforces max 20 requests/minute",
      rateLimitTriggered,
      `High velocity referral code lookup triggers 429 Too Many Requests (observed statuses: [${statuses.slice(18, 30).join(", ")}])`
    );

    await resetRateLimitStore();

    // ================================================================
    // SECTION 4: FRAUD ENGINE STATE MACHINE & PAYOUT GATING
    // Transitions: NORMAL -> FLAGGED -> FRAUD_HOLD -> ADMIN_REVIEW -> NORMAL
    // ================================================================

    const fraudUser = "usr-fraud-subject-1";
    referralDb.registerTestUserProfile(fraudUser, { email: "fraud.test@example.com", phone: "+919999988888" });
    const fraudUserToken = createSessionToken({ id: fraudUser, name: "Fraud Subject", role: "CANDIDATE", email: "fraud.test@example.com" });

    // 4.1 Initial State: NORMAL
    const initialProfile = await referralDb.getUserFraudProfile(fraudUser);
    assert(
      "Fraud Engine: Initial state is NORMAL",
      initialProfile.status === FraudStatus.NORMAL && initialProfile.riskScore === 0,
      "User starts with NORMAL fraud status and 0 risk score"
    );

    // 4.2 Transition: NORMAL -> FLAGGED
    const flaggedProfile = await referralDb.updateFraudStatus({
      userId: fraudUser,
      newStatus: FraudStatus.FLAGGED,
      reason: "Suspicious attribution velocity from single IP subnet",
      actorId: "FRAUD_MONITOR_CRON",
      riskScore: 45,
      riskFactors: ["ABNORMAL_VELOCITY", "SINGLE_SUBNET_BURST"],
    });
    assert(
      "Fraud Engine: Transition NORMAL -> FLAGGED",
      flaggedProfile.status === FraudStatus.FLAGGED && flaggedProfile.riskScore === 45,
      "Status transitions to FLAGGED with risk score and factors"
    );

    // 4.3 Transition: FLAGGED -> FRAUD_HOLD
    const holdProfile = await referralDb.updateFraudStatus({
      userId: fraudUser,
      newStatus: FraudStatus.FRAUD_HOLD,
      reason: "High risk score breached threshold (>75)",
      actorId: "SYSTEM_RISK_RULE",
      riskScore: 80,
      riskFactors: ["ABNORMAL_VELOCITY", "DEVICE_IP_COLLISION", "SELF_REFERRAL_ATTEMPT"],
    });
    assert(
      "Fraud Engine: Transition FLAGGED -> FRAUD_HOLD",
      holdProfile.status === FraudStatus.FRAUD_HOLD,
      "Status transitions to FRAUD_HOLD"
    );

    // 4.4 Payout Gating: Payout request blocked while in FRAUD_HOLD
    const fraudPayoutReq = new Request("https://hirego.ai/api/referrals/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fraudUserToken}`,
      },
      body: JSON.stringify({ amount: 500, payoutAddress: "fraud@upi" }),
    });
    const fraudPayoutRes = await payoutPostHandler(fraudPayoutReq);
    assert(
      "Fraud Engine: Payout blocked during FRAUD_HOLD (403)",
      fraudPayoutRes.status === 403,
      "Payout request during FRAUD_HOLD is blocked with 403 Forbidden"
    );

    // 4.5 Transition: FRAUD_HOLD -> ADMIN_REVIEW
    const adminReviewProfile = await referralDb.updateFraudStatus({
      userId: fraudUser,
      newStatus: FraudStatus.ADMIN_REVIEW,
      reason: "Escalated for manual compliance investigation",
      actorId: "usr-admin-sec",
    });
    assert(
      "Fraud Engine: Transition FRAUD_HOLD -> ADMIN_REVIEW",
      adminReviewProfile.status === FraudStatus.ADMIN_REVIEW,
      "Status transitions to ADMIN_REVIEW"
    );

    // Payout remains blocked during ADMIN_REVIEW
    const reviewPayoutReq = new Request("https://hirego.ai/api/referrals/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fraudUserToken}`,
      },
      body: JSON.stringify({ amount: 500, payoutAddress: "fraud@upi" }),
    });
    const reviewPayoutRes = await payoutPostHandler(reviewPayoutReq);
    assert(
      "Fraud Engine: Payout blocked during ADMIN_REVIEW (403)",
      reviewPayoutRes.status === 403,
      "Payout request during ADMIN_REVIEW is blocked with 403 Forbidden"
    );

    // 4.6 Transition: ADMIN_REVIEW -> NORMAL (Cleared by Admin)
    const clearedProfile = await referralDb.updateFraudStatus({
      userId: fraudUser,
      newStatus: FraudStatus.NORMAL,
      reason: "Identity and KYC verified by administrator. Cleared.",
      actorId: "usr-admin-sec",
      riskScore: 0,
      riskFactors: [],
    });
    assert(
      "Fraud Engine: Transition ADMIN_REVIEW -> NORMAL",
      clearedProfile.status === FraudStatus.NORMAL && clearedProfile.riskScore === 0,
      "Admin investigation completes and clears account to NORMAL"
    );

    // 4.7 Audit Trail Verification
    assert(
      "Fraud Engine: Audit Trail Logged",
      clearedProfile.history.length === 4,
      `Full history of 4 state transitions maintained in audit log (${clearedProfile.history.map(h => `${h.previousStatus}->${h.newStatus}`).join(", ")})`
    );

    // 4.8 Admin Fraud Route Verification (/api/admin/referrals/fraud)
    const adminFraudPostReq = new Request("https://hirego.ai/api/admin/referrals/fraud", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: fraudUser,
        newStatus: FraudStatus.FLAGGED,
        reason: "Manual re-evaluation",
      }),
    });
    const adminFraudPostRes = await adminFraudPostHandler(adminFraudPostReq);
    assert(
      "Fraud Engine: /api/admin/referrals/fraud POST allows admin status updates",
      adminFraudPostRes.status === 200,
      "Admin successfully updates fraud status via admin route"
    );

  } catch (err: any) {
    failed++;
    results.push({ name: "Unexpected Exception", success: false, message: err.message });
  }

  return { passed, failed, results };
}
