import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TestResult } from "./suite.test";
import { PATCH as stagePatchHandler } from "@/app/api/employer/candidates/[id]/stage/route";
import { PUT as jobPutHandler, DELETE as jobDeleteHandler } from "@/app/api/employer/jobs/[id]/route";
import { PATCH as interviewPatchHandler } from "@/app/api/employer/interviews/[id]/route";
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

      // 2. Candidate Stage Update Verification
      const resStageA = await callStagePatch(tokenA, applicationA.id, "ASSESSMENT");
      assert(
        "Candidate stage updated by authorized company employer",
        resStageA.status === 200 && resStageA.json.success === true,
        "Stage successfully updated to ASSESSMENT"
      );

      const resStageCross = await callStagePatch(tokenA, applicationB.id, "SHORTLISTED");
      assert(
        "Candidate stage update rejected for cross-company pipelines",
        resStageCross.status === 403,
        "Update returned status 403 Forbidden"
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
      const dbJobAAfterDel = await prisma.jobListing.findUnique({ where: { id: jobListingA.id } });
      const dbAppAAfterDel = await prisma.application.findUnique({ where: { id: applicationA.id } });
      assert(
        "Job deletion removes listing and cascades cleanly",
        resJobDelA.status === 200 && dbJobAAfterDel === null && dbAppAAfterDel === null,
        "Listing and application removed from DB successfully"
      );

    } finally {
      // 6. Cleanup
      if (interviewA) {
        await prisma.interview.delete({ where: { id: interviewA.id } }).catch(() => undefined);
      }
      if (applicationA) {
        await prisma.application.delete({ where: { id: applicationA.id } }).catch(() => undefined);
      }
      if (applicationB) {
        await prisma.application.delete({ where: { id: applicationB.id } }).catch(() => undefined);
      }
      if (jobListingA) {
        await prisma.jobListing.delete({ where: { id: jobListingA.id } }).catch(() => undefined);
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
