import assert from "node:assert/strict";
import { test } from "node:test";
import { assertDisposableTestEnvironment, withBlockedProviderNetwork } from "./test-safety";

const localUrl = "postgresql://postgres:postgres@localhost:5432/hirego_ci?schema=public";
const valid = { HIREGO_TEST_DATABASE: "1", DATABASE_URL: localUrl, DIRECT_URL: localUrl };

test("accepts the explicit CI database without making a connection", () => {
  assert.doesNotThrow(() => assertDisposableTestEnvironment(valid));
});

for (const [name, overrides] of Object.entries({
  "missing explicit opt-in": { HIREGO_TEST_DATABASE: undefined },
  "production process": { NODE_ENV: "production" },
  "missing direct URL": { DIRECT_URL: undefined },
  "remote runtime URL with local direct URL": { DATABASE_URL: "postgresql://test:localhost@db.example.com:5432/postgres" },
  "local runtime URL with remote direct URL": { DIRECT_URL: "postgresql://test@db.example.com:5432/hirego_ci" },
  "remote hostname containing localhost": { DATABASE_URL: "postgresql://user@localhost.attacker.example/hirego_test" },
  "local production database": { DATABASE_URL: "postgresql://user@localhost/postgres" },
  "URL connection host override": { DATABASE_URL: localUrl + "&host=db.example.com" },
  "URL socket override": { DATABASE_URL: localUrl + "&socket=/tmp" },
  "mismatched databases": { DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/hirego_test" },
  "external Redis": { UPSTASH_REDIS_REST_URL: "https://redis.example.com" },
  "non-PostgreSQL URL": { DATABASE_URL: "https://localhost/hirego_ci" },
})) {
  test(`rejects ${name}`, () => {
    assert.throws(() => assertDisposableTestEnvironment({ ...valid, ...overrides }), /Tests blocked:/);
  });
}

test("blocks provider HTTP before dispatch and restores the transport after an error", async () => {
  const originalFetch = globalThis.fetch;
  let contactedProvider = false;
  const sentinel: typeof fetch = async () => { contactedProvider = true; return new Response(); };
  globalThis.fetch = sentinel;
  try {
    await assert.rejects(withBlockedProviderNetwork(() => fetch("https://provider.example.com/send")), /Live provider HTTP calls are disabled/);
    assert.equal(contactedProvider, false);
    assert.equal(globalThis.fetch, sentinel);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("explicit provider stubs can be tested without an actual HTTP request", async () => {
  const originalFetch = globalThis.fetch;
  const response = await withBlockedProviderNetwork(async () => {
    globalThis.fetch = async () => new Response("stubbed response");
    return (await fetch("https://provider.example.com/send")).text();
  });
  assert.equal(response, "stubbed response");
  assert.equal(globalThis.fetch, originalFetch);
});
