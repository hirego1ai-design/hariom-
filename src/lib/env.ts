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
