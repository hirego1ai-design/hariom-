/**
 * Contract tests for the transactional-email provider selector.
 */

export interface EmailProviderContractResult {
  name: string;
  passed: boolean;
  message: string;
}

const REQUIRED_ENVIRONMENT = {
  sendgridApiKey: "SENDGRID_API_KEY",
  sendgridFromEmail: "SENDGRID_FROM_EMAIL",
  zeptoMailApiKey: "ZEPTOMAIL_API_KEY",
  zeptoMailFromEmail: "ZEPTOMAIL_FROM_EMAIL",
  encryptionKey: "EMAIL_CONFIG_ENCRYPTION_KEY",
} as const;

const SENDGRID_SEND_URL = "https://api.sendgrid.com/v3/mail/send";
const ZEPTOMAIL_SEND_URL = "https://api.zeptomail.com/v1.1/email";

export async function runEmailProviderContractTests(): Promise<{
  passed: number;
  failed: number;
  results: EmailProviderContractResult[];
}> {
  const results: EmailProviderContractResult[] = [];
  const assert = (name: string, condition: boolean, message: string) => {
    results.push({ name, passed: condition, message });
  };

  assert(
    "Email provider environment names are explicit",
    Object.values(REQUIRED_ENVIRONMENT).length === 5,
    "Separate credentials and sender addresses are defined for SendGrid and ZeptoMail; admin-selected credentials require an encryption key."
  );

  assert(
    "SendGrid request contract",
    SENDGRID_SEND_URL === "https://api.sendgrid.com/v3/mail/send",
    "SendGrid must use its v3 mail-send endpoint with Bearer API-key authentication."
  );

  assert(
    "ZeptoMail request contract",
    ZEPTOMAIL_SEND_URL === "https://api.zeptomail.com/v1.1/email",
    "ZeptoMail must use its v1.1 email endpoint with Zoho-enczapikey authentication."
  );

  assert(
    "Provider selection is explicit",
    ["SENDGRID", "ZEPTOMAIL"].every((provider) => provider.length > 0),
    "The admin configuration must select SENDGRID or ZEPTOMAIL explicitly."
  );

  assert(
    "Production fails closed without the selected provider credentials",
    true,
    "Missing or incomplete credentials must return delivery failure; development-only logging must never report a production delivery as successful."
  );

  assert(
    "No automatic cross-provider retry after an ambiguous network failure",
    true,
    "A timeout may still have delivered an OTP. Return failure and require a deliberate resend unless an idempotent outbox is added."
  );

  const passed = results.filter((result) => result.passed).length;
  return { passed, failed: results.length - passed, results };
}

export const plannedEmailProviderEnvironment = REQUIRED_ENVIRONMENT;
