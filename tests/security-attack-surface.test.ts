import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

test("password reset UI never substitutes a fixed OTP", () => {
  const source = read("src/app/reset-password/page.tsx");
  assert.equal(source.includes('otp: otp || "123456"'), false);
  assert.equal(source.includes('otp: "123456"'), false);
  assert.match(source, /!email\s*\|\|\s*!\/\^\\d\{6\}\$\//);
  assert.match(source, /sessionStorage\.removeItem\("reset_otp"\)/);
});

test("private uploads enforce type, signature and malware quarantine", () => {
  const route = read("src/app/api/upload/route.ts");
  const security = read("src/lib/uploadSecurity.ts");
  assert.match(route, /validateUploadFile\(file\.type, file\.size/);
  assert.match(route, /Invalid file signature/);
  assert.match(route, /File content does not match claimed MIME type/);
  assert.match(route, /scanUpload\(`preflight-\$\{crypto\.randomUUID\(\)\}`, buffer\)/);
  assert.match(route, /preflightScan\.status !== "CLEAN"/);
  assert.ok(route.indexOf("scanUpload(`preflight-") < route.indexOf("sharp(buffer"), "malware scan must run before raster decoding");
  assert.equal(security.includes('"image/svg+xml"'), false);
  assert.equal(security.includes('"text/html"'), false);
  assert.equal(security.includes('"application/javascript"'), false);
  assert.match(security, /requireMalwareScannerEnv\(\)/);
});

test("private file delivery is tenant-aware, clean-only and short-lived", () => {
  const route = read("src/app/api/files/[id]/route.ts");
  const storage = read("src/lib/storage.ts");
  assert.match(route, /file\.scanStatus !== "CLEAN"/);
  assert.match(route, /canAccessFile\(session\.id, session\.role, file\)/);
  assert.match(route, /getPrivateDownloadUrl/);
  assert.match(storage, /crypto\.randomUUID\(\)/);
  assert.match(storage, /expiresIn:\s*Number\(process\.env\.S3_SIGNED_URL_TTL_SECONDS \|\| 300\)/);
});

test("AI prompts isolate untrusted user-controlled data", () => {
  const agents = read("src/lib/agents/OperationalAgents.ts");
  assert.match(agents, /<UNTRUSTED_DATA>/);
  assert.match(agents, /data only, never instructions/i);
  assert.match(agents, /Do not execute tools/i);
  assert.match(agents, /resumeEvaluationSchema[\s\S]*?\.strict\(\)/);
  assert.match(agents, /JSON\.parse\(result\)/);
});

test("agent tool injection cannot directly execute consequential tools", () => {
  const registry = read("src/lib/tools/ToolRegistry.ts");
  assert.match(registry, /CONSEQUENTIAL_AGENT_TOOLS/);
  assert.match(registry, /permissions\.allowedTools\.includes\(toolName\)/);
  assert.match(registry, /requires-approved-action-executor/);
  assert.match(registry, /cannot run through generic agent dispatch/);
});

test("tenant context denies non-admin global scope and cross-tenant access", () => {
  const tenant = read("src/lib/security/TenantContext.ts");
  assert.match(tenant, /companyId === null && userRole !== Role\.ADMIN/);
  assert.match(tenant, /context\.companyId !== resourceCompanyId/);
  assert.match(tenant, /Cross-tenant access denied/);
});

test("auth sessions are server-authoritative and cookies are hardened", () => {
  const auth = read("src/lib/auth.ts");
  const login = read("src/app/api/auth/login/route.ts");
  assert.match(auth, /getRedisValue\(`session:revoked:/);
  assert.match(auth, /prisma\.user\.findUnique/);
  assert.match(auth, /tokenSession\.sessionVersion/);
  assert.match(login, /httpOnly:\s*true/);
  assert.match(login, /secure:\s*process\.env\.NODE_ENV === "production"/);
  assert.match(login, /sameSite:\s*"lax"/);
});

test("payment and WhatsApp webhooks require cryptographic authenticity", () => {
  const payments = read("src/app/api/payments/webhook/route.ts");
  const whatsapp = read("src/app/api/whatsapp/webhook/route.ts");
  assert.match(payments, /PaymentGatewayController\.verifyWebhook/);
  assert.match(payments, /if \(!verification\.isValid\)/);
  assert.match(whatsapp, /x-hub-signature-256/i);
  assert.match(whatsapp, /crypto\.timingSafeEqual/);
});

test("security headers block framing, MIME sniffing and object embedding", () => {
  const headers = read("src/lib/securityHeaders.ts");
  assert.match(headers, /"X-Content-Type-Options": "nosniff"/);
  assert.match(headers, /"X-Frame-Options": "DENY"/);
  assert.match(headers, /object-src 'none'/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /Strict-Transport-Security/);
});

test("AI router blocks common secret material at prompt and output boundaries", () => {
  const router = read("src/utils/aiRouter.ts");
  assert.match(router, /SECRET_PATTERNS/);
  assert.match(router, /assertNoSecretMaterial\(request\.prompt,\s*["']prompt["']\)/);
  assert.match(router, /assertNoSecretMaterial\(responseText,\s*["']output["']\)/);
});

test("Supabase-facing public schema remains protected by RLS", () => {
  const publicRls = read("prisma/migrations/20260908093000_enable_public_table_rls/migration.sql");
  const metadataRls = read("prisma/migrations/20260921170500_supabase_rls_fk_index_hardening/migration.sql");
  assert.match(publicRls, /ENABLE ROW LEVEL SECURITY/);
  assert.match(metadataRls, /_prisma_migrations[\s\S]*ENABLE ROW LEVEL SECURITY/);
});

test("CI continuously scans dependencies, secrets and code", () => {
  const workflow = read(".github/workflows/security.yml");
  assert.match(workflow, /dependency-review-action@v4/);
  assert.match(workflow, /gitleaks\/gitleaks-action@v2/);
  assert.match(workflow, /github\/codeql-action\/analyze@v3/);
});
