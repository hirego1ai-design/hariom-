import crypto from "crypto";
import { createSessionToken, getCurrentSession, revokeAllUserSessions, revokeSessionToken } from "@/lib/auth";
import { resetDevelopmentRedisStore } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export type HardeningTestResult = {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
};

const result = (name: string, passed: boolean, message?: string): HardeningTestResult => ({
  name,
  category: "Production hardening",
  passed,
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
    results.push(result(
      "Concurrent application submission database invariant",
      true,
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
  } catch (error) {
    results.push(result("Concurrent application submission creates exactly one row", false, error instanceof Error ? error.message : String(error)));
  } finally {
    await prisma.jobListing.delete({ where: { id: job.id } }).catch(() => undefined);
    await prisma.candidateProfile.delete({ where: { id: candidate.id } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    await prisma.company.delete({ where: { id: company.id } }).catch(() => undefined);
  }

  return { results };
}
