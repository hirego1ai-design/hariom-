type TestEnvironment = Record<string, string | undefined>;

/** Test flags alone are not authority to write to an arbitrary database. */
export function assertDisposableTestEnvironment(env: TestEnvironment = process.env): void {
  if (env.NODE_ENV === "production" || env.HIREGO_TEST_DATABASE !== "1") {
    throw new Error("Tests blocked: explicitly select a disposable database with HIREGO_TEST_DATABASE=1 outside production.");
  }
  const targets = ["DATABASE_URL", "DIRECT_URL"].map((key) => {
    let url: URL;
    try { url = new URL(env[key] || ""); } catch {
      throw new Error(`Tests blocked: ${key} must be a valid disposable PostgreSQL URL.`);
    }
    if (!["postgres:", "postgresql:"].includes(url.protocol)
      || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      || !/^\/(hirego_ci|hirego_test(?:_[a-z0-9]+)?)$/.test(url.pathname)
      || [...url.searchParams.keys()].some((parameter) => !["schema", "sslmode", "connection_limit", "pool_timeout"].includes(parameter))
      || url.hash) {
      throw new Error(`Tests blocked: ${key} must target localhost and a hirego_ci or hirego_test database; URL overrides are forbidden.`);
    }
    return `${url.hostname}:${url.port || "5432"}${url.pathname}`;
  });
  if (targets[0] !== targets[1]) {
    throw new Error("Tests blocked: DATABASE_URL and DIRECT_URL must target the same disposable database.");
  }
  if (env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Tests blocked: remove external Redis credentials from the isolated test environment.");
  }
}

/** Provider tests must install explicit fetch stubs; regression runs never send live traffic. */
export async function withBlockedProviderNetwork<T>(run: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Live provider HTTP calls are disabled in the regression suite. Install an explicit test stub."); };
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}
