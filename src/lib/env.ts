import { assertSafeOutboundServiceUrl, parseAllowedHosts } from "@/lib/security/outboundUrl";

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
    assertSafeOutboundServiceUrl(workerUrl, {
      label: "VIDEO_ANALYSIS_WORKER_URL",
      requireHttps: true,
      allowedHosts: parseAllowedHosts(process.env.VIDEO_ANALYSIS_ALLOWED_HOSTS),
    });
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
  assertSafeOutboundServiceUrl(url, {
    label: "MALWARE_SCANNER_URL",
    requireHttps: true,
    allowedHosts: parseAllowedHosts(process.env.MALWARE_SCANNER_ALLOWED_HOSTS),
  });
  return { url, token: getOptionalEnv("MALWARE_SCANNER_TOKEN") };
}

export function buildPublicAppUrl(path: string): string {
  const host = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return new URL(path, host).toString();
}

