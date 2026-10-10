import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assertSafeOutboundServiceUrl } from "@/lib/security/outboundUrl";
import { llmProviderSchema, type LlmProviderName } from "./AiRoutingConfig";

const envName: Record<LlmProviderName, string> = {
  openai: "OPENAI_API_KEY", gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY", kimi: "KIMI_API_KEY",
  qwen: "QWEN_API_KEY", self_hosted: "SELF_HOSTED_LLM_API_KEY",
};

const defaultEndpoints: Record<LlmProviderName, string | undefined> = {
  openai: undefined,
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  deepseek: "https://api.deepseek.com",
  kimi: "https://api.moonshot.cn/v1",
  qwen: undefined,
  self_hosted: undefined,
};

function environmentEndpoint(provider: LlmProviderName): string | undefined {
  if (provider === "self_hosted") return process.env.SELF_HOSTED_LLM_BASE_URL?.trim() || undefined;
  const name = provider.toUpperCase() + "_BASE_URL";
  return process.env[name]?.trim() || defaultEndpoints[provider];
}

/**
 * One deployment-level master key, never transmitted to browsers. Keys are not
 * derivable from the JWT secret and no development fallback is permitted.
 */
function encryptionKey(): Buffer {
  const raw = process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY must be configured before saving AI credentials.");
  const key = /^[a-fA-F0-9]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY must be 32 bytes (base64 or 64 hex characters).");
  return key;
}

export function encryptAiProviderKey(provider: LlmProviderName, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from("hirego:ai-provider:" + provider + ":v1"));
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), body.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(":");
}

export function decryptAiProviderKey(provider: LlmProviderName, value: string): string {
  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("AI credential record format is invalid.");
  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[3], "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("AI credential record format is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAAD(Buffer.from("hirego:ai-provider:" + provider + ":v1"));
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(Buffer.from(parts[2], "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Stored AI provider credential cannot be decrypted. Check the configured encryption key.");
  }
}

/** Only approved public HTTPS API destinations may be entered through Admin. */
export function validateAiProviderEndpoint(provider: LlmProviderName, raw: string): string {
  if (provider !== "qwen" && provider !== "self_hosted") {
    throw new Error("This provider uses its audited server endpoint; custom endpoints are not editable here.");
  }
  const url = assertSafeOutboundServiceUrl(raw, { label: "AI provider endpoint", requireHttps: true });
  if (url.search || url.hash) throw new Error("AI provider endpoint cannot contain query or fragment.");
  const host = url.hostname.toLowerCase();
  if (provider === "qwen" && !["dashscope.aliyuncs.com", "dashscope-intl.aliyuncs.com", "dashscope-us.aliyuncs.com"].includes(host)) {
    throw new Error("Qwen endpoint must use an official DashScope API host.");
  }
  if (provider === "self_hosted") {
    const allowed = (process.env.AI_SELF_HOSTED_ALLOWED_HOSTS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
    if (!allowed.length || !allowed.includes(host)) {
      throw new Error("Self-hosted endpoint hostname must be explicitly listed in AI_SELF_HOSTED_ALLOWED_HOSTS.");
    }
  }
  return url.toString();
}

export type AiProviderResolution = {
  provider: LlmProviderName;
  apiKey: string | null;
  baseURL: string | undefined;
  source: "admin" | "environment" | "none";
  hasStoredKey: boolean;
  hasEnvironmentKey: boolean;
  updatedAt: string | null;
  configured: boolean;
  reason: string | null;
};

/**
 * Reads the authoritative DB on each call; no per-instance credential cache,
 * so key rotations work across Vercel instances without redeployment.
 * Admin-secret rows supersede environment keys, which remain a fallback.
 */
export async function resolveAiProvider(provider: LlmProviderName): Promise<AiProviderResolution> {
  const record = await prisma.aiProviderCredential.findUnique({ where: { provider } });
  const environmentKey = (process.env[envName[provider]] || "").trim();
  const hasStoredKey = Boolean(record?.apiKeyEncrypted);
  let apiKey: string | null = null;
  let unreadable = false;
  if (record?.apiKeyEncrypted) {
    try {
      apiKey = decryptAiProviderKey(provider, record.apiKeyEncrypted).trim() || null;
    } catch {
      unreadable = true;
    }
  } else {
    apiKey = environmentKey || null;
  }
  const baseURL = record?.baseUrl || environmentEndpoint(provider);
  const configured = !unreadable && Boolean(apiKey) && Boolean(provider !== "qwen" && provider !== "self_hosted" || baseURL);
  const reason = unreadable
    ? "Stored credential cannot be decrypted; verify AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY."
    : !apiKey ? envName[provider] + " or an Admin API key is required."
    : !baseURL && (provider === "qwen" || provider === "self_hosted")
      ? "Provider endpoint is missing." : null;
  return {
    provider, apiKey, baseURL, hasStoredKey, hasEnvironmentKey: Boolean(environmentKey),
    source: hasStoredKey ? "admin" : environmentKey ? "environment" : "none",
    updatedAt: record?.updatedAt.toISOString() || null, configured, reason,
  };
}

export async function getResolvedAiProviderStatuses() {
  const results = await Promise.all(llmProviderSchema.options.map(resolveAiProvider));
  return results.map(({ provider, configured, reason }) => ({
    provider, configured, status: configured ? "CONFIGURED" : "MISSING_CONFIGURATION", reason,
  }));
}

export async function getAiProviderCredentialAdminView() {
  const results = await Promise.all(llmProviderSchema.options.map(resolveAiProvider));
  return results.map(({ provider, baseURL, configured, reason, source, hasStoredKey, hasEnvironmentKey, updatedAt }) => ({
    provider, baseUrl: provider === "qwen" || provider === "self_hosted" ? baseURL || "" : null,
    configured, reason, source, hasStoredKey, hasEnvironmentKey, updatedAt,
  }));
}
