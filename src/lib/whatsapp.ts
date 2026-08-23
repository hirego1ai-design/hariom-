/**
 * HireGo WhatsApp — Provider transport layer.
 * All outbound message functions live here.
 * Business logic lives in whatsapp-onboarding.ts.
 */

export const DEFAULT_META_GRAPH_VERSION = "v21.0";

export function getMetaGraphVersion(): string {
  return process.env.META_GRAPH_VERSION || DEFAULT_META_GRAPH_VERSION;
}

export function getMetaGraphBaseUrl(): string {
  const version = getMetaGraphVersion();
  return `https://graph.facebook.com/${version}`;
}

export interface WaConfig {
  token: string;
  phoneNumberId: string;
  appSecret?: string;
  verifyToken?: string;
}

export function isPlaceholderSecret(secret?: string | null): boolean {
  if (!secret) return true;
  const lower = secret.toLowerCase().trim();
  return (
    lower.includes("set-a-long") ||
    lower.includes("eaagz...w0192") ||
    lower.includes("your-meta-") ||
    lower.includes("placeholder") ||
    lower === ""
  );
}

export function validateWhatsAppConfig(): { valid: boolean; error?: string; config?: WaConfig } {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  const isProd = process.env.NODE_ENV === "production";

  if (!token || !phoneNumberId) {
    if (isProd) {
      return { valid: false, error: "WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be configured in production." };
    }
    return { valid: false, error: "WhatsApp provider is not configured." };
  }

  if (isProd) {
    if (isPlaceholderSecret(token)) {
      return { valid: false, error: "WHATSAPP_API_TOKEN contains placeholder value." };
    }
    if (isPlaceholderSecret(phoneNumberId)) {
      return { valid: false, error: "WHATSAPP_PHONE_NUMBER_ID contains placeholder value." };
    }
    if (isPlaceholderSecret(appSecret)) {
      return { valid: false, error: "WHATSAPP_APP_SECRET must be configured in production." };
    }
    if (isPlaceholderSecret(verifyToken)) {
      return { valid: false, error: "WHATSAPP_VERIFY_TOKEN must be configured in production." };
    }
  }

  return {
    valid: true,
    config: { token, phoneNumberId, appSecret, verifyToken },
  };
}

function getWaConfig(): WaConfig | null {
  const validation = validateWhatsAppConfig();
  if (!validation.valid || !validation.config) return null;
  return validation.config;
}

// ─── Outbound Retry & Backoff Helper ──────────────────────────────────────────

export interface FetchRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: FetchRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelayMs = 250,
    maxDelayMs = 2500,
    backoffFactor = 2,
  } = retryOptions;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      const response = await fetch(url, options);

      // Do not retry successful responses or non-retryable client errors (400, 401, 403, 404, 422)
      const status = response.status;
      const isRetryableStatus = status === 429 || (status >= 500 && status <= 599);

      if (!isRetryableStatus || attempt >= maxRetries) {
        return response;
      }

      attempt++;
      const jitter = Math.random() * 100;
      const sleepMs = Math.min(delay, maxDelayMs) + jitter;
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
      delay *= backoffFactor;
    } catch (error: any) {
      if (attempt >= maxRetries) {
        throw error;
      }
      attempt++;
      const jitter = Math.random() * 100;
      const sleepMs = Math.min(delay, maxDelayMs) + jitter;
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
      delay *= backoffFactor;
    }
  }
}

// ─── Text message ────────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ sent: boolean; reason?: string; messageId?: string }> {
  return sendWhatsAppTextMessage(phone, message);
}

export async function sendWhatsAppTextMessage(
  phone: string,
  message: string
): Promise<{ sent: boolean; reason?: string; messageId?: string }> {
  const cfg = getWaConfig();
  if (!cfg) return { sent: false, reason: "WhatsApp provider is not configured." };

  // Normalize: strip all non-digit characters for the API
  const to = phone.replace(/\D/g, "");
  if (!to) return { sent: false, reason: "Invalid phone number." };

  try {
    const baseUrl = getMetaGraphBaseUrl();
    const response = await fetchWithRetry(`${baseUrl}/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return { sent: false, reason: `WhatsApp API returned ${response.status}: ${errText}` };
    }

    const data = await response.json();
    return { sent: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { sent: false, reason: err?.message || "Network error sending WhatsApp message." };
  }
}

// ─── Interactive list message ─────────────────────────────────────────────────

export interface WhatsAppListSection {
  title: string;
  rows: Array<{ id: string; title: string; description?: string }>;
}

export async function sendWhatsAppInteractiveList(
  phone: string,
  headerText: string,
  bodyText: string,
  buttonLabel: string,
  sections: WhatsAppListSection[]
): Promise<{ sent: boolean; reason?: string; messageId?: string }> {
  const cfg = getWaConfig();
  if (!cfg) return { sent: false, reason: "WhatsApp provider is not configured." };

  const to = phone.replace(/\D/g, "");
  if (!to) return { sent: false, reason: "Invalid phone number." };

  try {
    const baseUrl = getMetaGraphBaseUrl();
    const response = await fetchWithRetry(`${baseUrl}/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: headerText },
          body: { text: bodyText },
          action: {
            button: buttonLabel,
            sections,
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return { sent: false, reason: `WhatsApp API returned ${response.status}: ${errText}` };
    }

    const data = await response.json();
    return { sent: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { sent: false, reason: err?.message || "Network error." };
  }
}

// ─── Button reply message ─────────────────────────────────────────────────────

export async function sendWhatsAppButtonMessage(
  phone: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<{ sent: boolean; reason?: string; messageId?: string }> {
  const cfg = getWaConfig();
  if (!cfg) return { sent: false, reason: "WhatsApp provider is not configured." };

  const to = phone.replace(/\D/g, "");
  if (!to) return { sent: false, reason: "Invalid phone number." };

  // WhatsApp interactive buttons allow max 3; fallback to text if more
  if (buttons.length > 3) {
    const numbered = buttons.map((b, i) => `${i + 1}. ${b.title}`).join("\n");
    return sendWhatsAppTextMessage(phone, `${bodyText}\n\n${numbered}`);
  }

  try {
    const baseUrl = getMetaGraphBaseUrl();
    const response = await fetchWithRetry(`${baseUrl}/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: {
            buttons: buttons.map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title },
            })),
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return { sent: false, reason: `WhatsApp API returned ${response.status}: ${errText}` };
    }

    const data = await response.json();
    return { sent: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { sent: false, reason: err?.message || "Network error." };
  }
}

// ─── Mark message as read ─────────────────────────────────────────────────────

export async function markWhatsAppMessageRead(messageId: string): Promise<void> {
  const cfg = getWaConfig();
  if (!cfg) return;

  try {
    const baseUrl = getMetaGraphBaseUrl();
    await fetchWithRetry(`${baseUrl}/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch {
    // Non-critical — silently ignore
  }
}
