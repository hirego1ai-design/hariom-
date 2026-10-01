import { prisma } from "@/lib/prisma";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";
import {
  COMMUNICATION_EVENT_REGISTRY,
  type CommunicationAudience,
  type CommunicationChannel,
  type CommunicationEventKey,
  type CommunicationEventDefinition,
  validateTemplateVariables,
} from "./catalog";
import { sendWhatsAppTemplateMessage, type WhatsAppTemplateComponent } from "@/lib/whatsapp";
import { sendEmail, sendZeptoMailTemplate, type EmailDeliveryResult } from "@/lib/email";
import { getConfiguredEmailProviders } from "@/lib/email-delivery-config";
import { isWhatsAppMessagingAllowed } from "@/lib/whatsapp-identity";
import { writeAgentApprovalAudit } from "@/lib/security/AgentApprovalAudit";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import {
  recordCopilotUsageAfterExecutionIfActive,
  type CopilotUsageReference,
} from "@/lib/copilot/capacity";

export const COMMUNICATION_REPLAY_VERSION = 2;
const COMMUNICATION_REPLAY_TTL_MS = 15 * 60 * 1000;

type CommunicationReplayEnvelope = {
  recipient: string;
  variables: Record<string, string | number | boolean | null>;
  templateDigest: string;
};

type ProviderTemplate = {
  provider: string | null;
  providerAlias: string | null;
  providerParameterOrder: unknown;
  locale: string;
  providerTemplateId: string | null;
  enabled: boolean;
  status: string;
  subject: string | null;
  body: string;
};

function renderCommunicationTemplate(
  value: string,
  variables: Record<string, string | number | boolean | null>,
) {
  return value.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => String(variables[key] ?? ""),
  );
}

function escapeCommunicationHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] || character,
  );
}

function renderCommunicationHtmlTemplate(
  value: string,
  variables: Record<string, string | number | boolean | null>,
) {
  return value.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => escapeCommunicationHtml(String(variables[key] ?? "")),
  );
}

function communicationEmailHtml(value: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body{margin:0;background:#f5f7fb;color:#101828;font-family:Arial,sans-serif}
      .email-shell{padding:28px 12px}
      .email-card{max-width:640px;margin:0 auto;background:#fff;border:1px solid #eaecf0;border-radius:16px;padding:28px}
      .email-logo img{max-width:160px;height:auto;display:block;margin-bottom:22px}
      .eyebrow{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#667085;margin-bottom:10px}
      h1,h2,h3{color:#101828;line-height:1.25}
      p{color:#344054;line-height:1.65}
      .email-footer{margin-top:28px;padding-top:18px;border-top:1px solid #eaecf0;color:#667085;font-size:12px;line-height:1.6}
      a{word-break:break-word}
    </style>
  </head>
  <body>${value}</body>
</html>`;
}

function communicationEmailText(value: string) {
  return value
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function communicationTemplateReplayDigest(template: ProviderTemplate) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        provider: template.provider,
        providerAlias: template.providerAlias,
        providerParameterOrder: template.providerParameterOrder,
        locale: template.locale,
        providerTemplateId: template.providerTemplateId,
        enabled: template.enabled,
        status: template.status,
        subject: template.subject,
        body: template.body,
      }),
    )
    .digest("hex");
}

function communicationHashSecret() {
  const secret = process.env.COMMUNICATION_HASH_SECRET?.trim();
  if (
    process.env.NODE_ENV === "production" &&
    (
      !secret ||
      secret.length < 32 ||
      /placeholder|your[-_ ]|change[-_ ]me|set-a-long/i.test(secret)
    )
  ) {
    throw new Error(
      "COMMUNICATION_HASH_SECRET must be a non-placeholder secret of at least 32 characters in production.",
    );
  }
  return secret || "hirego-dev-communication-hash";
}

function communicationReplayEncryptionKey() {
  return createHmac("sha256", communicationHashSecret())
    .update("hirego:communication-replay:v2")
    .digest();
}

function encryptCommunicationReplayEnvelope(envelope: CommunicationReplayEnvelope) {
  const plaintext = JSON.stringify(envelope);
  if (Buffer.byteLength(plaintext, "utf8") > 32 * 1024) {
    throw new Error("Communication replay envelope exceeds the allowed size.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", communicationReplayEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v2",
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url"),
  ].join(":");
}

function decryptCommunicationReplayEnvelope(value: string): CommunicationReplayEnvelope {
  const [version, encodedIv, encodedCiphertext, encodedTag] = value.split(":");
  if (version !== "v2" || !encodedIv || !encodedCiphertext || !encodedTag) {
    throw new Error("Stored communication replay envelope has an invalid format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    communicationReplayEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const parsed = JSON.parse(plaintext) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stored communication replay envelope is invalid.");
  }
  const candidate = parsed as Record<string, unknown>;
  if (
    typeof candidate.recipient !== "string" ||
    candidate.recipient.length < 1 ||
    candidate.recipient.length > 1000 ||
    !candidate.variables ||
    typeof candidate.variables !== "object" ||
    Array.isArray(candidate.variables) ||
    typeof candidate.templateDigest !== "string" ||
    !/^[a-f0-9]{64}$/.test(candidate.templateDigest)
  ) {
    throw new Error("Stored communication replay envelope is invalid.");
  }
  return {
    recipient: candidate.recipient,
    variables: candidate.variables as Record<string, string | number | boolean | null>,
    templateDigest: candidate.templateDigest,
  };
}

function providerHttpStatus(reason: string | undefined) {
  if (!reason) return null;
  const match = reason.match(/(?:returned|API returned)\s+(\d{3})/i);
  return match ? Number(match[1]) : null;
}

function canFailoverAfterDefinitiveEmailRejection(reason: string | undefined) {
  const status = providerHttpStatus(reason);
  return status !== null && status >= 400 && status <= 499;
}

async function executeProviderAttempt(
  input: Pick<DispatchCommunicationInput, "channel" | "recipient" | "variables">,
  definition: CommunicationEventDefinition,
  template: ProviderTemplate,
) {
  if (input.channel === "WHATSAPP") {
    if (!template.providerAlias) throw new Error("Active WhatsApp template has no Meta template name.");
    const configuredOrder = Array.isArray(template.providerParameterOrder)
      ? template.providerParameterOrder.filter((value): value is string => typeof value === "string")
      : [];
    if (!configuredOrder.length) throw new Error("Active WhatsApp template has no explicit provider parameter mapping.");
    const unknownMappings = configuredOrder.filter((key) => !definition.variables.includes(key));
    if (unknownMappings.length) throw new Error(`WhatsApp template parameter mapping contains unapproved variables: ${unknownMappings.join(", ")}`);
    const parameters = configuredOrder.map((key) => ({
      type: "text" as const,
      text: String(input.variables[key] ?? ""),
    }));
    const components: WhatsAppTemplateComponent[] = parameters.length
      ? [{ type: "body", parameters }]
      : [];
    return sendWhatsAppTemplateMessage(
      input.recipient,
      template.providerAlias,
      template.locale,
      components,
    );
  }

  if (!template.subject?.trim()) {
    throw new Error("Active email communication template has no subject.");
  }

  const subject = renderCommunicationTemplate(template.subject, input.variables);
  const html = renderCommunicationHtmlTemplate(template.body, input.variables);
  const text = communicationEmailText(html);
  const providers = await getConfiguredEmailProviders();
  if (!providers.length) {
    return {
      success: false,
      messageId: "",
      reason: "No usable email provider is configured.",
    } satisfies EmailDeliveryResult;
  }

  let lastResult: EmailDeliveryResult | null = null;
  for (const configuredProvider of providers) {
    if (
      configuredProvider.provider === "ZEPTOMAIL" &&
      (template.providerTemplateId || template.providerAlias)
    ) {
      // Existing approved HireGo templates keep using Zoho/ZeptoMail's stored
      // template API. The persisted subject/body remains the provider-neutral
      // fallback content for SendGrid.
      lastResult = await sendZeptoMailTemplate({
        to: input.recipient,
        templateKey: template.providerTemplateId || undefined,
        templateAlias: template.providerAlias || undefined,
        mergeInfo: input.variables,
      });
    } else {
      lastResult = await sendEmail(
        {
          to: input.recipient,
          subject,
          text,
          html: communicationEmailHtml(html),
        },
        { provider: configuredProvider.provider, allowFallback: false },
      );
    }

    if (lastResult.success) return lastResult;

    // Cross-provider failover is safe only after a definite HTTP 4xx rejection.
    // Network/timeout/5xx outcomes may already have been accepted, so stop.
    if (!canFailoverAfterDefinitiveEmailRejection(lastResult.reason)) {
      return lastResult;
    }
  }

  return lastResult ?? {
    success: false,
    messageId: "",
    reason: "No usable email provider is configured.",
  };
}

export type ConsequentialAuthorization = { approvedByUserId: string; approvalId: string; workflowId: string };

async function assertPersistedCommunicationAuthorization(proof: ConsequentialAuthorization, eventKey: CommunicationEventKey) {
  const approval = await prisma.workflowApproval.findUnique({ where: { id: proof.approvalId }, select: { workflowInstanceId: true, decision: true, decidedBy: true, decidedByRole: true, decidedAt: true, consumedAt: true, actionType: true, expiresAt: true, revokedAt: true } });
  if (!approval || approval.workflowInstanceId !== proof.workflowId || approval.decision !== "APPROVED" || !approval.decidedAt || !approval.decidedBy || approval.decidedBy !== proof.approvedByUserId) throw new Error("Persisted human approval is required for consequential communication.");
  if (approval.revokedAt) throw new Error("Consequential communication approval was revoked.");
  if (approval.expiresAt <= new Date()) throw new Error("Consequential communication approval expired before dispatch.");
  if (!approval.decidedByRole || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(approval.decidedByRole)) throw new Error("Consequential communication approval was not granted by an authorized human role.");
  const requiredAction = eventKey === "APPLICATION_REJECTED" ? "CANDIDATE_REJECTION" : eventKey === "CANDIDATE_SELECTED" ? "CANDIDATE_SELECTION" : "EXTERNAL_COMMUNICATION";
  if (approval.actionType !== requiredAction) throw new Error(`Approval action ${approval.actionType} cannot authorize communication ${eventKey}; ${requiredAction} is required.`);
  if (approval.consumedAt) throw new Error("Consequential communication approval has already been consumed.");
}

async function assertConsumedDecisionCommunicationAuthorization(
  input: DispatchCommunicationInput & { authorizationProof: ConsequentialAuthorization },
) {
  if (
    input.eventKey !== "CANDIDATE_SELECTED" &&
    input.eventKey !== "APPLICATION_REJECTED"
  ) {
    throw new Error(
      "Consumed decision approval can authorize only candidate selection or rejection communication.",
    );
  }
  if (input.audience !== "CANDIDATE") {
    throw new Error("Decision communication must target the candidate audience.");
  }

  const proof = input.authorizationProof;
  const approval = await prisma.workflowApproval.findUnique({
    where: { id: proof.approvalId },
    include: { workflowInstance: true },
  });
  if (
    !approval ||
    approval.workflowInstanceId !== proof.workflowId ||
    approval.decision !== "APPROVED" ||
    !approval.decidedAt ||
    !approval.decidedBy ||
    approval.decidedBy !== proof.approvedByUserId ||
    !approval.consumedAt ||
    approval.revokedAt ||
    !approval.decidedByRole ||
    !["EMPLOYER", "RECRUITER", "ADMIN"].includes(approval.decidedByRole)
  ) {
    throw new Error(
      "A consumed persisted human decision approval is required for candidate outcome communication.",
    );
  }

  const workflow = approval.workflowInstance;
  const expectedAction =
    input.eventKey === "CANDIDATE_SELECTED"
      ? "CANDIDATE_SELECTION"
      : "CANDIDATE_REJECTION";
  const expectedSteps =
    input.eventKey === "CANDIDATE_SELECTED"
      ? ["CANDIDATE_SELECTED"]
      : ["CANDIDATE_REJECTED", "SCREENING_REJECTION_EXECUTED"];
  if (
    approval.actionType !== expectedAction ||
    workflow.status !== "COMPLETED" ||
    !expectedSteps.includes(workflow.currentStep) ||
    !workflow.applicationId
  ) {
    throw new Error(
      "Completed hiring decision workflow does not authorize this candidate outcome communication.",
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: workflow.applicationId },
    select: {
      status: true,
      candidateProfileId: true,
      job: { select: { companyId: true } },
      candidateProfile: {
        select: {
          user: {
            select: { id: true, email: true, phoneNumber: true },
          },
        },
      },
    },
  });
  if (
    !application ||
    workflow.candidateId !== application.candidateProfileId ||
    workflow.companyId !== application.job.companyId
  ) {
    throw new Error(
      "Decision workflow does not match the persisted candidate application.",
    );
  }

  const expectedStatus =
    input.eventKey === "CANDIDATE_SELECTED" ? "SHORTLISTED" : "REJECTED";
  if (application.status !== expectedStatus) {
    throw new Error(
      "Candidate application state no longer matches the approved outcome communication.",
    );
  }

  const candidateUser = application.candidateProfile.user;
  if (input.recipientRef !== candidateUser.id) {
    throw new Error(
      "Decision communication recipient does not match the approved candidate.",
    );
  }
  const recipientMatches =
    input.channel === "EMAIL"
      ? Boolean(
          candidateUser.email &&
          candidateUser.email.trim().toLowerCase() ===
            input.recipient.trim().toLowerCase(),
        )
      : input.channel === "WHATSAPP"
        ? Boolean(
            candidateUser.phoneNumber &&
            candidateUser.phoneNumber.replace(/\D/g, "") ===
              input.recipient.replace(/\D/g, ""),
          )
        : false;
  if (!recipientMatches) {
    throw new Error(
      "Decision communication address does not match the approved candidate.",
    );
  }
}

export type DispatchCommunicationInput = {
  eventKey: CommunicationEventKey;
  channel: CommunicationChannel;
  audience: CommunicationAudience;
  recipient: string;
  variables: Record<string, string | number | boolean | null>;
  idempotencyKey: string;
  correlationId?: string;
  recipientRef?: string;
  locale?: string;
  authorizationProof?: ConsequentialAuthorization;
  copilotMetering?: {
    companyId: string;
    idempotencyKey: string;
    reference?: CopilotUsageReference;
  };
};

async function meterCopilotCommunicationAttempt(input: DispatchCommunicationInput) {
  if (!input.copilotMetering) return;
  const actionKey = input.channel === "WHATSAPP" ? "WHATSAPP_NOTIFICATION" : "EMAIL_NOTIFICATION";
  try {
    await recordCopilotUsageAfterExecutionIfActive({
      companyId: input.copilotMetering.companyId,
      actionKey,
      quantity: 1,
      idempotencyKey: input.copilotMetering.idempotencyKey,
      reference: input.copilotMetering.reference,
      metadata: {
        eventKey: input.eventKey,
        channel: input.channel,
        audience: input.audience,
        correlationId: input.correlationId || null,
      },
    });
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        companyId: input.copilotMetering.companyId,
        action: "COPILOT_COMMUNICATION_METERING_FAILED",
        resource: `Communication:${input.eventKey}:${input.channel}`,
        details: error instanceof Error ? error.message.slice(0, 500) : "Unknown Copilot communication metering failure",
      },
    }).catch(() => undefined);
  }
}

function addressHash(value: string) {
  return createHmac("sha256", communicationHashSecret())
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function safeRetryClassification(reason: string | undefined) {
  const status = providerHttpStatus(reason);
  // 429 is a definitive rejection and is safe to retry. Network, timeout and
  // 5xx outcomes are intentionally terminal because provider acceptance is ambiguous.
  const retryable = status === 429;
  return { retryable, code: status ? `HTTP_${status}` : "PROVIDER_FAILURE" };
}

function safeProviderError(value: unknown) {
  const raw = value instanceof Error ? value.message : String(value || "Communication provider failure.");
  return raw.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[redacted-phone]").slice(0, 1000);
}

async function recordCommunicationDispatchBlocked(
  input: DispatchCommunicationInput,
  recipientAddressHash: string,
  code: "TEMPLATE_NOT_CONFIGURED" | "TEMPLATE_CONTRACT_INVALID",
  message: string,
) {
  await prisma.$transaction(async (tx) => {
    const auditLog = await tx.auditLog.create({
      data: {
        userId: null,
        companyId: input.copilotMetering?.companyId ?? null,
        action: "COMMUNICATION_DISPATCH_BLOCKED",
        resource: `Communication:${input.eventKey}:${input.channel}`,
        details: JSON.stringify({
          code,
          message: safeProviderError(message),
          audience: input.audience,
          correlationId: input.correlationId ?? null,
          recipientRef: input.recipientRef ?? null,
          recipientAddressHash,
          idempotencyKeySha256: createHash("sha256")
            .update(input.idempotencyKey)
            .digest("hex"),
        }),
      },
    });
    await enqueueSecurityAuditEvent(tx, auditLog);
  });
}

function assertVariables(eventKey: CommunicationEventKey, variables: Record<string, unknown>) {
  const allowed = new Set(COMMUNICATION_EVENT_REGISTRY[eventKey].variables);
  const unknown = Object.keys(variables).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`Unknown communication variables for ${eventKey}: ${unknown.join(", ")}`);
}

async function assertWhatsAppConsent(recipient: string) {
  const digits = recipient.replace(/\D/g, "");
  if (!digits) throw new Error("Invalid WhatsApp recipient.");
  const contact = await prisma.whatsAppContact.findUnique({ where: { waId: digits }, select: { optInStatus: true } });
  if (!contact || !isWhatsAppMessagingAllowed(contact.optInStatus)) {
    throw new Error("WhatsApp recipient has not provided active messaging consent.");
  }
}

async function dispatchCommunicationInternal(input: DispatchCommunicationInput, options: { allowConsequentialWithoutProof: boolean } = { allowConsequentialWithoutProof: false }) {
  const definition = COMMUNICATION_EVENT_REGISTRY[input.eventKey];
  if (!definition.channels.includes(input.channel) || !definition.audiences.includes(input.audience)) {
    throw new Error("Communication event does not permit this channel/audience combination.");
  }
  assertVariables(input.eventKey, input.variables);
  const recipientAddressHash = addressHash(input.recipient);

  // Idempotent replays must resolve the already-persisted delivery before a
  // consequential approval is revalidated. The approval is intentionally
  // consumed by the first send; requiring it to be unconsumed again would turn
  // a harmless network/app retry into a false failure after the side effect.
  const resolveExistingDelivery = async () => {
    const existing = await prisma.communicationDelivery.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (!existing) return null;
    const sameBinding =
      existing.eventKey === input.eventKey &&
      existing.channel === input.channel &&
      existing.audience === input.audience &&
      existing.recipientAddressHash === recipientAddressHash &&
      (existing.recipientRef ?? null) === (input.recipientRef ?? null) &&
      (existing.correlationId ?? null) === (input.correlationId ?? null);
    if (!sameBinding) {
      throw new Error(
        "Communication idempotency key is already bound to a different delivery.",
      );
    }
    return existing;
  };

  const existing = await resolveExistingDelivery();
  if (existing) {
    if (input.copilotMetering && ["ACCEPTED", "DELIVERED", "READ", "FAILED"].includes(existing.status)) {
      await meterCopilotCommunicationAttempt(input);
    }
    return existing;
  }

  let consequentialApprovalId: string | null = null;
  if (definition.consequential && !options.allowConsequentialWithoutProof) {
    if (!input.authorizationProof?.approvedByUserId || !input.authorizationProof?.approvalId || !input.authorizationProof?.workflowId) {
      throw new Error(`Consequential communication ${input.eventKey} requires persisted human authorization proof.`);
    }
    await assertPersistedCommunicationAuthorization(input.authorizationProof, input.eventKey);
    consequentialApprovalId = input.authorizationProof.approvalId;
  }
  if (input.channel === "WHATSAPP") await assertWhatsAppConsent(input.recipient);

  const template = await prisma.communicationTemplate.findFirst({
    where: {
      eventKey: input.eventKey,
      channel: input.channel,
      audience: input.audience,
      locale: input.locale || "en",
      enabled: true,
      status: "ACTIVE",
    },
    orderBy: { version: "desc" },
  });
  if (!template) {
    const message = `No active ${input.channel} template is configured for ${input.eventKey}.`;
    await recordCommunicationDispatchBlocked(
      input,
      recipientAddressHash,
      "TEMPLATE_NOT_CONFIGURED",
      message,
    );
    throw new Error(message);
  }

  const variableCheck = validateTemplateVariables(input.eventKey, template.subject, template.body);
  if (variableCheck.unknown.length || variableCheck.missing.length) {
    const message = variableCheck.unknown.length
      ? `Template contains unapproved variables: ${variableCheck.unknown.join(", ")}`
      : `Template is missing required variables for ${input.eventKey}: ${variableCheck.missing.join(", ")}`;
    await recordCommunicationDispatchBlocked(
      input,
      recipientAddressHash,
      "TEMPLATE_CONTRACT_INVALID",
      message,
    );
    throw new Error(message);
  }

  const deliveryData = {
    templateId: template.id,
    eventKey: input.eventKey,
    channel: input.channel,
    audience: input.audience,
    recipientRef: input.recipientRef,
    recipientAddressHash,
    provider: template.provider,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    status: "PROCESSING",
    attemptCount: 1,
    ...(definition.consequential
      ? {}
      : {
          replayEnvelopeEncrypted: encryptCommunicationReplayEnvelope({
            recipient: input.recipient,
            variables: input.variables,
            templateDigest: communicationTemplateReplayDigest(template),
          }),
          replayEnvelopeVersion: COMMUNICATION_REPLAY_VERSION,
          replayExpiresAt: new Date(Date.now() + COMMUNICATION_REPLAY_TTL_MS),
        }),
  };

  let delivery: NonNullable<Awaited<ReturnType<typeof resolveExistingDelivery>>>;
  try {
    delivery =
      consequentialApprovalId && input.authorizationProof
        ? await prisma.$transaction(async (tx) => {
            const proof = input.authorizationProof!;
            const approval = await tx.workflowApproval.findUnique({ where: { id: consequentialApprovalId }, select: { workflowInstanceId: true, companyId: true, stepName: true, actionType: true, actionDigest: true, decision: true, decidedBy: true, decidedByRole: true, decidedAt: true, consumedAt: true, expiresAt: true, revokedAt: true } });
            const now = new Date();
            if (!approval || approval.workflowInstanceId !== proof.workflowId || approval.decision !== "APPROVED" || !approval.decidedAt || approval.decidedBy !== proof.approvedByUserId || approval.consumedAt || approval.revokedAt || approval.expiresAt <= now) throw new Error("Consequential communication approval is no longer valid.");
            const consumed = await tx.workflowApproval.updateMany({ where: { id: consequentialApprovalId, workflowInstanceId: proof.workflowId, decision: "APPROVED", consumedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
            if (consumed.count !== 1) throw new Error("Consequential communication approval was already consumed.");
            if (!approval.decidedByRole) throw new Error("Consequential communication approval is missing approver role evidence.");
            await writeAgentApprovalAudit(tx, { userId: proof.approvedByUserId, companyId: approval.companyId, action: "AGENT_APPROVAL_CONSUMED", workflowId: proof.workflowId, approvalId: consequentialApprovalId, stepName: approval.stepName, actionType: approval.actionType, actionDigest: approval.actionDigest, role: approval.decidedByRole });
            return tx.communicationDelivery.create({ data: deliveryData });
          })
        : await prisma.communicationDelivery.create({ data: deliveryData });
  } catch (error) {
    // A concurrent caller may have won the idempotency race (or consumed the
    // one-shot consequential approval together with its delivery row). Never
    // issue a second provider call: resolve and return the winner if its
    // persisted binding exactly matches this request.
    const racedDelivery = await resolveExistingDelivery();
    if (racedDelivery) {
      if (
        input.copilotMetering &&
        ["ACCEPTED", "DELIVERED", "READ", "FAILED"].includes(racedDelivery.status)
      ) {
        await meterCopilotCommunicationAttempt(input);
      }
      return racedDelivery;
    }
    throw error;
  }

  let providerAttempted = false;
  try {
    providerAttempted = true;
    const result = await executeProviderAttempt(input, definition, template);
    const successful = result.sent === true || result.success === true;
    const attemptedProvider =
      typeof (result as { provider?: unknown }).provider === "string"
        ? (result as { provider: string }).provider
        : delivery.provider;
    const updated = await prisma.communicationDelivery.update({
      where: { id: delivery.id },
      data: successful
        ? {
            status: "ACCEPTED",
            provider: attemptedProvider,
            providerMessageId: result.messageId,
            acceptedAt: new Date(),
            retryable: false,
            nextAttemptAt: null,
            replayEnvelopeEncrypted: null,
            replayEnvelopeVersion: null,
            replayExpiresAt: null,
          }
        : (() => {
            const failure = safeRetryClassification(result.reason);
            const retryable =
              !definition.consequential &&
              failure.retryable &&
              Boolean(delivery.replayEnvelopeEncrypted) &&
              Boolean(delivery.replayExpiresAt && delivery.replayExpiresAt > new Date());
            return {
              status: "FAILED",
              provider: attemptedProvider,
              lastErrorCode: failure.code,
              lastError: safeProviderError(result.reason || "Provider rejected communication."),
              failedAt: new Date(),
              retryable,
              nextAttemptAt: retryable ? new Date(Date.now() + 60_000) : null,
              ...(retryable
                ? {}
                : {
                    replayEnvelopeEncrypted: null,
                    replayEnvelopeVersion: null,
                    replayExpiresAt: null,
                  }),
            };
          })(),
    });
    if (providerAttempted) await meterCopilotCommunicationAttempt(input);
    return updated;
  } catch (error) {
    const safeError = safeProviderError(error);
    const failure = safeRetryClassification(safeError);
    const retryable =
      !definition.consequential &&
      failure.retryable &&
      Boolean(delivery.replayEnvelopeEncrypted) &&
      Boolean(delivery.replayExpiresAt && delivery.replayExpiresAt > new Date());
    await prisma.communicationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        lastErrorCode: retryable ? failure.code : "AMBIGUOUS_PROVIDER_ERROR",
        lastError: safeError,
        failedAt: new Date(),
        retryable,
        nextAttemptAt: retryable ? new Date(Date.now() + 60_000) : null,
        ...(retryable
          ? {}
          : {
              replayEnvelopeEncrypted: null,
              replayEnvelopeVersion: null,
              replayExpiresAt: null,
            }),
      },
    });
    if (providerAttempted) await meterCopilotCommunicationAttempt(input);
    throw error;
  }
}

async function terminalizePersistedRetry(
  deliveryId: string,
  leaseId: string,
  code: string,
  message: string,
) {
  await prisma.communicationDelivery.updateMany({
    where: { id: deliveryId, status: "PROCESSING", retryLeaseId: leaseId },
    data: {
      status: "FAILED",
      retryable: false,
      nextAttemptAt: null,
      lastErrorCode: code,
      lastError: safeProviderError(message),
      failedAt: new Date(),
      replayEnvelopeEncrypted: null,
      replayEnvelopeVersion: null,
      replayExpiresAt: null,
      retryLeaseId: null,
      retryLeasedUntil: null,
    },
  });
  return prisma.communicationDelivery.findUnique({ where: { id: deliveryId } });
}

export async function retryPersistedCommunicationDelivery(params: {
  deliveryId: string;
  leaseId: string;
}) {
  const delivery = await prisma.communicationDelivery.findUnique({
    where: { id: params.deliveryId },
    include: { template: true },
  });
  if (
    !delivery ||
    delivery.status !== "PROCESSING" ||
    delivery.retryLeaseId !== params.leaseId
  ) {
    return null;
  }

  const now = new Date();
  if (!delivery.retryLeasedUntil || delivery.retryLeasedUntil <= now) {
    return terminalizePersistedRetry(
      delivery.id,
      params.leaseId,
      "RETRY_LEASE_EXPIRED",
      "Communication retry lease expired before provider dispatch.",
    );
  }
  if (
    !delivery.replayEnvelopeEncrypted ||
    delivery.replayEnvelopeVersion !== COMMUNICATION_REPLAY_VERSION ||
    !delivery.replayExpiresAt ||
    delivery.replayExpiresAt <= now
  ) {
    return terminalizePersistedRetry(
      delivery.id,
      params.leaseId,
      "REPLAY_ENVELOPE_EXPIRED",
      "Encrypted communication replay evidence is unavailable or expired.",
    );
  }

  const definition =
    COMMUNICATION_EVENT_REGISTRY[delivery.eventKey as CommunicationEventKey];
  if (!definition || definition.consequential) {
    return terminalizePersistedRetry(
      delivery.id,
      params.leaseId,
      "RETRY_NOT_ALLOWED",
      "This communication is not eligible for automatic retry.",
    );
  }
  const template = delivery.template;
  if (!template || !template.enabled || template.status !== "ACTIVE") {
    return terminalizePersistedRetry(
      delivery.id,
      params.leaseId,
      "TEMPLATE_NOT_ACTIVE",
      "The original communication template is no longer active.",
    );
  }

  let envelope: CommunicationReplayEnvelope;
  try {
    envelope = decryptCommunicationReplayEnvelope(delivery.replayEnvelopeEncrypted);
    if (envelope.templateDigest !== communicationTemplateReplayDigest(template)) {
      throw new Error("The original communication template changed after the first delivery attempt.");
    }
    assertVariables(delivery.eventKey as CommunicationEventKey, envelope.variables);
    const variableCheck = validateTemplateVariables(
      delivery.eventKey as CommunicationEventKey,
      template.subject,
      template.body,
    );
    if (variableCheck.unknown.length || variableCheck.missing.length) {
      throw new Error("The persisted template no longer satisfies the communication variable contract.");
    }
    if (delivery.channel === "WHATSAPP") {
      await assertWhatsAppConsent(envelope.recipient);
    }
  } catch (error) {
    return terminalizePersistedRetry(
      delivery.id,
      params.leaseId,
      "REPLAY_VALIDATION_FAILED",
      error instanceof Error ? error.message : "Communication replay validation failed.",
    );
  }

  try {
    const result = await executeProviderAttempt(
      {
        channel: delivery.channel as CommunicationChannel,
        recipient: envelope.recipient,
        variables: envelope.variables,
      },
      definition,
      template,
    );
    const successful = result.sent === true || result.success === true;
    const attemptedProvider =
      typeof (result as { provider?: unknown }).provider === "string"
        ? (result as { provider: string }).provider
        : delivery.provider;
    if (successful) {
      await prisma.communicationDelivery.updateMany({
        where: { id: delivery.id, status: "PROCESSING", retryLeaseId: params.leaseId },
        data: {
          status: "ACCEPTED",
          provider: attemptedProvider,
          providerMessageId: result.messageId,
          acceptedAt: new Date(),
          retryable: false,
          nextAttemptAt: null,
          lastErrorCode: null,
          lastError: null,
          replayEnvelopeEncrypted: null,
          replayEnvelopeVersion: null,
          replayExpiresAt: null,
          retryLeaseId: null,
          retryLeasedUntil: null,
        },
      });
      return prisma.communicationDelivery.findUnique({ where: { id: delivery.id } });
    }

    const failure = safeRetryClassification(result.reason);
    const canRetryAgain =
      failure.retryable &&
      delivery.attemptCount < delivery.maxAttempts &&
      delivery.replayExpiresAt > new Date();
    const nextAttemptAt = canRetryAgain
      ? new Date(Date.now() + Math.min(5 * 60_000, 60_000 * 2 ** Math.max(0, delivery.attemptCount - 1)))
      : null;
    await prisma.communicationDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING", retryLeaseId: params.leaseId },
      data: {
        status: "FAILED",
        provider: attemptedProvider,
        retryable: canRetryAgain,
        nextAttemptAt,
        lastErrorCode: canRetryAgain
          ? failure.code
          : delivery.attemptCount >= delivery.maxAttempts
            ? "MAX_ATTEMPTS_EXHAUSTED"
            : failure.code,
        lastError: safeProviderError(result.reason || "Provider rejected communication."),
        failedAt: new Date(),
        retryLeaseId: null,
        retryLeasedUntil: null,
        ...(canRetryAgain
          ? {}
          : {
              replayEnvelopeEncrypted: null,
              replayEnvelopeVersion: null,
              replayExpiresAt: null,
            }),
      },
    });
    return prisma.communicationDelivery.findUnique({ where: { id: delivery.id } });
  } catch (error) {
    const safeError = safeProviderError(error);
    const failure = safeRetryClassification(safeError);
    const canRetryAgain =
      failure.retryable &&
      delivery.attemptCount < delivery.maxAttempts &&
      delivery.replayExpiresAt > new Date();
    const nextAttemptAt = canRetryAgain
      ? new Date(Date.now() + Math.min(5 * 60_000, 60_000 * 2 ** Math.max(0, delivery.attemptCount - 1)))
      : null;
    await prisma.communicationDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING", retryLeaseId: params.leaseId },
      data: {
        status: "FAILED",
        retryable: canRetryAgain,
        nextAttemptAt,
        lastErrorCode: canRetryAgain
          ? failure.code
          : failure.retryable && delivery.attemptCount >= delivery.maxAttempts
            ? "MAX_ATTEMPTS_EXHAUSTED"
            : "AMBIGUOUS_PROVIDER_ERROR",
        lastError: safeError,
        failedAt: new Date(),
        retryLeaseId: null,
        retryLeasedUntil: null,
        ...(canRetryAgain
          ? {}
          : {
              replayEnvelopeEncrypted: null,
              replayEnvelopeVersion: null,
              replayExpiresAt: null,
            }),
      },
    });
    return prisma.communicationDelivery.findUnique({ where: { id: delivery.id } });
  }
}

export async function dispatchCommunication(input: DispatchCommunicationInput) {
  return dispatchCommunicationInternal(input);
}

export async function dispatchDecisionCommunication(
  input: DispatchCommunicationInput & {
    authorizationProof: ConsequentialAuthorization;
  },
) {
  await assertConsumedDecisionCommunicationAuthorization(input);
  return dispatchCommunicationInternal(input, {
    allowConsequentialWithoutProof: true,
  });
}

export async function dispatchAdminDirectCommunication(input: Omit<DispatchCommunicationInput, "authorizationProof">) {
  return dispatchCommunicationInternal(input, { allowConsequentialWithoutProof: true });
}

export async function dispatchAdminTestCommunication(input: Omit<DispatchCommunicationInput, "authorizationProof">) {
  return dispatchCommunicationInternal(input, { allowConsequentialWithoutProof: true });
}
