import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import {
  COMMUNICATION_EVENT_REGISTRY,
  type CommunicationAudience,
  type CommunicationChannel,
  type CommunicationEventKey,
  validateTemplateVariables,
} from "./catalog";
import { sendWhatsAppTemplateMessage, type WhatsAppTemplateComponent } from "@/lib/whatsapp";
import { sendZeptoMailTemplate } from "@/lib/email";
import { isWhatsAppMessagingAllowed } from "@/lib/whatsapp-identity";

type ConsequentialAuthorization = { approvedByUserId: string; approvalId: string };

async function assertPersistedCommunicationAuthorization(proof: ConsequentialAuthorization, eventKey: CommunicationEventKey) {
  const approval = await prisma.workflowApproval.findUnique({ where: { id: proof.approvalId }, select: { decision: true, decidedBy: true, decidedByRole: true, decidedAt: true, consumedAt: true, actionType: true } });
  if (!approval || approval.decision !== "APPROVED" || !approval.decidedAt || !approval.decidedBy || approval.decidedBy !== proof.approvedByUserId) throw new Error("Persisted human approval is required for consequential communication.");
  if (!approval.decidedByRole || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(approval.decidedByRole)) throw new Error("Consequential communication approval was not granted by an authorized human role.");
  if (!["EXTERNAL_COMMUNICATION", "CANDIDATE_SELECTION", "CANDIDATE_REJECTION"].includes(approval.actionType)) throw new Error(`Approval action ${approval.actionType} cannot authorize communication ${eventKey}.`);
  if (approval.consumedAt) throw new Error("Consequential communication approval has already been consumed.");
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
  authorizationProof?: { approvedByUserId: string; approvalId: string };
  testMode?: boolean;
};

function addressHash(value: string) {
  const secret = process.env.COMMUNICATION_HASH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("COMMUNICATION_HASH_SECRET is required in production.");
  return createHmac("sha256", secret || "hirego-dev-communication-hash").update(value.trim().toLowerCase()).digest("hex");
}

function safeProviderError(value: unknown) {
  const raw = value instanceof Error ? value.message : String(value || "Communication provider failure.");
  return raw.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[redacted-phone]").slice(0, 1000);
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
  if (definition.consequential && !options.allowConsequentialWithoutProof && (!input.authorizationProof?.approvedByUserId || !input.authorizationProof?.approvalId)) {
    throw new Error(`Consequential communication ${input.eventKey} requires persisted human authorization proof.`);
  }
  if (input.channel === "WHATSAPP") await assertWhatsAppConsent(input.recipient);

  const existing = await prisma.communicationDelivery.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

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
  if (!template) throw new Error(`No active ${input.channel} template is configured for ${input.eventKey}.`);

  const variableCheck = validateTemplateVariables(input.eventKey, template.subject, template.body);
  if (variableCheck.unknown.length) throw new Error(`Template contains unapproved variables: ${variableCheck.unknown.join(", ")}`);
  if (variableCheck.missing.length) throw new Error(`Template is missing required variables for ${input.eventKey}: ${variableCheck.missing.join(", ")}`);

  if (consequentialApprovalId) {
    const consumed = await prisma.workflowApproval.updateMany({ where: { id: consequentialApprovalId, decision: "APPROVED", consumedAt: null }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new Error("Consequential communication approval was already consumed.");
  }

  const delivery = await prisma.communicationDelivery.create({
    data: {
      templateId: template.id,
      eventKey: input.eventKey,
      channel: input.channel,
      audience: input.audience,
      recipientRef: input.recipientRef,
      recipientAddressHash: addressHash(input.recipient),
      provider: template.provider,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      status: "PROCESSING",
      attemptCount: 1,
    },
  });

  try {
    let result: { sent?: boolean; success?: boolean; messageId?: string; reason?: string };
    if (input.channel === "WHATSAPP") {
      if (!template.providerAlias) throw new Error("Active WhatsApp template has no Meta template name.");
      const configuredOrder = Array.isArray(template.providerParameterOrder)
        ? template.providerParameterOrder.filter((value): value is string => typeof value === "string")
        : [];
      if (!configuredOrder.length) throw new Error("Active WhatsApp template has no explicit provider parameter mapping.");
      const unknownMappings = configuredOrder.filter((key) => !definition.variables.includes(key));
      if (unknownMappings.length) throw new Error(`WhatsApp template parameter mapping contains unapproved variables: ${unknownMappings.join(", ")}`);
      const parameters = configuredOrder.map((key) => ({ type: "text" as const, text: String(input.variables[key] ?? "") }));
      const components: WhatsAppTemplateComponent[] = parameters.length ? [{ type: "body", parameters }] : [];
      result = await sendWhatsAppTemplateMessage(input.recipient, template.providerAlias, template.locale, components);
    } else {
      if (template.provider !== "ZEPTOMAIL") throw new Error("Stored email templates currently require ZeptoMail.");
      result = await sendZeptoMailTemplate({
        to: input.recipient,
        templateKey: template.providerTemplateId || undefined,
        templateAlias: template.providerAlias || undefined,
        mergeInfo: input.variables,
      });
    }

    const successful = result.sent === true || result.success === true;
    return await prisma.communicationDelivery.update({
      where: { id: delivery.id },
      data: successful
        ? { status: "ACCEPTED", providerMessageId: result.messageId, acceptedAt: new Date() }
        : { status: "FAILED", lastError: result.reason || "Provider rejected communication.", failedAt: new Date() },
    });
  } catch (error) {
    await prisma.communicationDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", lastError: safeProviderError(error), failedAt: new Date() },
    });
    throw error;
  }
}

export async function dispatchCommunication(input: DispatchCommunicationInput) {
  return dispatchCommunicationInternal(input);
}

export async function dispatchAdminTestCommunication(input: Omit<DispatchCommunicationInput, "authorizationProof">) {
  return dispatchCommunicationInternal(input, { allowConsequentialWithoutProof: true });
}
