import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TestResult } from "./suite.test";
import { PATCH as stagePatchHandler } from "@/app/api/employer/candidates/[id]/stage/route";
import { PUT as jobPutHandler, DELETE as jobDeleteHandler } from "@/app/api/employer/jobs/[id]/route";
import { PATCH as interviewPatchHandler } from "@/app/api/employer/interviews/[id]/route";
import { PATCH as offerPatchHandler } from "@/app/api/employer/offers/[id]/route";
import { POST as applicationPostHandler, PATCH as applicationWithdrawHandler } from "@/app/api/applications/route";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth";

export async function runHiringWorkflowTests(): Promise<{
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
      results.push({ name, category: "Hiring Workflow", passed: true, message: `PASS: ${message}` });
    } else {
      failed++;
      results.push({ name, category: "Hiring Workflow", passed: false, message: `FAIL: ${message}` });
    }
  };

  // Check database connectivity
  let dbAvailable = false;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbAvailable = true;
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      results.push({
        name: "Hiring workflow integration suite",
        category: "Hiring Workflow",
        passed: false,
        skipped: true,
        message: "SKIPPED outside CI: database unavailable (set HIREGO_TEST_DATABASE=1)",
      });
      return { passed, failed, results };
    }
  }

  if (dbAvailable) {
    const testId = crypto.randomUUID().slice(0, 8);

    // Helpers to call handlers
    const callStagePatch = async (sessionToken: string, applicationId: string, stage: string) => {
      const req = new NextRequest(`http://localhost/api/employer/candidates/${applicationId}/stage`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ stage }),
      });
      const res = await stagePatchHandler(req, { params: Promise.resolve({ id: applicationId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    const callApplicationPost = async (sessionToken: string, jobId: string) => {
      const req = new NextRequest("http://localhost/api/applications", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ jobId }),
      });
      const res = await applicationPostHandler(req);
      const json = await res.json();
      return { status: res.status, json };
    };

    const callApplicationWithdraw = async (sessionToken: string, applicationId: string) => {
      const req = new NextRequest("http://localhost/api/applications", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ applicationId }),
      });
      const res = await applicationWithdrawHandler(req);
      const json = await res.json();
      return { status: res.status, json };
    };

    const callJobPut = async (sessionToken: string, jobId: string, body: any) => {
      const req = new NextRequest(`http://localhost/api/employer/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      });
      const res = await jobPutHandler(req, { params: Promise.resolve({ id: jobId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    const callJobDelete = async (sessionToken: string, jobId: string) => {
      const req = new NextRequest(`http://localhost/api/employer/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });
      const res = await jobDeleteHandler(req, { params: Promise.resolve({ id: jobId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    const callOfferPatch = async (sessionToken: string, offerId: string, body: Record<string, unknown>) => {
      const req = new NextRequest(`http://localhost/api/employer/offers/${offerId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      });
      const res = await offerPatchHandler(req, { params: Promise.resolve({ id: offerId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    const callInterviewPatch = async (sessionToken: string, interviewId: string, action: string, scheduledAt?: string) => {
      const req = new NextRequest(`http://localhost/api/employer/interviews/${interviewId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ action, scheduledAt }),
      });
      const res = await interviewPatchHandler(req, { params: Promise.resolve({ id: interviewId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    let companyA: any = null;
    let companyB: any = null;
    let employerA: any = null;
    let employerB: any = null;
    let candidateUser: any = null;
    let candidateProfile: any = null;
    let jobListingA: any = null;
    let jobListingB: any = null;
    let disposableDraftJob: any = null;
    let expiredPublicJob: any = null;
    let acceptedOffer: any = null;
    let offerStateJob: any = null;
    let offerStateApplication: any = null;
    let offerStateOffer: any = null;
    let offerStateWorkflow: any = null;
    let offerStateApproval: any = null;
    let applicationA: any = null;
    let applicationB: any = null;
    let interviewA: any = null;

    try {
      // 1. Setup entities
      companyA = await prisma.company.create({ data: { name: `Company A ${testId}` } });
      companyB = await prisma.company.create({ data: { name: `Company B ${testId}` } });

      employerA = await prisma.user.create({
        data: {
          email: `employer-a-${testId}@hirego.test`,
          name: "Employer A",
          passwordHash: "dummy",
          role: "EMPLOYER",
        },
      });
      await prisma.employerProfile.create({ data: { userId: employerA.id, companyId: companyA.id } });

      employerB = await prisma.user.create({
        data: {
          email: `employer-b-${testId}@hirego.test`,
          name: "Employer B",
          passwordHash: "dummy",
          role: "EMPLOYER",
        },
      });
      await prisma.employerProfile.create({ data: { userId: employerB.id, companyId: companyB.id } });

      candidateUser = await prisma.user.create({
        data: {
          email: `candidate-${testId}@hirego.test`,
          name: "Candidate",
          passwordHash: "dummy",
          role: "CANDIDATE",
        },
      });
      candidateProfile = await prisma.candidateProfile.create({ data: { userId: candidateUser.id } });

      jobListingA = await prisma.jobListing.create({
        data: {
          companyId: companyA.id,
          title: "Senior AI Engineer",
          location: "Bengaluru",
          description: "Build robust backends",
        },
      });

      jobListingB = await prisma.jobListing.create({
        data: {
          companyId: companyB.id,
          title: "Senior QA Engineer",
          location: "Remote",
          description: "Verify production pipelines",
        },
      });

      applicationA = await prisma.application.create({
        data: {
          candidateProfileId: candidateProfile.id,
          jobId: jobListingA.id,
          status: "APPLIED",
        },
      });

      applicationB = await prisma.application.create({
        data: {
          candidateProfileId: candidateProfile.id,
          jobId: jobListingB.id,
          status: "APPLIED",
        },
      });

      interviewA = await prisma.interview.create({
        data: {
          applicationId: applicationA.id,
          scheduledAt: new Date(Date.now() + 86400000), // tomorrow
          durationMins: 45,
          status: "SCHEDULED",
        },
      });

      const tokenA = await createSessionToken({ id: employerA.id, role: "EMPLOYER", email: employerA.email, name: employerA.name });
      const tokenB = await createSessionToken({ id: employerB.id, role: "EMPLOYER", email: employerB.email, name: employerB.name });
      const candidateToken = await createSessionToken({
        id: candidateUser.id,
        role: "CANDIDATE",
        email: candidateUser.email,
        name: candidateUser.name,
      });

      expiredPublicJob = await prisma.jobListing.create({
        data: {
          companyId: companyA.id,
          title: "Expired Public QA Role",
          location: "Remote",
          description: "CI-only expired job application guard.",
          status: "ACTIVE",
          publishedAt: new Date(Date.now() - 2 * 86400000),
          expiresAt: new Date(Date.now() - 86400000),
        },
      });
      const expiredApply = await callApplicationPost(candidateToken, expiredPublicJob.id);
      const expiredApplicationRow = await prisma.application.findUnique({
        where: {
          candidateProfileId_jobId: {
            candidateProfileId: candidateProfile.id,
            jobId: expiredPublicJob.id,
          },
        },
      });
      assert(
        "Expired public jobs cannot accept candidate applications",
        expiredApply.status === 409 && expiredApplicationRow === null,
        "Expired ACTIVE rows are rejected before any application intent or assessment gate is created."
      );

      // 2. Candidate Stage Update Verification
      const resStageA = await callStagePatch(tokenA, applicationA.id, "SCREENING");
      const dbStageA = await prisma.application.findUnique({ where: { id: applicationA.id } });
      assert(
        "Authorized employer can advance an APPLIED candidate into operational screening",
        resStageA.status === 200 &&
          resStageA.json.success === true &&
          dbStageA?.status === "SCREENING",
        "APPLIED -> SCREENING is the only generic manual stage transition."
      );

      const forgedAssessment = await callStagePatch(tokenA, applicationA.id, "ASSESSMENT");
      const dbAfterForgedAssessment = await prisma.application.findUnique({ where: { id: applicationA.id } });
      assert(
        "Generic pipeline cannot forge an assessment stage",
        forgedAssessment.status === 400 && dbAfterForgedAssessment?.status === "SCREENING",
        "Assessment state remains owned by the assessment workflow."
      );

      const resStageCross = await callStagePatch(tokenA, applicationB.id, "SCREENING");
      assert(
        "Candidate stage update rejected for cross-company pipelines",
        resStageCross.status === 403,
        "Update returned status 403 Forbidden"
      );

      acceptedOffer = await prisma.offer.create({
        data: {
          applicationId: applicationA.id,
          companyId: companyA.id,
          createdById: employerA.id,
          title: "Accepted withdrawal guard offer",
          compensationAmount: 1500000,
          currency: "INR",
          expiresAt: new Date(Date.now() + 7 * 86400000),
          terms: { roleTitle: jobListingA.title, employmentType: "Full-time" },
          status: "ACCEPTED",
          sentAt: new Date(Date.now() - 2 * 3600000),
          acceptedAt: new Date(Date.now() - 3600000),
        },
      });
      const acceptedOfferWithdraw = await callApplicationWithdraw(candidateToken, applicationA.id);
      const appAfterAcceptedWithdraw = await prisma.application.findUnique({ where: { id: applicationA.id } });
      assert(
        "Candidate cannot withdraw after accepting an offer",
        acceptedOfferWithdraw.status === 409 && appAfterAcceptedWithdraw?.status === "SCREENING",
        "Accepted offer evidence blocks application withdrawal and preserves the application state."
      );
      await prisma.offer.delete({ where: { id: acceptedOffer.id } });
      acceptedOffer = null;

      offerStateJob = await prisma.jobListing.create({
        data: {
          companyId: companyA.id,
          title: "Offer State Integrity Role",
          location: "Remote",
          description: "CI-only offer/workflow integrity verification.",
          status: "ACTIVE",
          publishedAt: new Date(),
        },
      });
      offerStateApplication = await prisma.application.create({
        data: {
          candidateProfileId: candidateProfile.id,
          jobId: offerStateJob.id,
          status: "SHORTLISTED",
        },
      });
      offerStateOffer = await prisma.offer.create({
        data: {
          applicationId: offerStateApplication.id,
          companyId: companyA.id,
          createdById: employerA.id,
          title: "Draft offer to withdraw",
          compensationAmount: 1400000,
          currency: "INR",
          expiresAt: new Date(Date.now() + 7 * 86400000),
          terms: { roleTitle: offerStateJob.title, employmentType: "Full-time" },
          status: "DRAFT",
        },
      });
      offerStateWorkflow = await prisma.workflowInstance.create({
        data: {
          companyId: companyA.id,
          jobId: offerStateJob.id,
          candidateId: candidateProfile.id,
          applicationId: offerStateApplication.id,
          workflowType: "JOINING_ONBOARDING",
          status: "PAUSED_FOR_APPROVAL",
          currentStep: "OFFER_SEND",
          correlationId: `offer-send:${offerStateOffer.id}`,
          initiatedBy: employerA.id,
          checkpointState: { offerId: offerStateOffer.id, source: "hiring-workflow-test" },
        },
      });
      offerStateApproval = await prisma.workflowApproval.create({
        data: {
          workflowInstanceId: offerStateWorkflow.id,
          companyId: companyA.id,
          stepName: "OFFER_SEND",
          actionType: "OFFER",
          actionDigest: crypto.createHash("sha256").update(`withdraw-test:${offerStateOffer.id}`).digest("hex"),
          requestedBy: employerA.id,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const offerWithdraw = await callOfferPatch(tokenA, offerStateOffer.id, {
        action: "WITHDRAW",
        reason: "Candidate workflow changed during CI verification.",
      });
      const [offerAfterWithdraw, workflowAfterWithdraw, approvalAfterWithdraw] = await Promise.all([
        prisma.offer.findUnique({ where: { id: offerStateOffer.id } }),
        prisma.workflowInstance.findUnique({ where: { id: offerStateWorkflow.id } }),
        prisma.workflowApproval.findUnique({ where: { id: offerStateApproval.id } }),
      ]);
      assert(
        "Withdrawing a draft offer cancels its joining workflow and revokes unconsumed approval",
        offerWithdraw.status === 200 &&
          offerAfterWithdraw?.status === "WITHDRAWN" &&
          workflowAfterWithdraw?.status === "CANCELLED" &&
          workflowAfterWithdraw?.currentStep === "OFFER_WITHDRAWN" &&
          approvalAfterWithdraw?.revokedAt !== null,
        "Offer, workflow and approval state move together instead of leaving a paused orphan workflow."
      );

      // 3. Job Status Update Verification
      const resJobPutA = await callJobPut(tokenA, jobListingA.id, { status: "PAUSED" });
      assert(
        "Job status updated to PAUSED by authorized company employer",
        resJobPutA.status === 200 && resJobPutA.json.success === true,
        "Job status set to PAUSED in DB"
      );

      const resJobPutCross = await callJobPut(tokenA, jobListingB.id, { status: "PAUSED" });
      assert(
        "Job status update rejected for cross-company listings",
        resJobPutCross.status === 403,
        "Update returned status 403 Forbidden"
      );

      // 4. Interview Rescheduling and Cancellation Verification
      // Generic stage mutation above intentionally cannot forge AI_INTERVIEW.
      // This fixture now models the legitimate state produced by the dedicated
      // interview scheduling workflow before testing interview operations.
      await prisma.application.update({
        where: { id: applicationA.id },
        data: { status: "AI_INTERVIEW" },
      });

      const newTime = new Date(Date.now() + 172800000).toISOString();
      const resReschedule = await callInterviewPatch(tokenA, interviewA.id, "RESCHEDULE", newTime);
      const dbInterviewRescheduled = await prisma.interview.findUnique({ where: { id: interviewA.id } });
      assert(
        "Interview rescheduled by authorized company employer",
        resReschedule.status === 200 &&
        dbInterviewRescheduled?.status === "RESCHEDULED" &&
        dbInterviewRescheduled?.scheduledAt.toISOString() === newTime,
        "Interview time and status updated in DB"
      );

      const resCancel = await callInterviewPatch(tokenA, interviewA.id, "CANCEL");
      const dbInterviewCancelled = await prisma.interview.findUnique({ where: { id: interviewA.id } });
      assert(
        "Interview cancelled by authorized company employer",
        resCancel.status === 200 && dbInterviewCancelled?.status === "CANCELLED",
        "Interview status set to CANCELLED in DB"
      );

      const resInterviewCross = await callInterviewPatch(tokenB, interviewA.id, "CANCEL");
      assert(
        "Interview update rejected for unauthorized company employer",
        resInterviewCross.status === 404,
        "Update returned status 404 Not Found"
      );

      // 5. Job Deletion Verification
      const resJobDelCross = await callJobDelete(tokenA, jobListingB.id);
      assert(
        "Job deletion rejected for cross-company listings",
        resJobDelCross.status === 403,
        "Deletion returned status 403 Forbidden"
      );

      const resJobDelA = await callJobDelete(tokenA, jobListingA.id);
      const dbJobAAfterProtectedDelete = await prisma.jobListing.findUnique({ where: { id: jobListingA.id } });
      const dbAppAAfterProtectedDelete = await prisma.application.findUnique({ where: { id: applicationA.id } });
      assert(
        "Job deletion preserves hiring records once applications exist",
        resJobDelA.status === 409 && dbJobAAfterProtectedDelete !== null && dbAppAAfterProtectedDelete !== null,
        "Published/used job deletion is blocked and existing hiring records are preserved"
      );

      disposableDraftJob = await prisma.jobListing.create({
        data: {
          companyId: companyA.id,
          title: "Disposable Draft Role",
          location: "Remote",
          description: "CI-only unused draft for deletion contract verification",
          status: "DRAFT",
        },
      });
      const resDraftDelete = await callJobDelete(tokenA, disposableDraftJob.id);
      const dbDraftAfterDelete = await prisma.jobListing.findUnique({ where: { id: disposableDraftJob.id } });
      assert(
        "Unused draft job can be deleted cleanly",
        resDraftDelete.status === 200 && dbDraftAfterDelete === null,
        "Unused draft deletion succeeds without touching historical hiring records"
      );

    } finally {
      // 6. Cleanup
      if (acceptedOffer) {
        await prisma.offer.deleteMany({ where: { id: acceptedOffer.id } }).catch(() => undefined);
      }
      if (offerStateApproval) {
        await prisma.workflowApproval.deleteMany({ where: { id: offerStateApproval.id } }).catch(() => undefined);
      }
      if (offerStateWorkflow) {
        await prisma.workflowInstance.deleteMany({ where: { id: offerStateWorkflow.id } }).catch(() => undefined);
      }
      if (offerStateOffer) {
        await prisma.offer.deleteMany({ where: { id: offerStateOffer.id } }).catch(() => undefined);
      }
      if (offerStateApplication) {
        await prisma.application.deleteMany({ where: { id: offerStateApplication.id } }).catch(() => undefined);
      }
      if (offerStateJob) {
        await prisma.jobListing.deleteMany({ where: { id: offerStateJob.id } }).catch(() => undefined);
      }
      if (interviewA) {
        const interviewAudits = await prisma.auditLog.findMany({
          where: { resource: `Interview:${interviewA.id}` },
          select: { id: true },
        }).catch(() => []);
        if (interviewAudits.length) {
          await prisma.securityAuditOutboxEvent.deleteMany({
            where: { auditLogId: { in: interviewAudits.map((audit) => audit.id) } },
          }).catch(() => undefined);
          await prisma.auditLog.deleteMany({
            where: { id: { in: interviewAudits.map((audit) => audit.id) } },
          }).catch(() => undefined);
        }
        await prisma.interview.delete({ where: { id: interviewA.id } }).catch(() => undefined);
      }
      if (applicationA) {
        const applicationAudits = await prisma.auditLog.findMany({
          where: { resource: `Application:${applicationA.id}` },
          select: { id: true },
        }).catch(() => []);
        if (applicationAudits.length) {
          await prisma.securityAuditOutboxEvent.deleteMany({
            where: { auditLogId: { in: applicationAudits.map((audit) => audit.id) } },
          }).catch(() => undefined);
          await prisma.auditLog.deleteMany({
            where: { id: { in: applicationAudits.map((audit) => audit.id) } },
          }).catch(() => undefined);
        }
        await prisma.application.delete({ where: { id: applicationA.id } }).catch(() => undefined);
      }
      if (applicationB) {
        await prisma.application.delete({ where: { id: applicationB.id } }).catch(() => undefined);
      }
      if (jobListingA) {
        await prisma.jobListing.delete({ where: { id: jobListingA.id } }).catch(() => undefined);
      }
      if (disposableDraftJob) {
        await prisma.jobListing.delete({ where: { id: disposableDraftJob.id } }).catch(() => undefined);
      }
      if (expiredPublicJob) {
        await prisma.jobListing.delete({ where: { id: expiredPublicJob.id } }).catch(() => undefined);
      }
      if (jobListingB) {
        await prisma.jobListing.delete({ where: { id: jobListingB.id } }).catch(() => undefined);
      }
      if (candidateProfile) {
        await prisma.candidateProfile.delete({ where: { id: candidateProfile.id } }).catch(() => undefined);
      }
      if (candidateUser) {
        await prisma.user.delete({ where: { id: candidateUser.id } }).catch(() => undefined);
      }
      if (employerA) {
        await prisma.employerProfile.deleteMany({ where: { userId: employerA.id } }).catch(() => undefined);
        await prisma.user.delete({ where: { id: employerA.id } }).catch(() => undefined);
      }
      if (employerB) {
        await prisma.employerProfile.deleteMany({ where: { userId: employerB.id } }).catch(() => undefined);
        await prisma.user.delete({ where: { id: employerB.id } }).catch(() => undefined);
      }
      if (companyA) {
        await prisma.company.delete({ where: { id: companyA.id } }).catch(() => undefined);
      }
      if (companyB) {
        await prisma.company.delete({ where: { id: companyB.id } }).catch(() => undefined);
      }
    }
  }

  return { passed, failed, results };
}
