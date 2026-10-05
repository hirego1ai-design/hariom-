import pg from "pg";

const { Client } = pg;
const rawUrl = process.env.DATABASE_URL?.trim();

if (process.env.HIREGO_TEST_DATABASE !== "1") {
  throw new Error("Refusing CI bootstrap without HIREGO_TEST_DATABASE=1.");
}
if (!rawUrl) {
  throw new Error("DATABASE_URL is required for isolated CI bootstrap.");
}

const parsed = new URL(rawUrl);
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
const allowedDatabases = new Set(["hirego_ci", "hirego_test_phase5"]);

if (!allowedHosts.has(parsed.hostname) || !allowedDatabases.has(databaseName)) {
  throw new Error("Refusing CI bootstrap outside the approved local test databases.");
}

parsed.searchParams.delete("schema");
const client = new Client({ connectionString: parsed.toString() });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "AdminConfiguration" (
      "id" TEXT NOT NULL DEFAULT 'global-admin-config',
      "platformConfig" JSONB,
      "securityPolicy" JSONB,
      "managedHiringConfig" JSONB,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "AdminConfiguration_pkey" PRIMARY KEY ("id")
    )
  `);

  await client.query(`
    INSERT INTO "AdminConfiguration"
      ("id", "platformConfig", "updatedAt")
    VALUES
      ('global-admin-config', '{}'::jsonb, NOW())
    ON CONFLICT ("id") DO NOTHING
  `);

  console.log("Isolated CI AdminConfiguration singleton is ready.");
} finally {
  await client.end();
}
