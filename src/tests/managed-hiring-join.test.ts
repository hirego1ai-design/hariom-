import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TestResult } from "./suite.test";
import { POST as joinHandler } from "@/app/api/employer/managed-hiring/join/route";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth";

export async function runManagedHiringJoinTests(): Promise<{
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
      results.push({ name, category: "Managed Hiring Join", passed: true, message: `PASS: ${message}` });
    } else {
      failed++;
      results.push({ name, category: "Managed Hiring Join", passed: false, message: `FAIL: ${message}` });
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
        name: "Managed hiring join integration suite",
        category: "Managed Hiring Join",
        passed: false,
        skipped: true,
        message: "SKIPPED outside CI: database unavailable (set HIREGO_TEST_DATABASE=1)",
      });
      return { passed, failed, results };
    }
  }

  if (dbAvailable) {
    const testId = crypto.randomUUID().slice(0, 8);

    // Helper to call join API
    const callJoinApi = async (sessionToken: string, body: any) => {
      const req = new NextRequest("http://localhost/api/employer/managed-hiring/join", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      });
      const res = await joinHandler(req);
      const json = await res.json();
      return { status: res.status, json };
    };

    let companyA: any = null;
    let companyB: any = null;
    let employerA: any = null;
    let recruiterA: any = null;
    let candidateUser: any = null;
    let candidateProfile: any = null;
    let jobListing: any = null;
    let application: any = null;
    let agreementA: any = null;
    let agreementB: any = null;

    try {
      // Setup Companies
      companyA = await prisma.company.create({
        data: { name: `Company A ${testId}` },
      });
      companyB = await prisma.company.create({
        data: { name: `Company B ${testId}` },
      });

      // Users
      employerA = await prisma.user.create({
        data: {
          email: `employer-a-${testId}@hirego.test`,
          name: "Employer A",
          passwordHash: "dummy",
          role: "EMPLOYER",
        },
      });
      await prisma.employerProfile.create({
        data: { userId: employerA.id, companyId: companyA.id },
      });

      recruiterA = await prisma.user.create({
        data: {
          email: `recruiter-a-${testId}@hirego.test`,
          name: "Recruiter A",
          passwordHash: "dummy",
          role: "RECRUITER",
        },
      });
      await prisma.employerProfile.create({
        data: { userId: recruiterA.id, companyId: companyA.id },
      });

      candidateUser = await prisma.user.create({
        data: {
          email: `candidate-${testId}@hirego.test`,
          name: "Candidate",
          passwordHash: "dummy",
          role: "CANDIDATE",
        },
      });
      candidateProfile = await prisma.candidateProfile.create({
        data: { userId: candidateUser.id },
      });

      // Job Listing and Application
      jobListing = await prisma.jobListing.create({
        data: {
          companyId: companyA.id,
          title: "Hardened Staff Engineer",
          location: "Remote",
          description: "Production verification expert",
        },
      });

      application = await prisma.application.create({
        data: {
          candidateProfileId: candidateProfile.id,
          jobId: jobListing.id,
          status: "SHORTLISTED",
          annualCtc: 2000000,
        },
      });

      await prisma.offer.create({
        data: {
          applicationId: application.id,
          companyId: companyA.id,
          createdById: employerA.id,
          title: "Accepted CI Offer",
          compensationAmount: 2000000,
          currency: "INR",
          expiresAt: new Date(Date.now() + 7 * 86400000),
          terms: { source: "managed-hiring-join-test" },
          status: "ACCEPTED",
          sentAt: new Date(Date.now() - 2 * 3600000),
          acceptedAt: new Date(Date.now() - 3600000),
        },
      });

      // Agreements
      agreementA = await prisma.commercialAgreement.create({
        data: {
          agreementNumber: `AGR-A-${testId}`,
          companyId: companyA.id,
          companyName: companyA.name,
          clientLegalName: companyA.name,
          contactPerson: "Contact A",
          clientEmail: "client@hirego.test",
          clientPhone: "12345",
          feeType: "PERCENTAGE",
          feeValue: 10.0, // 10% placement fee
          taxRatePct: 18.0, // 18% GST
          invoiceRule: "DAY_25",
          signedAt: new Date(Date.now() - 2 * 86400000),
          validityStartDate: new Date(Date.now() - 30 * 86400000),
          status: "ACTIVE",
          validityEndDate: new Date(Date.now() + 365 * 86400000),
        },
      });

      agreementB = await prisma.commercialAgreement.create({
        data: {
          agreementNumber: `AGR-B-${testId}`,
          companyId: companyB.id,
          companyName: companyB.name,
          clientLegalName: companyB.name,
          contactPerson: "Contact B",
          clientEmail: "client@hirego.test",
          clientPhone: "12345",
          feeType: "PERCENTAGE",
          feeValue: 15.0,
          taxRatePct: 18.0,
          invoiceRule: "DAY_25",
          signedAt: new Date(Date.now() - 2 * 86400000),
          validityStartDate: new Date(Date.now() - 30 * 86400000),
          status: "ACTIVE",
          validityEndDate: new Date(Date.now() + 365 * 86400000),
        },
      });

      const tokenEmployer = createSessionToken({
        id: employerA.id,
        email: employerA.email,
        name: employerA.name,
        role: "EMPLOYER",
        sessionVersion: 0,
      });

      const tokenRecruiter = createSessionToken({
        id: recruiterA.id,
        email: recruiterA.email,
        name: recruiterA.name,
        role: "RECRUITER",
        sessionVersion: 0,
      });

      const joinedAt = new Date(Date.now() - 3600000).toISOString();
      const joiningFields = { annualCtc: 2000000, joinedAt, termsAccepted: true as const };

      // --- 1. Test Role Privilege (Recruiter Rejected) ---
      const res1 = await callJoinApi(tokenRecruiter, {
        applicationId: application.id,
        agreementId: agreementA.id,
        ...joiningFields,
      });
      assert(
        "Recruiters are forbidden from generating commercial invoices",
        res1.status === 403,
        "Recruiter request correctly rejected with 403 Forbidden"
      );

      // --- 2. Test Agreement Company Scope (Cross-Company Rejected) ---
      const res2 = await callJoinApi(tokenEmployer, {
        applicationId: application.id,
        agreementId: agreementB.id, // Agreement from Company B
        ...joiningFields,
      });
      assert(
        "Agreement from another company must be rejected",
        res2.status === 403 && res2.json.error.includes("Agreement does not belong to this company"),
        "Request correctly rejected when using agreement belonging to Company B"
      );

      // --- 3. Test Secure Financial Calculation and Idempotency ---
      const res3 = await callJoinApi(tokenEmployer, {
        applicationId: application.id,
        agreementId: agreementA.id,
        ...joiningFields,
      });

      // 10% fee on 20 Lakhs is 200,000. 18% tax on 200,000 is 36,000. Total amount: 236,000.
      const placement = res3.json.placement;
      assert(
        "Invoice fee, tax, and total amount calculated from database parameters",
        res3.status === 201 && 
        Number(placement.amount) === 200000 && 
        Number(placement.taxAmount) === 36000 && 
        Number(placement.totalAmount) === 236000,
        "Server computed invoice details securely from database records"
      );

      // Replay identical request with same idempotency key
      const res4 = await callJoinApi(tokenEmployer, {
        applicationId: application.id,
        agreementId: agreementA.id,
        ...joiningFields,
      });
      assert(
        "Idempotency: duplicate joining confirmation returns the original placement",
        res4.status === 200 && res4.json.duplicate === true && res4.json.placement.id === placement.id,
        "Application-scoped durable placement replay returns the original record"
      );

      // --- 4. Test Simultaneous Concurrent Join Requests (Promise.all) ---
      // Create a second application to test race conditions under simultaneous load
      const candidateUser2 = await prisma.user.create({
        data: {
          email: `cand2-${testId}@hirego.test`,
          name: "Concurrent Test Candidate",
          role: "CANDIDATE",
          passwordHash: "hash",
        },
      });

      const candidateProfile2 = await prisma.candidateProfile.create({
        data: {
          userId: candidateUser2.id,
          skills: ["PostgreSQL", "Concurrency"],
          experienceYears: 6,
        },
      });

      const application2 = await prisma.application.create({
        data: {
          candidateProfileId: candidateProfile2.id,
          jobId: jobListing.id,
          status: "SHORTLISTED",
          annualCtc: 3000000, // 30 Lakhs CTC
        },
      });

      await prisma.offer.create({
        data: {
          applicationId: application2.id,
          companyId: companyA.id,
          createdById: employerA.id,
          title: "Accepted Concurrent CI Offer",
          compensationAmount: 3000000,
          currency: "INR",
          expiresAt: new Date(Date.now() + 7 * 86400000),
          terms: { source: "managed-hiring-join-concurrency-test" },
          status: "ACCEPTED",
          sentAt: new Date(Date.now() - 2 * 3600000),
          acceptedAt: new Date(Date.now() - 3600000),
        },
      });

      // Dispatch 2 simultaneous requests with the exact same company and idempotencyKey
      const [concResA, concResB] = await Promise.all([
        callJoinApi(tokenEmployer, {
          applicationId: application2.id,
          agreementId: agreementA.id,
          annualCtc: 3000000,
          joinedAt,
          termsAccepted: true,
        }),
        callJoinApi(tokenEmployer, {
          applicationId: application2.id,
          agreementId: agreementA.id,
          annualCtc: 3000000,
          joinedAt,
          termsAccepted: true,
        }),
      ]);

      // Assert that both responses are controlled (one succeeded with 201/200, the other was safely handled as 409 or 200 duplicate)
      const validStatuses = [200, 201, 409];
      const has201 = concResA.status === 201 || concResB.status === 201;
      const bothControlled = validStatuses.includes(concResA.status) && validStatuses.includes(concResB.status);
      const neither500 = concResA.status !== 500 && concResB.status !== 500;

      // DAY_25 billing creates one durable placement now; invoice creation is deferred to the worker.
      const candidate2Placements = await prisma.pphPlacement.findMany({ where: { applicationId: application2.id } });

      // Verify application status is HIRED exactly once
      const app2After = await prisma.application.findUnique({
        where: { id: application2.id },
      });

      assert(
        "Simultaneous concurrent join requests produce exactly one invoice and no 500 errors",
        bothControlled && neither500 && has201 && candidate2Placements.length === 1 && app2After?.status === "HIRED",
        `Concurrent requests handled cleanly (statusA: ${concResA.status}, statusB: ${concResB.status}, placementCount: ${candidate2Placements.length})`
      );

      // Verify subsequent replay gets original invoice
      const concReplay = await callJoinApi(tokenEmployer, {
        applicationId: application2.id,
        agreementId: agreementA.id,
        annualCtc: 3000000,
        joinedAt,
        termsAccepted: true,
      });

      assert(
        "Subsequent retry after concurrent execution returns original placement",
        concReplay.status === 200 && concReplay.json.duplicate === true && concReplay.json.placement.id === candidate2Placements[0]?.id,
        "Replay returns verified original placement ID"
      );

      // Cleanup
      await prisma.pphPlacement.deleteMany({ where: { companyId: companyA.id } }).catch(() => undefined);
      await prisma.invoice.deleteMany({ where: { agreementId: { in: [agreementA.id, agreementB.id] } } }).catch(() => undefined);
      await prisma.commercialAgreement.deleteMany({ where: { id: { in: [agreementA.id, agreementB.id] } } }).catch(() => undefined);
      await prisma.application.deleteMany({ where: { id: { in: [application.id, application2.id] } } }).catch(() => undefined);
      await prisma.jobListing.delete({ where: { id: jobListing.id } }).catch(() => undefined);
      await prisma.employerProfile.deleteMany({ where: { userId: { in: [employerA.id, recruiterA.id] } } }).catch(() => undefined);
      await prisma.candidateProfile.deleteMany({ where: { id: { in: [candidateProfile.id, candidateProfile2.id] } } }).catch(() => undefined);
      await prisma.user.deleteMany({ where: { id: { in: [employerA.id, recruiterA.id, candidateUser.id, candidateUser2.id] } } }).catch(() => undefined);
      await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } }).catch(() => undefined);

    } catch (err: any) {
      assert("Managed hiring join integration suite", false, err.message || String(err));
    }
  }

  return { passed, failed, results };
}
