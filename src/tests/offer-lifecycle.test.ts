import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { expireOfferIfDue } from "@/lib/offerLifecycle";
import type { TestResult } from "./suite.test";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth";
import { PATCH as respondToOffer } from "@/app/api/candidate/offers/[id]/route";

export async function runOfferLifecycleTests(): Promise<{
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
      results.push({ name, category: "Offer Lifecycle", passed: true, message: `PASS: ${message}` });
    } else {
      failed += 1;
      results.push({ name, category: "Offer Lifecycle", passed: false, message: `FAIL: ${message}` });
    }
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      results.push({
        name: "Offer lifecycle integration suite",
        category: "Offer Lifecycle",
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
  let approvalId = "";
  let candidateResponseOfferId = "";
  let candidateResponseWorkflowId = "";

  try {
    const company = await prisma.company.create({
      data: { name: `Offer Lifecycle Test ${suffix}` },
    });
    companyId = company.id;

    const employer = await prisma.user.create({
      data: {
        email: `offer-expiry-employer-${suffix}@hirego.test`,
        name: "Offer Expiry Employer",
        passwordHash: "test-only",
        role: "EMPLOYER",
      },
    });
    employerId = employer.id;
    await prisma.employerProfile.create({
      data: { userId: employer.id, companyId: company.id },
    });

    const candidateUser = await prisma.user.create({
      data: {
        email: `offer-expiry-candidate-${suffix}@hirego.test`,
        name: "Offer Expiry Candidate",
        passwordHash: "test-only",
        role: "CANDIDATE",
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
        title: "Offer Lifecycle Engineer",
        location: "Remote",
        description: "Disposable integration test job.",
        status: "ACTIVE",
        publishedAt: new Date(Date.now() - 2 * 86400000),
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

    const offer = await prisma.offer.create({
      data: {
        applicationId: application.id,
        companyId: company.id,
        createdById: employer.id,
        title: "Expired draft offer",
        compensationAmount: 1000000,
        currency: "INR",
        expiresAt: new Date(Date.now() - 60_000),
        terms: { roleTitle: job.title, employmentType: "Full-time" },
        status: "DRAFT",
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
        status: "PAUSED_FOR_APPROVAL",
        currentStep: "OFFER_SEND",
        correlationId: `offer-send:${offer.id}`,
        initiatedBy: employer.id,
        checkpointState: { offerId: offer.id, source: "offer-lifecycle-test" },
      },
    });
    workflowId = workflow.id;

    const approval = await prisma.workflowApproval.create({
      data: {
        workflowInstanceId: workflow.id,
        companyId: company.id,
        stepName: "OFFER_SEND",
        actionType: "OFFER",
        actionDigest: crypto.createHash("sha256").update(`offer-expiry:${offer.id}`).digest("hex"),
        requestedBy: employer.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    approvalId = approval.id;

    const first = await expireOfferIfDue(offer.id);
    const [expiredOffer, cancelledWorkflow, revokedApproval, audit] = await Promise.all([
      prisma.offer.findUnique({ where: { id: offer.id } }),
      prisma.workflowInstance.findUnique({ where: { id: workflow.id } }),
      prisma.workflowApproval.findUnique({ where: { id: approval.id } }),
      prisma.auditLog.findFirst({
        where: { action: "OFFER_EXPIRED", resource: `Offer:${offer.id}` },
        include: { siemEvent: true },
      }),
    ]);

    assert(
      "Expired offer cancels its joining workflow and revokes stale approval",
      first === true &&
        expiredOffer?.status === "EXPIRED" &&
        cancelledWorkflow?.status === "CANCELLED" &&
        cancelledWorkflow?.currentStep === "OFFER_EXPIRED" &&
        revokedApproval?.revokedAt !== null,
      "Offer expiry, workflow cancellation and approval revocation commit together.",
    );

    assert(
      "Offer expiry writes durable security audit evidence",
      Boolean(audit?.siemEvent),
      "Expiry creates an AuditLog plus immutable security outbox envelope.",
    );

    const replay = await expireOfferIfDue(offer.id);
    assert(
      "Offer expiry reconciliation is idempotent",
      replay === false,
      "A terminal EXPIRED offer is not processed twice.",
    );

    const sentOffer = await prisma.offer.create({
      data: {
        applicationId: application.id,
        companyId: company.id,
        createdById: employer.id,
        title: "Expired sent offer",
        compensationAmount: 1000000,
        currency: "INR",
        expiresAt: new Date(Date.now() - 60_000),
        terms: { roleTitle: job.title, employmentType: "Full-time" },
        status: "SENT",
        sentAt: new Date(Date.now() - 2 * 60_000),
      },
    });
    candidateResponseOfferId = sentOffer.id;

    const sentWorkflow = await prisma.workflowInstance.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        candidateId: candidate.id,
        applicationId: application.id,
        workflowType: "JOINING_ONBOARDING",
        status: "RUNNING",
        currentStep: "OFFER_SEND",
        correlationId: `offer-send:${sentOffer.id}`,
        initiatedBy: employer.id,
        checkpointState: { offerId: sentOffer.id, source: "candidate-expired-response-test" },
      },
    });
    candidateResponseWorkflowId = sentWorkflow.id;

    const candidateToken = createSessionToken({
      id: candidateUser.id,
      email: candidateUser.email,
      name: candidateUser.name,
      role: "CANDIDATE",
      sessionVersion: 0,
    });
    const responseRequest = new NextRequest(
      `http://localhost/api/candidate/offers/${sentOffer.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({ action: "ACCEPT" }),
      },
    );
    const response = await respondToOffer(responseRequest, {
      params: Promise.resolve({ id: sentOffer.id }),
    });
    const reconciledWorkflow = await prisma.workflowInstance.findUnique({
      where: { id: sentWorkflow.id },
    });
    const reconciledSentOffer = await prisma.offer.findUnique({
      where: { id: sentOffer.id },
    });

    assert(
      "Candidate response to an expired sent offer reconciles the workflow before rejecting acceptance",
      response.status === 409 &&
        reconciledSentOffer?.status === "EXPIRED" &&
        reconciledWorkflow?.status === "CANCELLED" &&
        reconciledWorkflow?.currentStep === "OFFER_EXPIRED",
      "The response endpoint cannot leave an expired offer workflow running.",
    );
  } catch (error: any) {
    assert("Offer lifecycle integration suite", false, error?.message || String(error));
  } finally {
    if (offerId) {
      const audits = await prisma.auditLog.findMany({
        where: { resource: `Offer:${offerId}` },
        select: { id: true },
      }).catch(() => []);
      if (audits.length > 0) {
        await prisma.securityAuditOutboxEvent.deleteMany({
          where: { auditLogId: { in: audits.map((audit) => audit.id) } },
        }).catch(() => undefined);
        await prisma.auditLog.deleteMany({
          where: { id: { in: audits.map((audit) => audit.id) } },
        }).catch(() => undefined);
      }
    }
    if (approvalId) await prisma.workflowApproval.deleteMany({ where: { id: approvalId } }).catch(() => undefined);
    if (candidateResponseWorkflowId) await prisma.workflowInstance.deleteMany({ where: { id: candidateResponseWorkflowId } }).catch(() => undefined);
    if (workflowId) await prisma.workflowInstance.deleteMany({ where: { id: workflowId } }).catch(() => undefined);
    if (candidateResponseOfferId) {
      const candidateOfferAudits = await prisma.auditLog.findMany({
        where: { resource: `Offer:${candidateResponseOfferId}` },
        select: { id: true },
      }).catch(() => []);
      if (candidateOfferAudits.length > 0) {
        await prisma.securityAuditOutboxEvent.deleteMany({
          where: { auditLogId: { in: candidateOfferAudits.map((audit) => audit.id) } },
        }).catch(() => undefined);
        await prisma.auditLog.deleteMany({
          where: { id: { in: candidateOfferAudits.map((audit) => audit.id) } },
        }).catch(() => undefined);
      }
      await prisma.offer.deleteMany({ where: { id: candidateResponseOfferId } }).catch(() => undefined);
    }
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
