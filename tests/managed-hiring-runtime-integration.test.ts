import crypto from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { activateManagedHiringRequirement } from "@/lib/managedHiring/RequirementActivation";
import { sourceManagedJobCandidates } from "@/lib/managedHiring/SourcingOrchestrator";

test("managed hiring requirement activation and safe sourcing work against the real schema", async (t) => {
  if (process.env.HIREGO_TEST_DATABASE !== "1") {
    t.skip("requires disposable CI database");
    return;
  }

  const suffix = crypto.randomUUID().slice(0, 8);
  let companyId = "";
  let adminId = "";
  let requirementId = "";
  let agreementId = "";
  let jobId = "";
  let candidateUserId = "";
  let candidateProfileId = "";

  try {
    const company = await prisma.company.create({
      data: { name: `Managed Runtime ${suffix}` },
      select: { id: true },
    });
    companyId = company.id;

    const admin = await prisma.user.create({
      data: {
        email: `managed-runtime-admin-${suffix}@hirego.test`,
        passwordHash: "test-only",
        name: "Runtime Admin",
        role: "ADMIN",
      },
      select: { id: true },
    });
    adminId = admin.id;

    const requirement = await prisma.hiringRequirement.create({
      data: {
        referenceCode: `REQ-RUNTIME-${suffix}`,
        companyId,
        companyName: `Managed Runtime ${suffix}`,
        contactPerson: "Hiring Lead",
        email: `lead-${suffix}@hirego.test`,
        primaryMobile: "+910000000000",
        industry: "Software",
        numberOfPositions: 2,
        multipleRoles: false,
        jobTitles: ["TypeScript Engineer"],
        department: "Engineering",
        experienceYears: "3+ years",
        employmentType: "Full-time",
        skillsRequired: ["TypeScript"],
        preferredSkills: ["Node.js"],
        education: "Relevant degree or equivalent experience",
        salaryRangeMin: 1000000,
        salaryRangeMax: 1800000,
        currency: "INR",
        workMode: "Hybrid",
        location: "Bengaluru",
        joiningTimeline: "Within 60 days",
        hiringPriority: "High",
        replacementExpectation: "90 days",
        status: "SUBMITTED",
      },
      select: { id: true },
    });
    requirementId = requirement.id;

    const agreement = await prisma.commercialAgreement.create({
      data: {
        agreementNumber: `AGR-RUNTIME-${suffix}`,
        companyId,
        requirementId,
        companyName: `Managed Runtime ${suffix}`,
        clientLegalName: `Managed Runtime ${suffix} Pvt Ltd`,
        contactPerson: "Hiring Lead",
        clientEmail: `lead-${suffix}@hirego.test`,
        clientPhone: "+910000000000",
        status: "ACTIVE",
        feeType: "PERCENTAGE",
        feeValue: 8.33,
        invoiceRule: "DAY_25",
        replacementDays: 90,
        validityStartDate: new Date(),
        validityEndDate: new Date(Date.now() + 365 * 86_400_000),
        advancePaymentAmount: 0,
        discountPercentage: 0,
        creditDays: 15,
        taxRatePct: 18,
      },
      select: { id: true },
    });
    agreementId = agreement.id;

    const activation = await activateManagedHiringRequirement({
      requirementId,
      activeAgreementId: agreementId,
      activatedById: adminId,
    });
    assert.equal(activation.jobs.length, 1);
    jobId = activation.jobs[0].id;
    assert.equal(activation.jobs[0].managedRequirementId, requirementId);
    assert.equal(activation.jobs[0].managedAgreementId, agreementId);
    assert.equal(activation.jobs[0].status, "ACTIVE");

    const replay = await activateManagedHiringRequirement({
      requirementId,
      activeAgreementId: agreementId,
      activatedById: adminId,
    });
    assert.equal(replay.jobs[0].id, jobId);
    assert.equal(
      await prisma.jobListing.count({ where: { managedRequirementId: requirementId } }),
      1,
    );

    const candidateUser = await prisma.user.create({
      data: {
        email: `managed-runtime-candidate-${suffix}@hirego.test`,
        passwordHash: "test-only",
        name: "Runtime Candidate",
        role: "CANDIDATE",
      },
      select: { id: true },
    });
    candidateUserId = candidateUser.id;

    const candidateProfile = await prisma.candidateProfile.create({
      data: {
        userId: candidateUser.id,
        skills: ["TypeScript", "Node.js"],
        experienceYears: 5,
        experience: [{ title: "Engineer", years: 5 }],
        availabilityStatus: "ACTIVE_CONFIRMED",
        lastAvailabilityConfirmedAt: new Date(),
        availabilitySource: "TEST",
      },
      select: { id: true },
    });
    candidateProfileId = candidateProfile.id;

    const sourcing = await sourceManagedJobCandidates({
      jobId,
      companyId,
      sourcedById: adminId,
      limit: 10,
    });
    assert.equal(sourcing.automaticRejections, 0);
    assert.equal(sourcing.invitationsSent, 0);
    assert.equal(sourcing.applicationsCreated, 0);
    assert.equal(sourcing.created, 1);

    const relationship = await prisma.candidateSourcingRelationship.findUnique({
      where: {
        jobId_candidateProfileId: { jobId, candidateProfileId },
      },
    });
    assert.equal(relationship?.status, "SOURCED");
    assert.equal(
      await prisma.application.count({ where: { jobId, candidateProfileId } }),
      0,
    );
  } finally {
    if (companyId) {
      await prisma.candidateSourcingRelationship.deleteMany({ where: { companyId } }).catch(() => undefined);
      await prisma.application.deleteMany({ where: { job: { companyId } } }).catch(() => undefined);
      await prisma.jobListing.deleteMany({ where: { companyId } }).catch(() => undefined);
      await prisma.commercialAgreement.deleteMany({ where: { companyId } }).catch(() => undefined);
      await prisma.hiringRequirement.deleteMany({ where: { companyId } }).catch(() => undefined);
      await prisma.outboxEntry.deleteMany({ where: { companyId } }).catch(() => undefined);
      await prisma.systemEvent.deleteMany({ where: { companyId } }).catch(() => undefined);
      await prisma.company.delete({ where: { id: companyId } }).catch(() => undefined);
    }
    if (candidateProfileId) {
      await prisma.candidateProfile.delete({ where: { id: candidateProfileId } }).catch(() => undefined);
    }
    if (candidateUserId) {
      await prisma.user.delete({ where: { id: candidateUserId } }).catch(() => undefined);
    }
    if (adminId) {
      await prisma.user.delete({ where: { id: adminId } }).catch(() => undefined);
    }
  }
});
