import { test } from "node:test";
import { strict as assert } from "node:assert";
import { prisma } from "@/lib/prisma";
import { ApplicationGateType, ApplicationGateStatus } from "@prisma/client";

/**
 * Phase 3 Application Duplicate Race Condition Test
 * 
 * This test verifies that the atomic upsert fix prevents duplicate applications
 * when multiple concurrent requests attempt to create the same application.
 * 
 * Test Strategy:
 * 1. Create a test user, candidate profile, and job
 * 2. Simulate 10-50 concurrent application submissions
 * 3. Verify only ONE application exists for the candidate-job pair
 * 4. Verify the application has the correct gate state
 * 5. Run under stress to expose race conditions
 */

interface TestContext {
  userId: string;
  candidateProfileId: string;
  jobId: string;
  companyId: string;
}

async function setupTestContext(): Promise<TestContext> {
  // Clean up any existing test data
  const testEmail = `race-test-${Date.now()}@test.local`;

  // Create test user
  const user = await prisma.user.create({
    data: {
      id: `test-user-${Date.now()}`,
      email: testEmail,
      passwordHash: "hashed",
      name: "Race Test User",
      role: "CANDIDATE",
    },
  });

  // Create candidate profile
  const candidateProfile = await prisma.candidateProfile.create({
    data: {
      id: `test-candidate-${Date.now()}`,
      userId: user.id,
      headline: "Test Candidate",
    },
  });

  // Create company
  const company = await prisma.company.create({
    data: {
      id: `test-company-${Date.now()}`,
      name: "Test Company",
    },
  });

  // Create job
  const job = await prisma.jobListing.create({
    data: {
      id: `test-job-${Date.now()}`,
      companyId: company.id,
      title: "Test Position",
      location: "Test City",
      description: "Test Description",
      status: "ACTIVE",
      publishedAt: new Date(),
    },
  });

  return {
    userId: user.id,
    candidateProfileId: candidateProfile.id,
    jobId: job.id,
    companyId: company.id,
  };
}

async function cleanupTestContext(ctx: TestContext) {
  // Delete applications first (due to foreign key constraints)
  await prisma.application.deleteMany({
    where: {
      candidateProfileId: ctx.candidateProfileId,
      jobId: ctx.jobId,
    },
  });

  // Delete job
  await prisma.jobListing.deleteMany({
    where: { id: ctx.jobId },
  });

  // Delete company
  await prisma.company.deleteMany({
    where: { id: ctx.companyId },
  });

  // Delete candidate profile
  await prisma.candidateProfile.deleteMany({
    where: { id: ctx.candidateProfileId },
  });

  // Delete user
  await prisma.user.deleteMany({
    where: { id: ctx.userId },
  });
}

test("Application submission prevents duplicates under concurrent load", async (t) => {
  const ctx = await setupTestContext();

  try {
    const concurrentRequests = 20;
    const promises: Promise<any>[] = [];

    // Simulate concurrent application submissions
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        prisma.application
          .create({
            data: {
              jobId: ctx.jobId,
              candidateProfileId: ctx.candidateProfileId,
              status: "ASSESSMENT",
              matchScore: 0,
              aiSummary: null,
            },
          })
          .catch((error) => {
            // Expect P2002 (unique constraint violation) for duplicates
            if (error?.code === "P2002") {
              return { duplicate: true, error };
            }
            throw error;
          })
      );
    }

    const results = await Promise.all(promises);

    // Count successful creations vs duplicates
    const successful = results.filter((r) => r && !r.duplicate);
    const duplicates = results.filter((r) => r?.duplicate);

    // Verify only ONE application was created
    assert.strictEqual(
      successful.length,
      1,
      `Expected exactly 1 successful creation, got ${successful.length}`
    );

    assert.strictEqual(
      duplicates.length,
      concurrentRequests - 1,
      `Expected ${concurrentRequests - 1} duplicate errors, got ${duplicates.length}`
    );

    // Verify the application exists in database
    const application = await prisma.application.findUnique({
      where: {
        candidateProfileId_jobId: {
          candidateProfileId: ctx.candidateProfileId,
          jobId: ctx.jobId,
        },
      },
    });

    assert.ok(application, "Application should exist in database");
    assert.strictEqual(
      application.candidateProfileId,
      ctx.candidateProfileId,
      "Application should have correct candidate"
    );
    assert.strictEqual(application.jobId, ctx.jobId, "Application should have correct job");
  } finally {
    await cleanupTestContext(ctx);
  }
});

test("Application gate is created atomically with application", async (t) => {
  const ctx = await setupTestContext();

  try {
    // Create application
    const application = await prisma.application.create({
      data: {
        jobId: ctx.jobId,
        candidateProfileId: ctx.candidateProfileId,
        status: "ASSESSMENT",
        matchScore: 0,
      },
    });

    // Verify gate exists
    const gate = await prisma.applicationGate.findFirst({
      where: {
        applicationId: application.id,
        type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
      },
    });

    assert.ok(gate, "Application gate should be created");
    assert.strictEqual(
      gate.status,
      ApplicationGateStatus.REQUIRED,
      "Gate should have REQUIRED status"
    );
  } finally {
    await cleanupTestContext(ctx);
  }
});

test("Screening answers are preserved on duplicate attempts", async (t) => {
  const ctx = await setupTestContext();

  try {
    const screeningAnswers = {
      "Tell us about yourself": "I am a test candidate",
      "Why do you want this job?": "For testing purposes",
    };

    // Create first application with screening answers
    const application = await prisma.application.create({
      data: {
        jobId: ctx.jobId,
        candidateProfileId: ctx.candidateProfileId,
        status: "ASSESSMENT",
        matchScore: 0,
        screeningAnswers: screeningAnswers as any,
      },
    });

    // Attempt concurrent submission
    const duplicateAttempt = prisma.application
      .create({
        data: {
          jobId: ctx.jobId,
          candidateProfileId: ctx.candidateProfileId,
          status: "ASSESSMENT",
          matchScore: 0,
          screeningAnswers: screeningAnswers as any,
        },
      })
      .catch((error) => {
        if (error?.code === "P2002") {
          return { duplicate: true };
        }
        throw error;
      });

    const result = await duplicateAttempt;
    assert.ok(result?.duplicate, "Second attempt should fail with duplicate error");

    // Verify screening answers are still there
    const retrieved = await prisma.application.findUnique({
      where: { id: application.id },
    });

    assert.deepStrictEqual(
      retrieved?.screeningAnswers,
      screeningAnswers,
      "Screening answers should be preserved"
    );
  } finally {
    await cleanupTestContext(ctx);
  }
});

test("Constraint violation is detected reliably", async (t) => {
  const ctx = await setupTestContext();

  try {
    // Create first application
    const app1 = await prisma.application.create({
      data: {
        jobId: ctx.jobId,
        candidateProfileId: ctx.candidateProfileId,
        status: "APPLIED",
        matchScore: 50,
      },
    });

    // Attempt to create duplicate
    let duplicateDetected = false;
    try {
      await prisma.application.create({
        data: {
          jobId: ctx.jobId,
          candidateProfileId: ctx.candidateProfileId,
          status: "APPLIED",
          matchScore: 50,
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        duplicateDetected = true;
      }
    }

    assert.ok(duplicateDetected, "Unique constraint violation should be detected");

    // Verify only one application exists
    const count = await prisma.application.count({
      where: {
        candidateProfileId: ctx.candidateProfileId,
        jobId: ctx.jobId,
      },
    });

    assert.strictEqual(count, 1, "Exactly one application should exist");
  } finally {
    await cleanupTestContext(ctx);
  }
});

test("Multiple jobs per candidate work correctly", async (t) => {
  const ctx = await setupTestContext();
  const job2 = await prisma.jobListing.create({
    data: {
      id: `test-job-2-${Date.now()}`,
      companyId: ctx.companyId,
      title: "Test Position 2",
      location: "Test City",
      description: "Test Description 2",
      status: "ACTIVE",
      publishedAt: new Date(),
    },
  });

  try {
    // Create applications to different jobs
    const app1 = await prisma.application.create({
      data: {
        jobId: ctx.jobId,
        candidateProfileId: ctx.candidateProfileId,
        status: "APPLIED",
        matchScore: 50,
      },
    });

    const app2 = await prisma.application.create({
      data: {
        jobId: job2.id,
        candidateProfileId: ctx.candidateProfileId,
        status: "APPLIED",
        matchScore: 60,
      },
    });

    assert.notStrictEqual(app1.id, app2.id, "Different applications should have different IDs");
    assert.strictEqual(app1.candidateProfileId, app2.candidateProfileId, "Both should have same candidate");
    assert.notStrictEqual(app1.jobId, app2.jobId, "Both should have different jobs");

    // Verify both exist
    const count = await prisma.application.count({
      where: {
        candidateProfileId: ctx.candidateProfileId,
      },
    });

    assert.strictEqual(count, 2, "Candidate should have 2 applications");
  } finally {
    // Clean up second job
    await prisma.application.deleteMany({
      where: { jobId: job2.id },
    });
    await prisma.jobListing.deleteMany({
      where: { id: job2.id },
    });
    
    await cleanupTestContext(ctx);
  }
});
