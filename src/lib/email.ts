import { getConfiguredEmailProvider, getConfiguredEmailProviders, type EmailProvider, type EmailProviderRuntimeConfig } from "@/lib/email-delivery-config";
import { buildPublicAppUrl } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailDeliveryResult = { success: boolean; messageId: string; provider?: EmailProvider; reason?: string };

const EMAIL_PROVIDER_TIMEOUT_MS = 10_000;

class EmailProviderDispatchError extends Error {
  constructor(message: string, readonly canFailover: boolean) {
    super(message);
  }
}

async function sendWithSendGrid(message: EmailMessage, apiKey: string, sender: string, messageId: string): Promise<EmailDeliveryResult> {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(EMAIL_PROVIDER_TIMEOUT_MS),
    redirect: "error",
    cache: "no-store",
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: sender },
      subject: message.subject,
      content: [
        { type: "text/plain", value: message.text || message.html.replace(/<[^>]*>/g, " ") },
        { type: "text/html", value: message.html },
      ],
    }),
  });
  if (!response.ok) throw new EmailProviderDispatchError(`SendGrid returned ${response.status}`, response.status >= 400 && response.status < 500);
  return { success: true, messageId: response.headers.get("x-message-id") || messageId, provider: "SENDGRID" };
}

async function sendWithZeptoMail(message: EmailMessage, apiKey: string, sender: string, messageId: string): Promise<EmailDeliveryResult> {
  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Zoho-enczapikey ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(EMAIL_PROVIDER_TIMEOUT_MS),
    redirect: "error",
    cache: "no-store",
    body: JSON.stringify({
      from: { address: sender },
      to: [{ email_address: { address: message.to } }],
      subject: message.subject,
      htmlbody: message.html,
      textbody: message.text,
    }),
  });
  if (!response.ok) throw new EmailProviderDispatchError(`ZeptoMail returned ${response.status}`, response.status >= 400 && response.status < 500);
  const body = await response.json().catch(() => null);
  const providerMessageId = body?.data?.[0]?.message_id || body?.message_id;
  return { success: true, messageId: providerMessageId || messageId, provider: "ZEPTOMAIL" };
}

export interface ZeptoMailTemplateMessage {
  to: string;
  templateKey?: string;
  templateAlias?: string;
  mergeInfo: Record<string, string | number | boolean | null>;
}

async function sendZeptoMailStoredTemplate(
  message: ZeptoMailTemplateMessage,
  apiKey: string,
  sender: string,
  messageId: string
): Promise<EmailDeliveryResult> {
  if (!message.templateKey && !message.templateAlias) {
    throw new EmailProviderDispatchError("ZeptoMail template key or alias is required.", false);
  }
  const response = await fetch("https://api.zeptomail.com/v1.1/email/template", {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Zoho-enczapikey ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(EMAIL_PROVIDER_TIMEOUT_MS),
    redirect: "error",
    cache: "no-store",
    body: JSON.stringify({
      from: { address: sender },
      to: [{ email_address: { address: message.to } }],
      ...(message.templateKey ? { template_key: message.templateKey } : { template_alias: message.templateAlias }),
      merge_info: message.mergeInfo,
    }),
  });
  if (!response.ok) throw new EmailProviderDispatchError(`ZeptoMail template API returned ${response.status}`, response.status >= 400 && response.status < 500);
  const body = await response.json().catch(() => null);
  return { success: true, messageId: body?.data?.[0]?.message_id || body?.message_id || messageId, provider: "ZEPTOMAIL" };
}

export async function sendZeptoMailTemplate(message: ZeptoMailTemplateMessage): Promise<EmailDeliveryResult> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const provider = await getConfiguredEmailProvider("ZEPTOMAIL");
  if (!provider) return { success: false, messageId, provider: "ZEPTOMAIL" };
  try {
    return await sendZeptoMailStoredTemplate(message, provider.apiKey, provider.fromEmail, messageId);
  } catch (error) {
    console.error("[Email Dispatch] ZeptoMail template delivery failed", error);
    return { success: false, messageId, provider: "ZEPTOMAIL" };
  }
}

export async function sendEmail(
  message: EmailMessage,
  options?: { provider?: EmailProvider; allowFallback?: boolean }
): Promise<EmailDeliveryResult> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const isProduction = process.env.NODE_ENV === "production";
  let providers: EmailProviderRuntimeConfig[];
  try {
    providers = options?.provider
      ? [await getConfiguredEmailProvider(options.provider)].filter((provider): provider is EmailProviderRuntimeConfig => Boolean(provider))
      : await getConfiguredEmailProviders();
  } catch (error) {
    console.error("[Email Dispatch] Unable to load an email provider configuration.", error);
    providers = [];
  }

  for (const provider of providers) {
    try {
      if (provider.provider === "SENDGRID") {
        return await sendWithSendGrid(message, provider.apiKey, provider.fromEmail, messageId);
      }
      return await sendWithZeptoMail(message, provider.apiKey, provider.fromEmail, messageId);
    } catch (error) {
      console.error(`[Email Dispatch] ${provider.provider} delivery failed`, error);
      // Never retry on an uncertain network/5xx result: the first provider may
      // have already accepted the OTP. Fall back only after a definitive 4xx rejection.
      if (options?.provider || options?.allowFallback === false || !(error instanceof EmailProviderDispatchError && error.canFailover)) break;
    }
  }

  if (isProduction) {
    console.error("[Email Dispatch] No usable production email provider is configured.");
    return { success: false, messageId };
  }

  console.log(`[Email Dispatch] Development-only message to: ${message.to} | Subject: "${message.subject}" | ID: ${messageId}`);

  return {
    success: true,
    messageId,
  };
}

export function getWelcomeEmailTemplate(name: string): EmailMessage {
  return {
    to: "",
    subject: "Welcome to HireGo AI — Your AI-Powered Career Hub",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0A0A0C; color: #ffffff; padding: 32px; borderRadius: 16px;">
        <h1 style="color: #448AFF;">Welcome to HireGo AI, ${name}!</h1>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your account is active. Explore thousands of AI-matched jobs, benchmark your skills, and schedule AI mock interviews to boost your hireability score.
        </p>
        <a href="${buildPublicAppUrl("/candidate/dashboard")}" style="display: inline-block; background-color: #448AFF; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          Go to Dashboard
        </a>
      </div>
    `,
  };
}

export function getInterviewInviteTemplate(candidateName: string, jobTitle: string, time: string): EmailMessage {
  return {
    to: "",
    subject: `Interview Scheduled: ${jobTitle} at HireGo AI`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0A0A0C; color: #ffffff; padding: 32px; borderRadius: 16px;">
        <h2 style="color: #FF5252;">Interview Scheduled</h2>
        <p style="color: #9CA3AF;">Hi ${candidateName},</p>
        <p style="color: #9CA3AF;">
          You have an upcoming AI Proctor & Technical Interview session for the <strong>${jobTitle}</strong> position.
        </p>
        <p style="color: #ffffff; font-weight: bold;">Time: ${time}</p>
        <a href="${buildPublicAppUrl("/interviews")}" style="display: inline-block; background-color: #FF5252; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          Join Interview Room
        </a>
      </div>
    `,
  };
}
