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
  return {
    enabled: process.env.VIDEO_ANALYSIS_ENABLED === "true",
    workerUrl: process.env.VIDEO_ANALYSIS_WORKER_URL?.trim() || "http://localhost:8000",
    internalToken: process.env.VIDEO_ANALYSIS_INTERNAL_TOKEN?.trim() || "dev-internal-token-change-in-prod",
    maxSeconds: Number(process.env.VIDEO_ANALYSIS_MAX_SECONDS || 120),
    timeoutSeconds: Number(process.env.VIDEO_ANALYSIS_TIMEOUT_SECONDS || 600),
    retentionDays: Number(process.env.VIDEO_ANALYSIS_RETENTION_DAYS || 30),
    whisperModelSize: process.env.WHISPER_MODEL_SIZE?.trim() || "small",
    whisperDevice: process.env.WHISPER_DEVICE?.trim() || "cpu",
    whisperComputeType: process.env.WHISPER_COMPUTE_TYPE?.trim() || "int8",
  };
}
