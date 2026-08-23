import crypto from "crypto";
import { createSessionToken, getCurrentSession, revokeAllUserSessions, revokeSessionToken } from "@/lib/auth";
import { resetDevelopmentRedisStore } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export type HardeningTestResult = {
  name: string;
  category: string;
  passed: boolean;
  skipped?: boolean;
  message?: string;
};

const result = (name: string, passed: boolean, message?: string): HardeningTestResult => ({
  name,
  category: "Production hardening",
  passed,
  message,
});

const skipped = (name: string, message: string): HardeningTestResult => ({
  name,
  category: "Production hardening",
  passed: false,
  skipped: true,
  message,
});

function authorizedRequest(token: string, jobId: string): Request {
  return new Request("https://hirego.test/api/applications", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
}

export async function runProductionHardeningTests(): Promise<{ results: HardeningTestResult[] }> {
  const results: HardeningTestResult[] = [];
  resetDevelopmentRedisStore();

  const sessionPayload = {
    id: `session-${crypto.randomUUID()}`,
    email: `session-${crypto.randomUUID()}@hirego.test`,
    name: "Session Regression Test",
    role: "CANDIDATE" as const,
    sessionVersion: 0,
  };
  const sessionToken = createSessionToken(sessionPayload);

  try {
    const valid = await getCurrentSession(new Headers({ authorization: `Bearer ${sessionToken}` }));
    await revokeSessionToken(sessionToken);
    const revoked = await getCurrentSession(new Headers({ authorization: `Bearer ${sessionToken}` }));
    results.push(result("Revoked session token is rejected", !!valid && revoked === null));
  } catch (error) {
    results.push(result("Revoked session token is rejected", false, error instanceof Error ? error.message : String(error)));
  }

  try {
    const versionToken = createSessionToken(sessionPayload);
    await revokeAllUserSessions(sessionPayload.id, 1);
    const stale = await getCurrentSession(new Headers({ authorization: `Bearer ${versionToken}` }));
    results.push(result("Session-version mismatch is rejected", stale === null));
  } catch (error) {
    results.push(result("Session-version mismatch is rejected", false, error instanceof Error ? error.message : String(error)));
  }

  if (process.env.HIREGO_TEST_DATABASE !== "1") {
    results.push(skipped(
      "Concurrent application submission database invariant",
      "Not run outside the disposable CI database (set HIREGO_TEST_DATABASE=1).",
    ));
    return { results };
  }

  const suffix = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `candidate-${suffix}@hirego.test`,
      name: "Application Regression Candidate",
      passwordHash: "not-used-by-handler-tests",
      role: "CANDIDATE",
      emailVerified: true,
    },
  });
  const company = await prisma.company.create({ data: { name: `Application Test Company ${suffix}` } });
  const candidate = await prisma.candidateProfile.create({
    data: { userId: user.id, headline: "Test candidate", location: "India", skills: ["TypeScript"] },
  });
  const job = await prisma.jobListing.create({
    data: {
      companyId: company.id,
      title: "Application concurrency test",
      location: "Remote",
      type: "Full-time",
      salaryRange: "100000",
      description: "A disposable integration-test job.",
      requirements: ["TypeScript"],
      status: "ACTIVE",
    },
  });

  try {
    const { POST } = await import("@/app/api/applications/route");
    const token = createSessionToken({ id: user.id, email: user.email, name: user.name, role: "CANDIDATE", sessionVersion: user.sessionVersion });
    const responses = await Promise.all([
      POST(authorizedRequest(token, job.id) as any),
      POST(authorizedRequest(token, job.id) as any),
    ]);
    const statuses = responses.map((response) => response.status).sort((a, b) => a - b);
    const count = await prisma.application.count({ where: { jobId: job.id, candidateProfileId: candidate.id } });
    results.push(result(
      "Concurrent application submission creates exactly one row",
      statuses[0] === 201 && statuses[1] === 409 && count === 1,
      `statuses=${statuses.join(",")}, applicationRows=${count}`,
    ));

    const { POST: submitVideo } = await import("@/app/api/candidate/video-resume/route");
    const videoResponse = await submitVideo(new Request("https://hirego.test/api/candidate/video-resume", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        videoUrl: "https://storage.hirego.test/videos/test.mp4",
        durationSeconds: 45,
        analysis: { communicationScore: 100, clarityScore: 100, confidenceScore: 100, professionalismScore: 100 },
      }),
    }) as any);
    const videoJson = await videoResponse.json();
    const video = videoJson.video;
    results.push(result(
      "Candidate-controlled video scores are never persisted",
      videoResponse.status === 201 &&
        video?.communicationScore === null &&
        video?.clarityScore === null &&
        video?.confidenceScore === null &&
        video?.professionalism === null,
    ));
  } catch (error) {
    results.push(result("Concurrent application submission creates exactly one row", false, error instanceof Error ? error.message : String(error)));
  } finally {
    await prisma.jobListing.delete({ where: { id: job.id } }).catch(() => undefined);
    await prisma.candidateProfile.delete({ where: { id: candidate.id } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    await prisma.company.delete({ where: { id: company.id } }).catch(() => undefined);
  }

  const promoSuffix = crypto.randomUUID();
  let promoId: string | undefined;
  let planId: string | undefined;
  let promoEmployerId: string | undefined;
  let promoCompanyId: string | undefined;
  try {
    const promoCompany = await prisma.company.create({ data: { name: `Promo Test Company ${promoSuffix}` } });
    promoCompanyId = promoCompany.id;
    const employer = await prisma.user.create({
      data: {
        email: `promo-employer-${promoSuffix}@hirego.test`,
        name: "Promo Regression Employer",
        passwordHash: "not-used-by-handler-tests",
        role: "EMPLOYER",
        emailVerified: true,
      },
    });
    promoEmployerId = employer.id;
    await prisma.employerProfile.create({ data: { userId: employer.id, companyId: promoCompany.id } });
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: `Promo Test Plan ${promoSuffix}`,
        description: "Disposable promo-reservation plan.",
        price: 1000,
        currency: "INR",
        jobPostsQuota: 1,
        resumeUnlocksQuota: 1,
        aiInterviewsQuota: 1,
      },
    });
    planId = plan.id;
    const promo = await prisma.promoCode.create({
      data: { code: `ONE${promoSuffix.replace(/-/g, "").slice(0, 12)}`.toUpperCase(), discountType: "PERCENTAGE", discountValue: 10, maxUsage: 1 },
    });
    promoId = promo.id;
    const { POST: checkout } = await import("@/app/api/payments/checkout/route");
    const employerToken = createSessionToken({ id: employer.id, email: employer.email, name: employer.name, role: "EMPLOYER", sessionVersion: employer.sessionVersion });
    const checkoutRequest = () => new Request("https://hirego.test/api/payments/checkout", {
      method: "POST",
      headers: { authorization: `Bearer ${employerToken}`, "content-type": "application/json" },
      body: JSON.stringify({ planId: plan.id, paymentMethod: "RAZORPAY", promoCode: promo.code }),
    });
    const checkoutResponses = await Promise.all([checkout(checkoutRequest() as any), checkout(checkoutRequest() as any)]);
    const updatedPromo = await prisma.promoCode.findUnique({ where: { id: promo.id } });
    results.push(result(
      "Promo checkout reserves exactly one remaining capacity slot",
      checkoutResponses.filter((response) => response.status === 200).length === 1 &&
      checkoutResponses.filter((response) => response.status === 400).length === 1 &&
      updatedPromo?.usageCount === 0 && updatedPromo?.reservedUsage === 1,
    ));

    const paymentAudit = await prisma.auditLog.create({
      data: {
        userId: null,
        companyId: promoCompany.id,
        action: "PAYMENT_AUDIT_RELATION_TEST",
        resource: "test",
      },
    });
    results.push(result(
      "System payment audit events retain company ownership without a fake user ID",
      paymentAudit.userId === null && paymentAudit.companyId === promoCompany.id,
    ));
  } catch (error) {
    results.push(result("Promo checkout reserves exactly one remaining capacity slot", false, error instanceof Error ? error.message : String(error)));
  } finally {
    if (promoCompanyId) await prisma.auditLog.deleteMany({ where: { companyId: promoCompanyId } }).catch(() => undefined);
    if (promoCompanyId) await prisma.paymentOrder.deleteMany({ where: { companyId: promoCompanyId } }).catch(() => undefined);
    if (promoId) await prisma.promoCode.delete({ where: { id: promoId } }).catch(() => undefined);
    if (planId) await prisma.subscriptionPlan.delete({ where: { id: planId } }).catch(() => undefined);
    if (promoEmployerId) await prisma.employerProfile.deleteMany({ where: { userId: promoEmployerId } }).catch(() => undefined);
    if (promoEmployerId) await prisma.user.delete({ where: { id: promoEmployerId } }).catch(() => undefined);
    if (promoCompanyId) await prisma.company.delete({ where: { id: promoCompanyId } }).catch(() => undefined);
  }

  return { results };
}
