const directWorkerMode =
  process.env.RAILWAY_DIRECT_BACKGROUND_WORKER === "true";

const DIRECT_WORKER_REQUIRED_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "S3_BUCKET_NAME",
  "S3_REGION",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "VIDEO_ANALYSIS_WORKER_URL",
  "VIDEO_ANALYSIS_INTERNAL_TOKEN",
];

function assertDirectWorkerEnvironment() {
  const missing = DIRECT_WORKER_REQUIRED_ENV.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (process.env.VIDEO_ANALYSIS_ENABLED !== "true") {
    missing.push("VIDEO_ANALYSIS_ENABLED=true");
  }
  if (
    !process.env.VIDEO_ANALYSIS_CALLBACK_ORIGIN?.trim() &&
    !process.env.NEXT_PUBLIC_APP_URL?.trim()
  ) {
    missing.push("VIDEO_ANALYSIS_CALLBACK_ORIGIN or NEXT_PUBLIC_APP_URL");
  }
  if (missing.length > 0) {
    throw new Error(
      `Railway direct worker configuration is incomplete: ${missing.join(", ")}`,
    );
  }
}

async function runDirectWorker() {
  assertDirectWorkerEnvironment();

  const [
    { runRecordedAssessmentRecovery },
    { OutboxPoller },
    { registerProductionConsumers },
  ] = await Promise.all([
    import("../src/lib/recordedAssessmentRecovery.ts"),
    import("../src/lib/events/Outbox.ts"),
    import("../src/lib/events/ProductionConsumers.ts"),
  ]);

  registerProductionConsumers();

  const stopAt = Date.now() + 45_000;
  const reports = [];
  let totalDispatched = 0;
  let totalFailed = 0;
  let totalUnhandled = 0;

  for (let pass = 0; pass < 10 && Date.now() < stopAt; pass++) {
    const report = await OutboxPoller.pollAndProcess(50, 60_000, stopAt);
    reports.push(report);
    totalDispatched += report.dispatched;
    totalFailed += report.failed;
    totalUnhandled += report.unhandled;
    if (report.claimed === 0) break;
  }

  if (totalFailed > 0 || totalUnhandled > 0) {
    throw new Error(
      `Outbox recovery incomplete: failed=${totalFailed}, unhandled=${totalUnhandled}`,
    );
  }

  const batchSize = Number(
    process.env.RECORDED_ASSESSMENT_RECOVERY_BATCH_SIZE || 20,
  );
  const recordedAssessment = await runRecordedAssessmentRecovery(batchSize);

  return {
    mode: "direct",
    outbox: {
      dispatched: totalDispatched,
      failed: totalFailed,
      unhandled: totalUnhandled,
      passes: reports.length,
    },
    recordedAssessment: {
      scanned: recordedAssessment.scanned,
      staleProcessingMinutes: recordedAssessment.staleProcessingMinutes,
      dispatched: recordedAssessment.results.filter((entry) => entry.dispatched)
        .length,
    },
  };
}

function getHttpSchedulerConfig() {
  const secret = process.env.CRON_SECRET?.trim();
  const bypassSecret =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const appUrl = process.env.APP_URL?.trim();

  if (!secret || secret.length < 32) {
    throw new Error("Configure CRON_SECRET with at least 32 characters.");
  }
  if (!appUrl) {
    throw new Error("Configure APP_URL for Railway scheduler fallback mode.");
  }
  if (bypassSecret && bypassSecret.length < 32) {
    throw new Error(
      "VERCEL_AUTOMATION_BYPASS_SECRET must be at least 32 characters when configured.",
    );
  }

  const origin = new URL(appUrl);
  if (origin.username || origin.password) {
    throw new Error("APP_URL must not contain credentials.");
  }
  const internalHttp =
    process.env.ALLOW_INTERNAL_HTTP === "1" &&
    ["app", "localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (
    origin.protocol !== "https:" &&
    !(origin.protocol === "http:" && internalHttp)
  ) {
    throw new Error(
      "APP_URL must use HTTPS outside the private local app network.",
    );
  }

  return {
    origin,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(bypassSecret
        ? { "x-vercel-protection-bypass": bypassSecret }
        : {}),
    },
  };
}

async function invokeCronEndpoint(origin, headers, path, timeoutMs) {
  const endpoint = new URL(path, origin);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      redirect: "error",
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(`${path} failed with HTTP ${response.status}`);
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

async function runHttpSchedulerFallback() {
  const { origin, headers } = getHttpSchedulerConfig();

  const outbox = await invokeCronEndpoint(
    origin,
    headers,
    "/api/cron/events-outbox",
    70_000,
  );
  const recordedAssessment = await invokeCronEndpoint(
    origin,
    headers,
    "/api/cron/recorded-assessment-analysis",
    90_000,
  );

  return {
    mode: "http-fallback",
    outbox: {
      dispatched: outbox.totalDispatched ?? null,
      failed: outbox.totalFailed ?? null,
      unhandled: outbox.totalUnhandled ?? null,
      passes: outbox.passes ?? null,
    },
    recordedAssessment: {
      scanned: recordedAssessment.scanned ?? null,
      staleProcessingMinutes:
        recordedAssessment.staleProcessingMinutes ?? null,
      dispatched: Array.isArray(recordedAssessment.results)
        ? recordedAssessment.results.filter((entry) => entry?.dispatched).length
        : null,
    },
  };
}

try {
  const result = directWorkerMode
    ? await runDirectWorker()
    : await runHttpSchedulerFallback();

  console.log(
    JSON.stringify({
      worker: "hirego-background-recovery",
      at: new Date().toISOString(),
      status: "completed",
      ...result,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      worker: "hirego-background-recovery",
      at: new Date().toISOString(),
      status: "failed",
      mode: directWorkerMode ? "direct" : "http-fallback",
      message:
        error instanceof Error ? error.message : "Background worker failed",
    }),
  );
  process.exitCode = 1;
}
