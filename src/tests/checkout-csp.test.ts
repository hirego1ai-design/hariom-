import assert from "node:assert/strict";
import test from "node:test";
import { contentSecurityPolicy } from "../lib/securityHeaders";

function sources(policy: string, directive: string) {
  return policy.split("; ").find((entry) => entry.startsWith(`${directive} `))?.split(" ").slice(1) ?? [];
}

test("checkout can load the configured provider SDK and hosted frames", () => {
  const policy = contentSecurityPolicy(false);
  assert.ok(sources(policy, "script-src").includes("https://checkout.razorpay.com"));
  assert.ok(sources(policy, "frame-src").includes("https://api.razorpay.com"));
  assert.ok(sources(policy, "frame-src").includes("https://checkout.razorpay.com"));
  assert.ok(!sources(policy, "script-src").includes("https:"));
  assert.ok(!sources(policy, "script-src").includes("'unsafe-eval'"));
  assert.deepEqual(sources(policy, "object-src"), ["'none'"]);
  assert.deepEqual(sources(policy, "frame-ancestors"), ["'none'"]);
});

test("HTTP development assets are not upgraded to unsupported HTTPS", () => {
  assert.ok(!contentSecurityPolicy(true).includes("upgrade-insecure-requests"));
  assert.ok(contentSecurityPolicy(false).includes("upgrade-insecure-requests"));
});
