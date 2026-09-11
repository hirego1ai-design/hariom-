import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchEmployerCandidates, pipelineStageLabels, pipelineStageStatus } from "../lib/employerCandidates";
import { razorpayCheckoutFields, subscriptionCredits } from "../lib/payments/subscriptionCredits";

test("pipeline fetch includes applications beyond the first 100 and preserves duplicate candidate applications", async () => {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    const page = urls.length;
    return Response.json({ success: true, candidates: [{ id: "same-candidate", applicationId: `app-${page}` }],
      pagination: { nextCursor: page < 3 ? `cursor-${page}` : null } });
  };
  try {
    assert.deepEqual(await fetchEmployerCandidates(), [1, 2, 3].map(n => ({ id: "same-candidate", applicationId: `app-${n}` })));
    assert.equal(urls[0], "/api/employer/candidates?limit=100");
    assert.match(urls[2], /cursor=cursor-2/);
  } finally { globalThis.fetch = original; }
});

test("pipeline rejects failed later pages instead of presenting partial results as complete", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({ success: true, candidates: [{ id: "first" }], pagination: { nextCursor: "second" } })
    : Response.json({ success: false, error: "Database unavailable" }, { status: 503 });
  try { await assert.rejects(fetchEmployerCandidates(), /Database unavailable/); }
  finally { globalThis.fetch = original; }
});

test("pipeline detects repeated cursors instead of an endless fetch loop", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true, candidates: [], pagination: { nextCursor: "same" } });
  try { await assert.rejects(fetchEmployerCandidates(), /did not advance/); }
  finally { globalThis.fetch = original; }
});

test("persisted hiring stages survive page reload without label loss", () => {
  for (const status of ["SCREENING", "ASSESSMENT", "AI_INTERVIEW", "SHORTLISTED", "HIRED", "REJECTED"]) {
    assert.equal(pipelineStageStatus(pipelineStageLabels[status]), status);
  }
  assert.throws(() => pipelineStageStatus("Documentation"), /Unsupported/);
});

test("paid plan provisions every quota including agent, application, download and verification credits", () => {
  assert.deepEqual(subscriptionCredits({ jobPostsQuota: 1, resumeUnlocksQuota: 2, aiInterviewsQuota: 3,
    applicationsQuota: 4, resumeDownloadsQuota: 5, backgroundVerificationsQuota: 6 }), {
    jobPostsLeft: 1, resumeUnlocksLeft: 2, aiInterviewsLeft: 3, aiAgentCreditsLeft: 3,
    applicationsLeft: 4, resumeDownloadsLeft: 5, backgroundVerificationsLeft: 6,
  });
});

test("corrupt negative plan quotas cannot reduce credits on purchase", () => {
  assert.throws(() => subscriptionCredits({ jobPostsQuota: 1, resumeUnlocksQuota: 2, aiInterviewsQuota: -1,
    applicationsQuota: 4, resumeDownloadsQuota: 5, backgroundVerificationsQuota: 6 }), /invalid credit quotas/);
});

test("Razorpay uses server issued key, order amount and currency", () => {
  assert.deepEqual(razorpayCheckoutFields({ keyId: "rzp_test_verified", gatewayOrderId: "order_verified",
    finalAmount: 123.45, currency: "INR" }), {
    key: "rzp_test_verified", order_id: "order_verified", amount: 12345, currency: "INR",
  });
});

test("Razorpay refuses missing configuration and invalid amounts rather than using a fabricated key", () => {
  assert.throws(() => razorpayCheckoutFields({ gatewayOrderId: "order", finalAmount: 1, currency: "INR" }), /incomplete/);
  assert.throws(() => razorpayCheckoutFields({ keyId: "key", gatewayOrderId: "order", finalAmount: Number.NaN, currency: "INR" }), /incomplete/);
});
