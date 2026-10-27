import { test } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET as roomCredentialsHandler } from "@/app/api/employer/interviews/[id]/room-credentials/route";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * P1.3 Interview Room Authorization Tests
 * 
 * TC-P1.3.1: Authorized user gets credentials
 * TC-P1.3.2: Unauthorized user gets 403
 * TC-P1.3.3: Non-existent interview gets 404
 * TC-P1.3.4: Credentials from API (not hard-coded)
 */

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    testsFailed++;
  }
}

export async function runInterviewRoomAuthorizationTests() {
  console.log("\n=== Interview Room Authorization Tests ===\n");

  // Check if database is available
  let dbAvailable = false;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbAvailable = true;
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      console.log("⊘ Skipped: database unavailable (set HIREGO_TEST_DATABASE=1)");
      return { passed: 0, failed: 0 };
    }
    throw new Error("Database not available");
  }

  if (!dbAvailable) {
    return { passed: 0, failed: 0 };
  }

  const testId = crypto.randomUUID().slice(0, 8);

  // TC-P1.3.1: Authorized user gets credentials
  await runTest("TC-P1.3.1: Authorized user gets credentials", async () => {
    // Create test company, user, job, and interview
    const company = await prisma.company.create({
      data: {
        name: `Test Company ${testId}`,
        website: "http://test.example.com",
      },
    });

    const employer = await prisma.user.create({
      data: {
        email: `employer-${testId}@test.com`,
        name: "Test Employer",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });

    await prisma.employerProfile.create({
      data: {
        userId: employer.id,
        companyId: company.id,
      },
    });

    const candidate = await prisma.user.create({
      data: {
        email: `candidate-${testId}@test.com`,
        name: "Test Candidate",
        role: "CANDIDATE",
        emailVerified: true,
      },
    });

    const candidateProfile = await prisma.candidateProfile.create({
      data: {
        userId: candidate.id,
      },
    });

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: `Test Job ${testId}`,
        status: "OPEN",
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateProfileId: candidateProfile.id,
        status: "AI_INTERVIEW",
      },
    });

    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMins: 30,
        aiFeedback: JSON.stringify({
          round: "Technical Interview",
          mode: "ONLINE",
          roomId: `room-${testId}`,
        }),
      },
    });

    // Create a round with the employer as an interviewer
    const round = await prisma.interviewRound.create({
      data: {
        jobId: job.id,
        name: "Technical Round",
      },
    });

    const roundProgress = await prisma.interviewRoundProgress.create({
      data: {
        interviewId: interview.id,
        roundId: round.id,
        status: "SCHEDULED",
      },
    });

    await prisma.roundInterviewer.create({
      data: {
        roundId: round.id,
        userId: employer.id,
        required: true,
      },
    });

    // Create session token for employer
    const token = await createSessionToken({ id: employer.id, email: employer.email, role: "EMPLOYER", name: employer.name });

    // Call the handler
    const req = new NextRequest(`http://localhost/api/employer/interviews/${interview.id}/room-credentials`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const res = await roomCredentialsHandler(req, { params: Promise.resolve({ id: interview.id }) });
    const json = await res.json();

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(json.success, true, "Response should indicate success");
    assert(json.roomId, "Response should contain roomId");
    assert(json.credentials, "Response should contain credentials");
    assert(Array.isArray(json.credentials.iceServers), "credentials.iceServers should be an array");
    assert(json.credentials.iceServers.length > 0, "iceServers array should not be empty");
  });

  // TC-P1.3.2: Unauthorized user gets 403 (user from different company)
  await runTest("TC-P1.3.2: Unauthorized user gets 403 (different company)", async () => {
    // Create test companies
    const company1 = await prisma.company.create({
      data: {
        name: `Company 1 ${testId}`,
        website: "http://company1.example.com",
      },
    });

    const company2 = await prisma.company.create({
      data: {
        name: `Company 2 ${testId}`,
        website: "http://company2.example.com",
      },
    });

    // Create employer in company1
    const employer1 = await prisma.user.create({
      data: {
        email: `employer1-${testId}@test.com`,
        name: "Employer 1",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });

    await prisma.employerProfile.create({
      data: {
        userId: employer1.id,
        companyId: company1.id,
      },
    });

    // Create employer in company2
    const employer2 = await prisma.user.create({
      data: {
        email: `employer2-${testId}@test.com`,
        name: "Employer 2",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });

    await prisma.employerProfile.create({
      data: {
        userId: employer2.id,
        companyId: company2.id,
      },
    });

    // Create candidate and interview in company1
    const candidate = await prisma.user.create({
      data: {
        email: `candidate2-${testId}@test.com`,
        name: "Test Candidate 2",
        role: "CANDIDATE",
        emailVerified: true,
      },
    });

    const candidateProfile = await prisma.candidateProfile.create({
      data: {
        userId: candidate.id,
      },
    });

    const job = await prisma.job.create({
      data: {
        companyId: company1.id,
        title: `Job in Company 1 ${testId}`,
        status: "OPEN",
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateProfileId: candidateProfile.id,
        status: "AI_INTERVIEW",
      },
    });

    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMins: 30,
      },
    });

    // Create session token for employer2 (from company2, not authorized)
    const token = await createSessionToken({ id: employer2.id, email: employer2.email, role: "EMPLOYER", name: employer2.name });

    // Try to access interview from company1
    const req = new NextRequest(`http://localhost/api/employer/interviews/${interview.id}/room-credentials`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const res = await roomCredentialsHandler(req, { params: Promise.resolve({ id: interview.id }) });
    const json = await res.json();

    assert.strictEqual(res.status, 404, `Expected 404, got ${res.status}`);
    assert.strictEqual(json.success, false, "Response should indicate failure");
  });

  // TC-P1.3.3: Non-existent interview gets 404
  await runTest("TC-P1.3.3: Non-existent interview gets 404", async () => {
    const company = await prisma.company.create({
      data: {
        name: `Company ${testId}`,
        website: "http://example.com",
      },
    });

    const employer = await prisma.user.create({
      data: {
        email: `employer3-${testId}@test.com`,
        name: "Employer",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });

    await prisma.employerProfile.create({
      data: {
        userId: employer.id,
        companyId: company.id,
      },
    });

    const token = await createSessionToken({ id: employer.id, email: employer.email, role: "EMPLOYER", name: employer.name });
    const fakeId = crypto.randomUUID();

    const req = new NextRequest(`http://localhost/api/employer/interviews/${fakeId}/room-credentials`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const res = await roomCredentialsHandler(req, { params: Promise.resolve({ id: fakeId }) });
    const json = await res.json();

    assert.strictEqual(res.status, 404, `Expected 404, got ${res.status}`);
    assert.strictEqual(json.success, false, "Response should indicate failure");
  });

  // TC-P1.3.4: Credentials from API (not hard-coded)
  await runTest("TC-P1.3.4: Credentials from API (not hard-coded)", async () => {
    // Create test setup
    const company = await prisma.company.create({
      data: {
        name: `Test Company 4 ${testId}`,
        website: "http://test4.example.com",
      },
    });

    const employer = await prisma.user.create({
      data: {
        email: `employer4-${testId}@test.com`,
        name: "Test Employer 4",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });

    await prisma.employerProfile.create({
      data: {
        userId: employer.id,
        companyId: company.id,
      },
    });

    const candidate = await prisma.user.create({
      data: {
        email: `candidate4-${testId}@test.com`,
        name: "Test Candidate 4",
        role: "CANDIDATE",
        emailVerified: true,
      },
    });

    const candidateProfile = await prisma.candidateProfile.create({
      data: {
        userId: candidate.id,
      },
    });

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: `Test Job 4 ${testId}`,
        status: "OPEN",
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateProfileId: candidateProfile.id,
        status: "AI_INTERVIEW",
      },
    });

    // Create interview with roomId in metadata
    const customRoomId = `custom-room-${testId}`;
    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMins: 30,
        aiFeedback: JSON.stringify({
          round: "Technical Interview",
          roomId: customRoomId,
        }),
      },
    });

    // Create round with employer
    const round = await prisma.interviewRound.create({
      data: {
        jobId: job.id,
        name: "Technical Round",
      },
    });

    await prisma.interviewRoundProgress.create({
      data: {
        interviewId: interview.id,
        roundId: round.id,
        status: "SCHEDULED",
      },
    });

    await prisma.roundInterviewer.create({
      data: {
        roundId: round.id,
        userId: employer.id,
        required: true,
      },
    });

    const token = await createSessionToken({ id: employer.id, email: employer.email, role: "EMPLOYER", name: employer.name });

    const req = new NextRequest(`http://localhost/api/employer/interviews/${interview.id}/room-credentials`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const res = await roomCredentialsHandler(req, { params: Promise.resolve({ id: interview.id }) });
    const json = await res.json();

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(json.roomId, customRoomId, `Expected roomId to be ${customRoomId}, got ${json.roomId}`);
    assert(json.credentials.iceServers, "Should contain credentials with iceServers");
    // Verify credentials are dynamic (contain STUN server from API)
    assert(json.credentials.iceServers.some(server => server.urls.includes("stun")), "Should contain STUN server from API configuration");
  });

  console.log(`\n=== Results: ${testsPassed} passed, ${testsFailed} failed ===\n`);
  return { passed: testsPassed, failed: testsFailed };
}

// Run tests if executed directly
if (process.env.HIREGO_TEST_DATABASE === "1") {
  runInterviewRoomAuthorizationTests().catch(console.error);
}
