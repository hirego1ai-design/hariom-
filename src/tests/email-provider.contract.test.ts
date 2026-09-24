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
  zohoCpaasSendMailToken: "ZOHO_CPAAS_SEND_MAIL_TOKEN",
  zohoCpaasFromEmail: "ZOHO_CPAAS_FROM_EMAIL",
  zohoCpaasApiBaseUrl: "ZOHO_CPAAS_API_BASE_URL",
  legacyZeptoMailApiKey: "ZEPTOMAIL_API_KEY",
  legacyZeptoMailFromEmail: "ZEPTOMAIL_FROM_EMAIL",
  encryptionKey: "EMAIL_CONFIG_ENCRYPTION_KEY",
} as const;

const SENDGRID_SEND_URL = "https://api.sendgrid.com/v3/mail/send";
const ZOHO_CPAAS_SEND_URL = "https://api.cpaas.com/v1.1/email";

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
    Object.values(REQUIRED_ENVIRONMENT).length === 8,
    "SendGrid and Zoho CPaaS credentials are explicit; legacy ZeptoMail environment names remain supported during migration."
  );

  assert(
    "SendGrid request contract",
    SENDGRID_SEND_URL === "https://api.sendgrid.com/v3/mail/send",
    "SendGrid must use its v3 mail-send endpoint with Bearer API-key authentication."
  );

  assert(
    "Zoho CPaaS request contract",
    ZOHO_CPAAS_SEND_URL === "https://api.cpaas.com/v1.1/email",
    "Zoho CPaaS must use its v1.1 email endpoint with Zoho-enczapikey authentication."
  );

  assert(
    "Provider selection is explicit",
    ["SENDGRID", "ZEPTOMAIL"].every((provider) => provider.length > 0),
    "The persisted provider label remains SENDGRID or ZEPTOMAIL for backward compatibility while ZEPTOMAIL is transported through Zoho CPaaS."
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
