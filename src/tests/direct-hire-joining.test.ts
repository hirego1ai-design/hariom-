import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";
import { POST as confirmJoining } from "@/app/api/employer/joining-confirmation/route";
import type { TestResult } from "./suite.test";

export async function runDirectHireJoiningTests(): Promise<{
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    if (condition) {
      passed += 1;
      results.push({ name, category: "Direct Hire Joining", passed: true, message: `PASS: ${message}` });
    } else {
      failed += 1;
      results.push({ name, category: "Direct Hire Joining", passed: false, message: `FAIL: ${message}` });
    }
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      results.push({
        name: "Direct-hire joining integration suite",
        category: "Direct Hire Joining",
        passed: false,
        skipped: true,
        message: "SKIPPED outside CI: database unavailable (set HIREGO_TEST_DATABASE=1)",
      });
      return { passed, failed, results };
    }
  }

  const suffix = crypto.randomUUID().slice(0, 8);
  let companyId = "";
  let employerId = "";
  let candidateUserId = "";
  let candidateProfileId = "";
  let jobId = "";
  let applicationId = "";
  let offerId = "";
  let workflowId = "";

  try {
    const company = await prisma.company.create({
      data: { name: `Direct Hire Joining Test ${suffix}` },
    });
    companyId = company.id;

    const employer = await prisma.user.create({
      data: {
        email: `direct-join-employer-${suffix}@hirego.test`,
        name: "Direct Join Employer",
        passwordHash: "test-only",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });
    employerId = employer.id;
    await prisma.employerProfile.create({
      data: { userId: employer.id, companyId: company.id },
    });

    const candidateUser = await prisma.user.create({
      data: {
        email: `direct-join-candidate-${suffix}@hirego.test`,
        name: "Direct Join Candidate",
        passwordHash: "test-only",
        role: "CANDIDATE",
        emailVerified: true,
      },
    });
    candidateUserId = candidateUser.id;

    const candidate = await prisma.candidateProfile.create({
      data: { userId: candidateUser.id },
    });
    candidateProfileId = candidate.id;

    const job = await prisma.jobListing.create({
      data: {
        companyId: company.id,
        title: "Direct Hire Test Engineer",
        location: "Remote",
        description: "Disposable direct-hire joining integration test.",
        status: "ACTIVE",
      },
    });
    jobId = job.id;

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateProfileId: candidate.id,
        status: "SHORTLISTED",
      },
    });
    applicationId = application.id;

    const acceptedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const offer = await prisma.offer.create({
      data: {
        applicationId: application.id,
        companyId: company.id,
        createdById: employer.id,
        title: "Direct hire accepted offer",
        compensationAmount: 1200000,
        currency: "INR",
        expiresAt: new Date(Date.now() + 7 * 86400000),
        terms: { roleTitle: job.title, employmentType: "Full-time" },
        status: "ACCEPTED",
        sentAt: new Date(acceptedAt.getTime() - 60 * 60 * 1000),
        acceptedAt,
      },
    });
    offerId = offer.id;

    const workflow = await prisma.workflowInstance.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        candidateId: candidate.id,
        applicationId: application.id,
        workflowType: "JOINING_ONBOARDING",
        status: "RUNNING",
        currentStep: "OFFER_ACCEPTED",
        correlationId: `offer-send:${offer.id}`,
        initiatedBy: employer.id,
        checkpointState: {
          offerId: offer.id,
          candidateAccepted: true,
          acceptedAt: acceptedAt.toISOString(),
        },
      },
    });
    workflowId = workflow.id;

    const token = createSessionToken({
      id: employer.id,
      email: employer.email,
      name: employer.name,
      role: "EMPLOYER",
      sessionVersion: 0,
    });

    const callApi = async (joinedAt: string) => {
      const request = new NextRequest("http://localhost/api/employer/joining-confirmation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId: application.id,
          joinedAt,
          confirmJoined: true,
        }),
      });
      const response = await confirmJoining(request);
      return { status: response.status, body: await response.json() };
    };

    const joinedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const first = await callApi(joinedAt);
    const [updatedApplication, updatedWorkflow, updatedCandidate, placements] = await Promise.all([
      prisma.application.findUnique({ where: { id: application.id } }),
      prisma.workflowInstance.findUnique({ where: { id: workflow.id } }),
      prisma.candidateProfile.findUnique({ where: { id: candidate.id } }),
      prisma.pphPlacement.findMany({ where: { applicationId: application.id } }),
    ]);

    assert(
      "Accepted direct hire can be confirmed joined without creating PPH billing",
      first.status === 201 &&
        first.body.status === "HIRED" &&
        updatedApplication?.status === "HIRED" &&
        updatedWorkflow?.status === "COMPLETED" &&
        updatedWorkflow?.currentStep === "JOINING_CONFIRMED" &&
        updatedCandidate?.availabilityStatus === "JOINED" &&
        placements.length === 0,
      "Direct joining marks HIRED, marks candidate JOINED, completes JOINING_ONBOARDING and creates no PPH placement.",
    );

    const replay = await callApi(joinedAt);
    assert(
      "Direct joining confirmation is idempotent for identical evidence",
      replay.status === 200 && replay.body.duplicate === true,
      "Identical retry returns the persisted direct joining result.",
    );

    const conflict = await callApi(new Date(Date.now() - 20 * 60 * 1000).toISOString());
    assert(
      "Direct joining rejects conflicting replay evidence",
      conflict.status === 409,
      "A different joining timestamp requires reconciliation instead of overwriting evidence.",
    );
  } catch (error: any) {
    assert("Direct-hire joining integration suite", false, error?.message || String(error));
  } finally {
    if (applicationId) {
      await prisma.communicationDelivery.deleteMany({ where: { correlationId: applicationId } }).catch(() => undefined);
      const audits = await prisma.auditLog.findMany({
        where: { resource: `Application:${applicationId}` },
        select: { id: true },
      }).catch(() => []);
      if (audits.length) {
        await prisma.securityAuditOutboxEvent.deleteMany({
          where: { auditLogId: { in: audits.map((audit) => audit.id) } },
        }).catch(() => undefined);
      }
      await prisma.auditLog.deleteMany({ where: { resource: `Application:${applicationId}` } }).catch(() => undefined);
    }
    if (candidateUserId) {
      await prisma.notification.deleteMany({ where: { userId: candidateUserId } }).catch(() => undefined);
    }
    if (workflowId) await prisma.workflowInstance.deleteMany({ where: { id: workflowId } }).catch(() => undefined);
    if (offerId) await prisma.offer.deleteMany({ where: { id: offerId } }).catch(() => undefined);
    if (applicationId) await prisma.application.deleteMany({ where: { id: applicationId } }).catch(() => undefined);
    if (jobId) await prisma.jobListing.deleteMany({ where: { id: jobId } }).catch(() => undefined);
    if (candidateProfileId) await prisma.candidateProfile.deleteMany({ where: { id: candidateProfileId } }).catch(() => undefined);
    if (employerId) await prisma.employerProfile.deleteMany({ where: { userId: employerId } }).catch(() => undefined);
    const userIds = [employerId, candidateUserId].filter(Boolean);
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => undefined);
    if (companyId) await prisma.company.deleteMany({ where: { id: companyId } }).catch(() => undefined);
  }

  return { passed, failed, results };
}
