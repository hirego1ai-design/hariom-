// Read-only anonymous HTTP checks against the credential-isolated audit server.
// Fixed loopback target: this script never accepts a staging/production URL.
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3107';
const cases = [
  ['/', [200]],
  ['/login', [200]],
  ['/admin/login', [200]],
  ['/employer/employer-sign-in', [200]],
  ['/admin/system/queue-broker', [307]],
  ['/employer/hiring-pipeline', [307]],
  ['/api/admin/system/queues', [401]],
  ['/api/admin/security/status', [401]],
  ['/api/auth/me', [401]],
  ['/api/employer/candidates', [401]],
  ['/api/employer/subscribe', [401]],
  ['/api/employer/hiring-pipeline/readiness', [401]],
  ['/api/internal/workflows/recover', [503]],
];
let failed = 0;
for (const [path, expected] of cases) {
  try {
    const response = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
    assert.ok(expected.includes(response.status), `expected ${expected}, got ${response.status}`);
    if (response.status === 307) {
      const location = new URL(response.headers.get('location'), base);
      assert.equal(location.origin, base);
      assert.match(location.pathname, /login|sign-in/);
    }
    if (path === '/login') {
      const csp = response.headers.get('content-security-policy');
      assert.ok(csp?.includes('https://checkout.razorpay.com'));
      assert.ok(!csp.includes("'unsafe-eval'"));
    }
    await response.body?.cancel();
    console.log(`PASS ${path} (${response.status})`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${path}: ${error.message}`);
  }
}
console.log(`${cases.length - failed}/${cases.length} anonymous HTTP smoke checks passed. Authenticated workflows were not tested.`);
process.exitCode = failed ? 1 : 0;
