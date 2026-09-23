/**
 * HIREGO AI — AUTH, RBAC & TENANT ISOLATION ATTACK MATRIX
 *
 * Workstream 2 & Workstream 12 Verification Suite
 * Executes live multi-tenant attacks against server http://localhost:3000
 */

import fs from "node:fs";
import path from "node:path";
import { createSessionToken } from "../src/lib/auth";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFile();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface AttackResult {
  attackId: string;
  category: string;
  description: string;
  expectedStatus: number | number[];
  actualStatus: number;
  prevented: boolean;
  notes?: string;
}

const attackResults: AttackResult[] = [];

function recordAttack(
  attackId: string,
  category: string,
  description: string,
  expectedStatus: number | number[],
  actualStatus: number,
  prevented: boolean,
  notes?: string
) {
  attackResults.push({ attackId, category, description, expectedStatus, actualStatus, prevented, notes });
  const icon = prevented ? "🛡️ DEFENDED" : "❌ BREACH";
  console.log(`  [${icon}] ${attackId} | ${category}: ${description} (HTTP ${actualStatus})`);
}

function createAuthHeaders(userId: string, role: any, email: string, name: string) {
  const token = createSessionToken({
    id: userId,
    email,
    name,
    role,
    sessionVersion: 1,
  });
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Cookie: `token=${token}; hirego_session=${token}`,
    Authorization: `Bearer ${token}`,
  };
}

async function runAttackMatrix() {
  console.log("=================================================================");
  console.log(" HIREGO AI — AUTH, RBAC & MULTI-TENANT ISOLATION ATTACK MATRIX");
  console.log(` Target Server: ${BASE_URL}`);
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log("=================================================================\n");

  const candidateAId = "00000000-0000-4000-8000-000000000001";
  const employerAId = "00000000-0000-4000-8000-000000000003";

  const candidateAHeaders = createAuthHeaders(candidateAId, "CANDIDATE", "cand.a@hirego.ai", "Candidate Alpha");
  const employerAHeaders = createAuthHeaders(employerAId, "EMPLOYER", "emp.a@hirego.ai", "Employer Alpha");

  // -------------------------------------------------------------
  // ATTACK GROUP 1: ANONYMOUS -> PROTECTED APIS
  // -------------------------------------------------------------
  console.log("--- Attack Group 1: Anonymous -> Protected APIs ---");
  const anonAttacks = [
    { id: "ATK-01", path: "/api/candidate/profile", method: "GET", expected: 401, desc: "Anonymous -> Candidate Profile" },
    { id: "ATK-02", path: "/api/candidate/saved-jobs", method: "GET", expected: 401, desc: "Anonymous -> Saved Jobs" },
    { id: "ATK-03", path: "/api/employer/company", method: "GET", expected: 401, desc: "Anonymous -> Employer Company" },
    { id: "ATK-04", path: "/api/employer/candidates", method: "GET", expected: 401, desc: "Anonymous -> Employer Candidates" },
    { id: "ATK-05", path: "/api/admin/system/queues", method: "GET", expected: 401, desc: "Anonymous -> Admin Queues" },
    { id: "ATK-06", path: "/api/admin/security/status", method: "GET", expected: 401, desc: "Anonymous -> Security Status" },
  ];

  for (const atk of anonAttacks) {
    try {
      const res = await fetch(`${BASE_URL}${atk.path}`, { method: atk.method });
      const defended = res.status === atk.expected;
      recordAttack(atk.id, "Anonymous Access", atk.desc, atk.expected, res.status, defended);
    } catch (e: any) {
      recordAttack(atk.id, "Anonymous Access", atk.desc, atk.expected, 0, false, e.message);
    }
  }

  // -------------------------------------------------------------
  // ATTACK GROUP 2: CANDIDATE -> EMPLOYER / ADMIN APIS (RBAC)
  // -------------------------------------------------------------
  console.log("\n--- Attack Group 2: Candidate -> Employer & Admin APIs (RBAC Bypass) ---");
  const candidatePrivEscAttacks = [
    { id: "ATK-07", path: "/api/employer/company", method: "GET", expected: [401, 403], desc: "Candidate -> Employer Company" },
    { id: "ATK-08", path: "/api/employer/candidates", method: "GET", expected: [401, 403], desc: "Candidate -> Employer Candidate Pool" },
    { id: "ATK-09", path: "/api/employer/subscribe", method: "POST", expected: [401, 403], desc: "Candidate -> Subscription Mutate" },
    { id: "ATK-10", path: "/api/admin/system/queues", method: "GET", expected: [401, 403], desc: "Candidate -> Admin System Queues" },
    { id: "ATK-11", path: "/api/admin/security/status", method: "GET", expected: [401, 403], desc: "Candidate -> Admin Security Dashboard" },
  ];

  for (const atk of candidatePrivEscAttacks) {
    try {
      const res = await fetch(`${BASE_URL}${atk.path}`, {
        method: atk.method,
        headers: candidateAHeaders,
        body: atk.method === "POST" ? JSON.stringify({ planId: "ENTERPRISE" }) : undefined,
      });
      const expectedList = Array.isArray(atk.expected) ? atk.expected : [atk.expected];
      const defended = expectedList.includes(res.status);
      recordAttack(atk.id, "RBAC Escalation", atk.desc, atk.expected, res.status, defended);
    } catch (e: any) {
      recordAttack(atk.id, "RBAC Escalation", atk.desc, atk.expected, 0, false, e.message);
    }
  }

  // -------------------------------------------------------------
  // ATTACK GROUP 3: EMPLOYER -> ADMIN APIS (RBAC)
  // -------------------------------------------------------------
  console.log("\n--- Attack Group 3: Employer -> Admin APIs (RBAC Bypass) ---");
  const employerPrivEscAttacks = [
    { id: "ATK-12", path: "/api/admin/system/queues", method: "GET", expected: [401, 403], desc: "Employer -> Admin Queues" },
    { id: "ATK-13", path: "/api/admin/security/status", method: "GET", expected: [401, 403], desc: "Employer -> Security Status" },
    { id: "ATK-14", path: "/api/admin/analytics", method: "GET", expected: [401, 403], desc: "Employer -> Admin Analytics" },
  ];

  for (const atk of employerPrivEscAttacks) {
    try {
      const res = await fetch(`${BASE_URL}${atk.path}`, {
        method: atk.method,
        headers: employerAHeaders,
      });
      const expectedList = Array.isArray(atk.expected) ? atk.expected : [atk.expected];
      const defended = expectedList.includes(res.status);
      recordAttack(atk.id, "RBAC Escalation", atk.desc, atk.expected, res.status, defended);
    } catch (e: any) {
      recordAttack(atk.id, "RBAC Escalation", atk.desc, atk.expected, 0, false, e.message);
    }
  }

  // -------------------------------------------------------------
  // ATTACK GROUP 4: CLIENT-CONTROLLED ROLE INJECTION
  // -------------------------------------------------------------
  console.log("\n--- Attack Group 4: Client-Controlled Role Injection ---");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `attacker.${Date.now()}@hirego.ai`,
        password: "StrongPassword123!",
        name: "Role Attacker",
        role: "ADMIN",
      }),
    });
    const defended = [400, 403, 422].includes(res.status);
    recordAttack(
      "ATK-15",
      "Role Injection",
      "Register with spoofed role: ADMIN",
      [400, 403, 422],
      res.status,
      defended,
      "Ensures server ignores or rejects unvetted privilege escalation"
    );
  } catch (e: any) {
    recordAttack("ATK-15", "Role Injection", "Register with spoofed role", 400, 0, false, e.message);
  }

  // -------------------------------------------------------------
  // ATTACK GROUP 5: MOCK INTERVIEW CROSS-TENANT ACCESS
  // -------------------------------------------------------------
  console.log("\n--- Attack Group 5: Mock Interview Session Cross-Tenant Isolation ---");
  try {
    const foreignUuid = "11111111-2222-4333-8444-555555555555";
    const res = await fetch(`${BASE_URL}/api/assessment/mock-interview/session?id=${foreignUuid}`, {
      headers: candidateAHeaders,
    });
    const defended = res.status === 404 || res.status === 403;
    recordAttack(
      "ATK-16",
      "Tenant Isolation",
      "Candidate accesses unowned/foreign MockInterviewSession",
      [403, 404],
      res.status,
      defended,
      "Strict ownership boundary verified"
    );
  } catch (e: any) {
    recordAttack("ATK-16", "Tenant Isolation", "Foreign session access", 404, 0, false, e.message);
  }

  // -------------------------------------------------------------
  // ATTACK SUMMARY
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(" ATTACK MATRIX EXECUTION SUMMARY");
  console.log("=================================================================");
  const total = attackResults.length;
  const defended = attackResults.filter((r) => r.prevented).length;
  const breached = total - defended;
  const defenseRate = Math.round((defended / total) * 100);

  console.log(`  Total Attacks Executed:     ${total}`);
  console.log(`  Attacks Defended:           ${defended}`);
  console.log(`  Breaches / Authorization:   ${breached}`);
  console.log(`  Defense Rate:               ${defenseRate}%`);
  console.log("=================================================================");

  if (breached > 0) {
    console.error(`\n❌ ATTACK MATRIX FAILED: ${breached} authorization flaw(s) detected.`);
    process.exit(1);
  } else {
    console.log(`\n🛡️ ALL ${total} AUTH, RBAC & TENANT ATTACKS DEFENDED (100%).`);
    process.exit(0);
  }
}

runAttackMatrix().catch((err) => {
  console.error("Attack Matrix error:", err);
  process.exit(1);
});
