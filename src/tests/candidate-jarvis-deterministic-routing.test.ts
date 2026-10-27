import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { classifyCandidateDirectIntent } from "../lib/jarvis/CandidateIntentRouter";

test("basic navigation, application status, schedules and recommendations do not require a model", () => {
  const cases: Array<[string, string]> = [
    ["hi", "GREETING"],
    ["Hi Jarvis", "GREETING"],
    ["Hello Jarvis!", "GREETING"],
    ["Hey HireGo AI", "GREETING"],
    ["नमस्ते जार्विस", "GREETING"],
    ["नमस्ते", "GREETING"],
    ["मुझे मेरी एप्लीकेशन दिखाओ", "APPLICATION_STATUS"],
    ["मेरा अगला इंटरव्यू कब है", "NEXT_INTERVIEW"],
    ["मेरा प्रोफाइल खोलो", "OPEN_PROFILE"],
    ["मेरा वॉलेट दिखाओ", "OPEN_CREDITS"],
    ["मॉक इंटरव्यू शुरू करें", "OPEN_MOCK_INTERVIEW"],
    ["Namaste!", "GREETING"],
    ["show my applications", "APPLICATION_STATUS"],
    ["what is my application status", "APPLICATION_STATUS"],
    ["how many applications", "APPLICATION_COUNT"],
    ["next interview", "NEXT_INTERVIEW"],
    ["interview kab hai", "NEXT_INTERVIEW"],
    ["find matching jobs", "RECOMMENDATIONS"],
    ["jobs for me", "RECOMMENDATIONS"],
    ["open profile", "OPEN_PROFILE"],
    ["practice interview", "OPEN_MOCK_INTERVIEW"],
    ["credit balance", "CREDIT_BALANCE"],
    ["what is my wallet balance", "CREDIT_BALANCE"],
    ["open dashboard", "OPEN_DASHBOARD"],
    ["browse jobs", "OPEN_JOBS"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(classifyCandidateDirectIntent(input)?.kind, expected, input);
  }
});

test("database-backed job searches retain user filters without an LLM", () => {
  assert.deepEqual(classifyCandidateDirectIntent("find React developer jobs in Noida"), {
    kind: "SEARCH_JOBS", query: "react developer", location: "noida",
  });
  assert.deepEqual(classifyCandidateDirectIntent("jobs in Bangalore"), {
    kind: "SEARCH_JOBS", query: null, location: "bangalore",
  });
  assert.deepEqual(classifyCandidateDirectIntent("show latest jobs"), {
    kind: "SEARCH_JOBS", query: null, location: null,
  });
});

test("AI reasoning is never mislabeled as a deterministic lookup", () => {
  for (const prompt of [
    "Why was my application rejected?",
    "Compare these two job offers and advise me",
    "How should I prepare for a backend interview?",
    "Find remote jobs with a salary above 25L",
    "Help me negotiate a better salary",
    "Hi Jarvis, please help me compare job offers",
  ]) {
    assert.equal(classifyCandidateDirectIntent(prompt), null, prompt);
  }
});

test("consequential actions require explicit portal confirmation and are never executed by Jarvis", () => {
  for (const prompt of ["apply for a job", "cancel interview", "withdraw application", "purchase credits"]) {
    assert.equal(classifyCandidateDirectIntent(prompt)?.kind, "CONFIRM_IN_PORTAL", prompt);
  }
});

test("fast intent classification precedes candidate queries and billable provider routing", () => {
  const service = fs.readFileSync(path.resolve(process.cwd(), "src/lib/jarvis/CandidateJarvisService.ts"), "utf8");
  const endpoint = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/candidate/jarvis/route.ts"), "utf8");
  const gate = service.indexOf("const intent = classifyCandidateDirectIntent(message);", service.indexOf("export async function executeCandidateJarvis"));
  const context = service.indexOf("const context = await loadCandidateContext(params.userId, config);", gate);
  const billable = service.indexOf("const ai = await runAiDecision", gate);
  assert.ok(gate >= 0 && context > gate && billable > context);
  assert.ok(service.includes('intent.kind === "SEARCH_JOBS"'));
  assert.ok(service.includes("return searchJobs(intent.query, intent.location)"));
  assert.ok(service.includes('scope === "FULL" || scope === "APPLICATIONS"'));
  assert.ok(service.includes('scope === "FULL" || scope === "INTERVIEWS"'));
  assert.ok(service.includes('scope === "FULL" || scope === "RECOMMENDATIONS"'));
  assert.ok(service.includes("activePublicJobWhere(new Date())"));
  assert.ok(service.includes("prisma.application.count("));
  assert.ok(service.includes("prisma.candidateCreditWallet.findUnique("));
  assert.ok(service.includes("candidateProfileId: ownedProfile.id"));
  assert.ok(service.includes('path: "FAST"'));
  assert.ok(!endpoint.includes("paymentOrder.create("));
  assert.ok(!endpoint.includes("application.create("));
});
