import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const EMAIL_PROVIDERS = ["SENDGRID", "ZEPTOMAIL"] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export type EmailProviderRuntimeConfig = {
  provider: EmailProvider;
  apiKey: string;
  fromEmail: string;
};

export type EmailDeliverySettings = {
  primaryProvider: EmailProvider;
  fallbackProvider: EmailProvider;
  autoFailover: boolean;
  sendgridEnabled: boolean;
  zeptoMailEnabled: boolean;
  sendgridFromEmail: string;
  zeptoMailFromEmail: string;
  sendgridKeyConfigured: boolean;
  zeptoMailKeyConfigured: boolean;
  updatedAt: string | null;
};

const CONFIG_ID = "global-email-delivery";

function providerFrom(value: string | null | undefined, fallback: EmailProvider): EmailProvider {
  return value === "ZEPTOMAIL" || value === "SENDGRID" ? value : fallback;
}

function encryptionKey(): Buffer {
  const configured = process.env.EMAIL_CONFIG_ENCRYPTION_KEY?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAIL_CONFIG_ENCRYPTION_KEY is required before API keys can be saved in production.");
    }
    return createHash("sha256").update("hirego-local-email-config-key").digest();
  }

  const raw = /^[a-fA-F0-9]{64}$/.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64");
  if (raw.length !== 32) {
    throw new Error("EMAIL_CONFIG_ENCRYPTION_KEY must be a 32-byte base64 value or 64-character hex value.");
  }
  return raw;
}

export function encryptEmailProviderSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), ciphertext.toString("base64url"), tag.toString("base64url")].join(":");
}

export function decryptEmailProviderSecret(value: string): string {
  const [version, encodedIv, encodedCiphertext, encodedTag] = value.split(":");
  if (version !== "v1" || !encodedIv || !encodedCiphertext || !encodedTag) {
    throw new Error("Stored email provider credential has an invalid format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(encodedIv, "base64url"));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encodedCiphertext, "base64url")), decipher.final()]).toString("utf8");
}

function environmentConfig(provider: EmailProvider): EmailProviderRuntimeConfig | null {
  const apiKey = provider === "SENDGRID" ? process.env.SENDGRID_API_KEY : process.env.ZEPTOMAIL_API_KEY;
  const fromEmail = provider === "SENDGRID" ? process.env.SENDGRID_FROM_EMAIL : process.env.ZEPTOMAIL_FROM_EMAIL;
  return apiKey && fromEmail ? { provider, apiKey, fromEmail } : null;
}

async function databaseConfig() {
  try {
    return await prisma.emailDeliveryConfig.findUnique({ where: { id: CONFIG_ID } });
  } catch (error) {
    console.error("[Email Dispatch] Unable to load admin delivery configuration.", error);
    return null;
  }
}

function resolveProviderConfig(
  provider: EmailProvider,
  stored: Awaited<ReturnType<typeof databaseConfig>>
): EmailProviderRuntimeConfig | null {
  const isEnabled = provider === "SENDGRID" ? stored?.sendgridEnabled ?? true : stored?.zeptoMailEnabled ?? Boolean(environmentConfig("ZEPTOMAIL"));
  if (!isEnabled) return null;

  const encryptedKey = provider === "SENDGRID" ? stored?.sendgridApiKeyEncrypted : stored?.zeptoMailApiKeyEncrypted;
  const configuredFromEmail = provider === "SENDGRID" ? stored?.sendgridFromEmail : stored?.zeptoMailFromEmail;
  const fallback = environmentConfig(provider);
  const apiKey = encryptedKey ? decryptEmailProviderSecret(encryptedKey) : fallback?.apiKey;
  const fromEmail = configuredFromEmail || fallback?.fromEmail;
  return apiKey && fromEmail ? { provider, apiKey, fromEmail } : null;
}

export async function getEmailDeliverySettings(): Promise<EmailDeliverySettings> {
  const stored = await databaseConfig();
  const sendgridFromEmail = stored?.sendgridFromEmail || process.env.SENDGRID_FROM_EMAIL || "";
  const zeptoMailFromEmail = stored?.zeptoMailFromEmail || process.env.ZEPTOMAIL_FROM_EMAIL || "";
  return {
    primaryProvider: providerFrom(stored?.primaryProvider, "SENDGRID"),
    fallbackProvider: providerFrom(stored?.fallbackProvider, "ZEPTOMAIL"),
    autoFailover: stored?.autoFailover ?? true,
    sendgridEnabled: stored?.sendgridEnabled ?? Boolean(environmentConfig("SENDGRID")),
    zeptoMailEnabled: stored?.zeptoMailEnabled ?? Boolean(environmentConfig("ZEPTOMAIL")),
    sendgridFromEmail,
    zeptoMailFromEmail,
    sendgridKeyConfigured: Boolean(stored?.sendgridApiKeyEncrypted || process.env.SENDGRID_API_KEY),
    zeptoMailKeyConfigured: Boolean(stored?.zeptoMailApiKeyEncrypted || process.env.ZEPTOMAIL_API_KEY),
    updatedAt: stored?.updatedAt.toISOString() || null,
  };
}

export async function getConfiguredEmailProviders(): Promise<EmailProviderRuntimeConfig[]> {
  const stored = await databaseConfig();
  const primaryProvider = providerFrom(stored?.primaryProvider, "SENDGRID");
  const fallbackProvider = providerFrom(stored?.fallbackProvider, "ZEPTOMAIL");
  const primary = resolveProviderConfig(primaryProvider, stored);
  const fallback = stored?.autoFailover ?? true
    ? resolveProviderConfig(fallbackProvider, stored)
    : null;

  return [primary, fallback].filter(
    (provider): provider is EmailProviderRuntimeConfig => Boolean(provider)
  ).filter((provider, index, all) => all.findIndex((item) => item.provider === provider.provider) === index);
}

export async function getConfiguredEmailProvider(provider: EmailProvider): Promise<EmailProviderRuntimeConfig | null> {
  return resolveProviderConfig(provider, await databaseConfig());
}

export type EmailDeliverySettingsInput = {
  primaryProvider: EmailProvider;
  fallbackProvider: EmailProvider;
  autoFailover: boolean;
  sendgridEnabled: boolean;
  zeptoMailEnabled: boolean;
  sendgridFromEmail?: string;
  zeptoMailFromEmail?: string;
  sendgridApiKey?: string;
  zeptoMailApiKey?: string;
};

export async function saveEmailDeliverySettings(input: EmailDeliverySettingsInput) {
  const data = {
    primaryProvider: input.primaryProvider,
    fallbackProvider: input.fallbackProvider,
    autoFailover: input.autoFailover,
    sendgridEnabled: input.sendgridEnabled,
    zeptoMailEnabled: input.zeptoMailEnabled,
    sendgridFromEmail: input.sendgridFromEmail || null,
    zeptoMailFromEmail: input.zeptoMailFromEmail || null,
    ...(input.sendgridApiKey ? { sendgridApiKeyEncrypted: encryptEmailProviderSecret(input.sendgridApiKey) } : {}),
    ...(input.zeptoMailApiKey ? { zeptoMailApiKeyEncrypted: encryptEmailProviderSecret(input.zeptoMailApiKey) } : {}),
  };
  await prisma.emailDeliveryConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, ...data },
    update: data,
  });
  return getEmailDeliverySettings();
}
