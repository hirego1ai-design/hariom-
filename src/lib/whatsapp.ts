/**
 * HireGo WhatsApp — Provider transport layer.
 * All outbound message functions live here.
 * Business logic lives in whatsapp-onboarding.ts.
 */

const WA_API_BASE = "https://graph.facebook.com/v20.0";

function getWaConfig(): { token: string; phoneNumberId: string } | null {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
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
    const response = await fetch(`${WA_API_BASE}/${cfg.phoneNumberId}/messages`, {
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
    const response = await fetch(`${WA_API_BASE}/${cfg.phoneNumberId}/messages`, {
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
    const response = await fetch(`${WA_API_BASE}/${cfg.phoneNumberId}/messages`, {
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
    await fetch(`${WA_API_BASE}/${cfg.phoneNumberId}/messages`, {
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
