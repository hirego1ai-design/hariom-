// Run a local build/server without loading deployment credentials from .env files.
import fs from "node:fs";
import { spawn } from "node:child_process";

const action = process.argv[2];
if (!["build", "start"].includes(action)) throw new Error("Expected build or start.");
const isolatedEnv = { ...process.env };
for (const file of fs.readdirSync(".").filter((name) => name.startsWith(".env") && fs.statSync(name).isFile())) {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const key = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1];
    if (key) isolatedEnv[key] = "";
  }
}
for (const key of Object.keys(isolatedEnv)) {
  if (/SECRET|TOKEN|API_KEY|DATABASE_URL|DIRECT_URL|REDIS|S3_|SMTP|SENDGRID|ZEPTOMAIL|QSTASH|WHATSAPP|RAZORPAY|GEMINI|OPENAI|MOCK_DB|NODE_OPTIONS/.test(key)) isolatedEnv[key] = "";
}
Object.assign(isolatedEnv, {
  NODE_ENV: "production",
  HIREGO_AUDIT_BUILD: "1",
  DATABASE_URL: "postgresql://audit:audit@127.0.0.1:1/hirego_audit?connect_timeout=2",
  DIRECT_URL: "postgresql://audit:audit@127.0.0.1:1/hirego_audit?connect_timeout=2",
  NEXTAUTH_SECRET: "local-audit-only-secret-not-for-deployment-2026",
  JWT_SECRET: "local-audit-only-secret-not-for-deployment-2026",
  SESSION_SECRET: "local-audit-only-secret-not-for-deployment-2026",
  INTERNAL_API_KEY: "local-audit-internal-not-for-deployment-2026",
  APP_URL: "http://127.0.0.1:3107",
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3107",
  NEXT_TELEMETRY_DISABLED: "1",
});
const args = ["node_modules/next/dist/bin/next", action];
if (action === "start") args.push("--hostname", "127.0.0.1", "--port", "3107");
const child = spawn(process.execPath, args, { env: isolatedEnv, stdio: "inherit" });
child.on("error", () => { console.error("Local audit process could not start."); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
