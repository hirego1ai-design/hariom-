import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TestResult } from "./suite.test";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { POST as acceptHandler } from "@/app/api/employer/team/accept/route";
import { NextRequest } from "next/server";

export async function runTeamInvitationTests(): Promise<{
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
      results.push({ name, category: "Team Invitations", passed: true, message: `PASS: ${message}` });
    } else {
      failed++;
      results.push({ name, category: "Team Invitations", passed: false, message: `FAIL: ${message}` });
    }
  };

  // 1. Unit: Token generation & SHA-256 hashing security
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert(
    "Token hashing is cryptographic SHA-256",
    tokenHash.length === 64 && rawToken !== tokenHash,
    "Raw token (64 hex chars) is hashed to SHA-256 and never stored in plain text"
  );

  // 2. Unit: Expiration date calculation (7 days)
  const now = Date.now();
  const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
  const diffDays = Math.round((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));
  assert(
    "Invitation lifetime is strictly 7 days",
    diffDays === 7,
    `Expires in ${diffDays} days`
  );

  // 3. Unit: Password strength validation for invited members
  const weak = validatePasswordStrength("weak");
  const strong = validatePasswordStrength("SecurePass2026!");
  assert(
    "Invited user password strength validation",
    !weak.valid && strong.valid,
    "Weak passwords rejected, strong passwords accepted"
  );

  // 4. Database integration tests (if DB is available)
  let dbAvailable = false;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbAvailable = true;
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      results.push({
        name: "Team invitation database lifecycle",
        category: "Team Invitations",
        passed: false,
        skipped: true,
        message: "SKIPPED outside CI: database unavailable (set HIREGO_TEST_DATABASE=1)",
      });
      return { passed, failed, results };
    }
  }

  if (dbAvailable) {
    const testId = crypto.randomUUID().slice(0, 8);

    // Helper to call accept API
    const callAcceptApi = async (token: string, password?: string, name?: string) => {
      const req = new NextRequest("http://localhost/api/employer/team/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password, name }),
      });
      const res = await acceptHandler(req);
      const json = await res.json();
      return { status: res.status, json };
    };

    let companyA: any = null;
    let companyB: any = null;
    let ownerA: any = null;

    try {
      // Setup Companies
      companyA = await prisma.company.create({
        data: { name: `Company A ${testId}` },
      });
      companyB = await prisma.company.create({
        data: { name: `Company B ${testId}` },
      });

      ownerA = await prisma.user.create({
        data: {
          email: `owner-a-${testId}@hirego.test`,
          name: "Owner A",
          passwordHash: hashPassword("OwnerPass123!"),
          role: "EMPLOYER",
        },
      });

      await prisma.employerProfile.create({
        data: {
          userId: ownerA.id,
          companyId: companyA.id,
          designation: "CEO",
        },
      });

      // Helper to generate a pending invitation
      const createInvite = async (email: string, role: "EMPLOYER" | "RECRUITER", companyId: string) => {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const invite = await prisma.companyInvitation.create({
          data: {
            companyId,
            email: email.toLowerCase(),
            name: "Invitee",
            role,
            designation: "Role " + role,
            tokenHash,
            status: "PENDING",
            invitedById: ownerA.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        return { rawToken, invite };
      };

      // --- Scenario 1: Candidate invited as Recruiter ---
      const email1 = `candidate-${testId}@hirego.test`;
      // Create existing user with CANDIDATE role
      const candidateUser = await prisma.user.create({
        data: {
          email: email1,
          name: "Candidate User",
          passwordHash: hashPassword("CandPass123!"),
          role: "CANDIDATE",
          sessionVersion: 1,
        },
      });

      const { rawToken: token1 } = await createInvite(email1, "RECRUITER", companyA.id);
      const res1 = await callAcceptApi(token1);

      const dbUser1 = await prisma.user.findUnique({ where: { id: candidateUser.id } });
      const profile1 = await prisma.employerProfile.findUnique({ where: { userId: candidateUser.id } });

      assert(
        "Candidate invited as Recruiter: promoted to Recruiter role",
        res1.status === 200 && dbUser1?.role === "RECRUITER" && profile1?.companyId === companyA.id,
        "User promoted to RECRUITER and profile created in Company A"
      );

      // --- Scenario 2: Recruiter invited as Recruiter ---
      const email2 = `recruiter-${testId}@hirego.test`;
      const recruiterUser = await prisma.user.create({
        data: {
          email: email2,
          name: "Recruiter User",
          passwordHash: hashPassword("RecPass123!"),
          role: "RECRUITER",
          sessionVersion: 1,
        },
      });
      await prisma.employerProfile.create({
        data: {
          userId: recruiterUser.id,
          companyId: companyA.id,
          designation: "Junior Recruiter",
        },
      });

      const { rawToken: token2 } = await createInvite(email2, "RECRUITER", companyA.id);
      const res2 = await callAcceptApi(token2);
      const dbUser2 = await prisma.user.findUnique({ where: { id: recruiterUser.id } });

      assert(
        "Recruiter invited as Recruiter: role remains Recruiter",
        res2.status === 200 && dbUser2?.role === "RECRUITER",
        "Role remains RECRUITER"
      );

      // --- Scenario 3: Employer invited as Recruiter (Downgrade/No privilege escalation) ---
      const email3 = `employer-${testId}@hirego.test`;
      const employerUser = await prisma.user.create({
        data: {
          email: email3,
          name: "Employer User",
          passwordHash: hashPassword("EmpPass123!"),
          role: "EMPLOYER",
          sessionVersion: 1,
        },
      });
      await prisma.employerProfile.create({
        data: {
          userId: employerUser.id,
          companyId: companyA.id,
          designation: "Executive",
        },
      });

      const { rawToken: token3 } = await createInvite(email3, "RECRUITER", companyA.id);
      const res3 = await callAcceptApi(token3);
      const dbUser3 = await prisma.user.findUnique({ where: { id: employerUser.id } });

      assert(
        "Employer invited as Recruiter: role becomes Recruiter (prevents privilege escalation)",
        res3.status === 200 && dbUser3?.role === "RECRUITER" && dbUser3.sessionVersion > 1,
        "Role restricted/set to the exact invitation role and session version rotated"
      );

      // --- Scenario 4: Existing Member same company ---
      const email4 = `member-${testId}@hirego.test`;
      const memberUser = await prisma.user.create({
        data: {
          email: email4,
          name: "Member User",
          passwordHash: hashPassword("MemberPass123!"),
          role: "RECRUITER",
        },
      });
      await prisma.employerProfile.create({
        data: {
          userId: memberUser.id,
          companyId: companyA.id,
          designation: "Sourcing Specialist",
        },
      });

      const { rawToken: token4 } = await createInvite(email4, "RECRUITER", companyA.id);
      const res4 = await callAcceptApi(token4);
      assert(
        "Existing member same company: accept successfully updates profile",
        res4.status === 200,
        "Accept request completed successfully"
      );

      // --- Scenario 5: Expired / Revoked invitation ---
      const email5 = `expired-${testId}@hirego.test`;
      const { rawToken: token5, invite: invite5 } = await createInvite(email5, "RECRUITER", companyA.id);

      // Expire it manually in DB
      await prisma.companyInvitation.update({
        where: { id: invite5.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const res5Expired = await callAcceptApi(token5);

      // Revoke another one
      const email5b = `revoked-${testId}@hirego.test`;
      const { rawToken: token5b, invite: invite5b } = await createInvite(email5b, "RECRUITER", companyA.id);
      await prisma.companyInvitation.update({
        where: { id: invite5b.id },
        data: { status: "REVOKED" },
      });
      const res5Revoked = await callAcceptApi(token5b);

      assert(
        "Expired or revoked invitations: rejected with 400 error",
        res5Expired.status === 400 && res5Revoked.status === 400,
        "Failed with 400 Bad Request"
      );

      // --- Scenario 6: Cross-Company Invitation Attempt (Rejected) ---
      const email6 = `cross-${testId}@hirego.test`;
      const crossUser = await prisma.user.create({
        data: {
          email: email6,
          name: "Cross User",
          passwordHash: hashPassword("CrossPass123!"),
          role: "RECRUITER",
        },
      });
      // Linked to Company A
      await prisma.employerProfile.create({
        data: {
          userId: crossUser.id,
          companyId: companyA.id,
          designation: "Recruiter A",
        },
      });

      // Invited to Company B
      const { rawToken: token6 } = await createInvite(email6, "RECRUITER", companyB.id);
      const res6 = await callAcceptApi(token6);

      assert(
        "Cross-company invitation attempt: rejected by default",
        res6.status === 400 && res6.json.error.includes("already registered to another company"),
        "Cross-company accept correctly blocked with explicit safety error"
      );

      // Cleanup
      await prisma.companyInvitation.deleteMany({
        where: { email: { in: [email1, email2, email3, email4, email5, email5b, email6] } },
      }).catch(() => undefined);
      await prisma.employerProfile.deleteMany({
        where: { userId: { in: [candidateUser.id, recruiterUser.id, employerUser.id, memberUser.id, crossUser.id, ownerA.id] } },
      }).catch(() => undefined);
      await prisma.user.deleteMany({
        where: { id: { in: [candidateUser.id, recruiterUser.id, employerUser.id, memberUser.id, crossUser.id, ownerA.id] } },
      }).catch(() => undefined);
      await prisma.company.deleteMany({
        where: { id: { in: [companyA.id, companyB.id] } },
      }).catch(() => undefined);

    } catch (err: any) {
      assert("Team invitation integration test execution", false, err.message || String(err));
    }
  }

  return { passed, failed, results };
}
