const PLACEHOLDER = /placeholder|your[-_ ]|change[-_ ]me|set-a-long/i;

export function requireProductionEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || PLACEHOLDER.test(value)) {
    throw new Error(`${name} must be configured with a non-placeholder value in production.`);
  }
  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function assertSafeHttpsServiceUrl(name: string, value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error(`${name} must be a credential-free HTTPS URL in production.`);
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blocked =
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "metadata.google.internal" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) {
    throw new Error(`${name} must not target localhost, link-local, metadata, or private-network hosts.`);
  }
  return parsed.toString().replace(/\/$/, "");
}

export function requireRedisEnv() {
  return {
    url: requireProductionEnv("UPSTASH_REDIS_REST_URL"),
    token: requireProductionEnv("UPSTASH_REDIS_REST_TOKEN"),
  };
}

export function requireStorageEnv() {
  return {
    bucket: requireProductionEnv("S3_BUCKET_NAME"),
    region: requireProductionEnv("S3_REGION"),
    accessKeyId: requireProductionEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireProductionEnv("S3_SECRET_ACCESS_KEY"),
    endpoint: getOptionalEnv("S3_ENDPOINT"),
  };
}

export function getVideoAnalysisConfig() {
  const enabled = process.env.VIDEO_ANALYSIS_ENABLED === "true";
  let workerUrl = process.env.VIDEO_ANALYSIS_WORKER_URL?.trim() || "http://localhost:8000";
  let internalToken = process.env.VIDEO_ANALYSIS_INTERNAL_TOKEN?.trim() || "dev-internal-token-change-in-prod";
  const maxSeconds = Number(process.env.VIDEO_ANALYSIS_MAX_SECONDS || 120);
  const timeoutSeconds = Number(process.env.VIDEO_ANALYSIS_TIMEOUT_SECONDS || 600);
  const retentionDays = Number(process.env.VIDEO_ANALYSIS_RETENTION_DAYS || 30);

  if (enabled && process.env.NODE_ENV === "production") {
    workerUrl = requireProductionEnv("VIDEO_ANALYSIS_WORKER_URL");
    internalToken = requireProductionEnv("VIDEO_ANALYSIS_INTERNAL_TOKEN");
    workerUrl = assertSafeHttpsServiceUrl("VIDEO_ANALYSIS_WORKER_URL", workerUrl);
    if (internalToken.length < 32) {
      throw new Error("VIDEO_ANALYSIS_INTERNAL_TOKEN must contain at least 32 characters in production.");
    }
    if (!Number.isInteger(maxSeconds) || maxSeconds !== 120) {
      throw new Error("VIDEO_ANALYSIS_MAX_SECONDS must be exactly 120 in production.");
    }
    if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 30 || timeoutSeconds > 3_600) {
      throw new Error("VIDEO_ANALYSIS_TIMEOUT_SECONDS must be an integer between 30 and 3600.");
    }
    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3_650) {
      throw new Error("VIDEO_ANALYSIS_RETENTION_DAYS must be an integer between 1 and 3650.");
    }
  }

  return {
    enabled,
    workerUrl,
    internalToken,
    maxSeconds,
    timeoutSeconds,
    retentionDays,
    whisperModelSize: process.env.WHISPER_MODEL_SIZE?.trim() || "small",
    whisperDevice: process.env.WHISPER_DEVICE?.trim() || "cpu",
    whisperComputeType: process.env.WHISPER_COMPUTE_TYPE?.trim() || "int8",
  };
}

export function requireMalwareScannerEnv() {
  const url = requireProductionEnv("MALWARE_SCANNER_URL");
  return { url: assertSafeHttpsServiceUrl("MALWARE_SCANNER_URL", url), token: getOptionalEnv("MALWARE_SCANNER_TOKEN") };
}

export function buildPublicAppUrl(path: string): string {
  const host = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return new URL(path, host).toString();
}

