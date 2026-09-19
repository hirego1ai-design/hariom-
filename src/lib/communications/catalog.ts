export const COMMUNICATION_CHANNELS = ["EMAIL", "WHATSAPP"] as const;
export const COMMUNICATION_AUDIENCES = ["CANDIDATE", "EMPLOYER", "RECRUITER", "ADMIN"] as const;

export const COMMUNICATION_EVENTS = [
  "AUTH_VERIFY_OTP",
  "AUTH_PASSWORD_RESET",
  "AUTH_SECURITY_ALERT",
  "ACCOUNT_WELCOME",
  "CANDIDATE_PROFILE_INCOMPLETE",
  "CANDIDATE_AVAILABILITY_RECONFIRM",
  "JOB_OPPORTUNITY",
  "JOB_APPLICATION_RECEIVED",
  "APPLICATION_SCREENING_STARTED",
  "APPLICATION_SHORTLISTED",
  "APPLICATION_REJECTED",
  "INTERVIEW_SCHEDULE_REQUEST",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_REMINDER",
  "INTERVIEW_RESCHEDULED",
  "INTERVIEW_CANCELLED",
  "VIRTUAL_INTERVIEW_READY",
  "INTERVIEW_FEEDBACK_REQUEST",
  "CANDIDATE_SELECTED",
  "JOINING_DOCUMENTS_REQUIRED",
  "JOINING_CONFIRMATION",
  "JOINING_REMINDER",
  "JOINING_COMPLETED",
  "HIRING_REQUIREMENT_RECEIVED",
  "MANAGED_HIRING_SOURCING_STARTED",
  "MANAGED_HIRING_CANDIDATE_SUBMITTED",
  "AGREEMENT_APPROVAL_REQUESTED",
  "AGREEMENT_SENT",
  "AGREEMENT_ACCEPTED",
  "AGREEMENT_REJECTED",
  "AGREEMENT_EXPIRED",
  "INVOICE_GENERATED",
  "INVOICE_DUE_REMINDER",
  "INVOICE_RECEIPT_SUBMITTED",
  "INVOICE_PAYMENT_VERIFIED",
  "SUBSCRIPTION_PURCHASED",
  "SUBSCRIPTION_RENEWAL_REMINDER",
  "SUBSCRIPTION_EXPIRED",
  "CREDITS_LOW",
  "CREDITS_EXHAUSTED",
  "VIDEO_RESUME_PROCESSING_COMPLETE",
  "ASSESSMENT_INVITATION",
  "ASSESSMENT_COMPLETED",
  "CANDIDATE_SERVICE_SCHEDULED",
  "CANDIDATE_SERVICE_COMPLETED",
  "CANDIDATE_SERVICE_REFUNDED",
  "TEAM_INVITATION",
  "SUPPORT_ACKNOWLEDGEMENT",
] as const;

export type CommunicationChannel = typeof COMMUNICATION_CHANNELS[number];
export type CommunicationAudience = typeof COMMUNICATION_AUDIENCES[number];
export type CommunicationEventKey = typeof COMMUNICATION_EVENTS[number];

export type CommunicationEventDefinition = {
  label: string;
  category: string;
  audiences: CommunicationAudience[];
  channels: CommunicationChannel[];
  variables: string[];
  optionalVariables?: string[];
  consequential?: boolean;
};

export const COMMUNICATION_EVENT_REGISTRY: Record<CommunicationEventKey, CommunicationEventDefinition> = {
  AUTH_VERIFY_OTP: { label: "Verification OTP", category: "Authentication", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["name", "otp", "expires_minutes"] },
  AUTH_PASSWORD_RESET: { label: "Password reset", category: "Authentication", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["name", "reset_link", "expires_minutes"] },
  AUTH_SECURITY_ALERT: { label: "Security alert", category: "Authentication", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["name", "event", "time"] },
  ACCOUNT_WELCOME: { label: "Welcome", category: "Onboarding", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["name", "dashboard_link"] },
  CANDIDATE_PROFILE_INCOMPLETE: { label: "Complete candidate profile", category: "Candidate", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "profile_link"] },
  CANDIDATE_AVAILABILITY_RECONFIRM: { label: "Reconfirm availability", category: "Candidate", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "availability_link"] },
  JOB_OPPORTUNITY: { label: "Matched job opportunity", category: "Acquisition", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "location", "job_link"], consequential: true },
  JOB_APPLICATION_RECEIVED: { label: "Application received", category: "Application", audiences: ["CANDIDATE", "EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title"] },
  APPLICATION_SCREENING_STARTED: { label: "Screening started", category: "Application", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title"] },
  APPLICATION_SHORTLISTED: { label: "Candidate shortlisted", category: "Application", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "next_step"], consequential: true },
  APPLICATION_REJECTED: { label: "Application outcome", category: "Application", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title"], consequential: true },
  INTERVIEW_SCHEDULE_REQUEST: { label: "Interview scheduling request", category: "Interview", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "scheduling_link"] },
  INTERVIEW_SCHEDULED: { label: "Interview scheduled", category: "Interview", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "interview_date", "interview_time", "timezone", "interview_mode", "interview_link"] },
  INTERVIEW_REMINDER: { label: "Interview reminder", category: "Interview", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "interview_date", "interview_time", "timezone", "interview_link"] },
  INTERVIEW_RESCHEDULED: { label: "Interview rescheduled", category: "Interview", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "interview_date", "interview_time", "timezone"] },
  INTERVIEW_CANCELLED: { label: "Interview cancelled", category: "Interview", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title"] },
  VIRTUAL_INTERVIEW_READY: { label: "Virtual interview ready", category: "Interview", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "job_title", "interview_link", "expires_at"] },
  INTERVIEW_FEEDBACK_REQUEST: { label: "Employer feedback request", category: "Interview", audiences: ["EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "job_title", "feedback_link"] },
  INTERVIEW_NEXT_ROUND: { label: "Next interview round", category: "Interview", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "next_round"] },
  CANDIDATE_SELECTED: { label: "Candidate selected", category: "Selection", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "job_title", "next_step"], consequential: true },
  JOINING_DOCUMENTS_REQUIRED: { label: "Joining documents required", category: "Joining", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "documents_link"] },
  JOINING_CONFIRMATION: { label: "Joining confirmation", category: "Joining", audiences: ["CANDIDATE", "EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "joining_date"] },
  JOINING_REMINDER: { label: "Joining reminder", category: "Joining", audiences: ["CANDIDATE", "EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "joining_date"] },
  JOINING_COMPLETED: { label: "Joining completed", category: "Joining", audiences: ["CANDIDATE", "EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "company_name", "joining_date"] },
  HIRING_REQUIREMENT_RECEIVED: { label: "Hiring requirement received", category: "Managed Hiring", audiences: ["EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "reference_code"] },
  MANAGED_HIRING_SOURCING_STARTED: { label: "Sourcing started", category: "Managed Hiring", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "job_title", "reference_code"] },
  MANAGED_HIRING_CANDIDATE_SUBMITTED: { label: "Candidate submitted", category: "Managed Hiring", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "candidate_name", "job_title", "candidate_link"] },
  AGREEMENT_APPROVAL_REQUESTED: { label: "Agreement approval requested", category: "Agreement", audiences: ["EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "agreement_reference", "agreement_link"], consequential: true },
  AGREEMENT_SENT: { label: "Agreement sent", category: "Agreement", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "agreement_reference", "agreement_link"] },
  AGREEMENT_ACCEPTED: { label: "Agreement accepted", category: "Agreement", audiences: ["EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "agreement_reference"] },
  AGREEMENT_REJECTED: { label: "Agreement rejected", category: "Agreement", audiences: ["EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "agreement_reference"] },
  AGREEMENT_EXPIRED: { label: "Agreement expired", category: "Agreement", audiences: ["EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "agreement_reference"] },
  INVOICE_GENERATED: { label: "Invoice generated", category: "Billing", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "invoice_number", "amount", "currency", "due_date", "invoice_link"], consequential: true },
  INVOICE_DUE_REMINDER: { label: "Invoice due reminder", category: "Billing", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "invoice_number", "amount", "currency", "due_date", "invoice_link"] },
  INVOICE_RECEIPT_SUBMITTED: { label: "Payment receipt submitted", category: "Billing", audiences: ["EMPLOYER", "ADMIN"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "invoice_number"] },
  INVOICE_PAYMENT_VERIFIED: { label: "Payment verified", category: "Billing", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "invoice_number", "amount", "currency"] },
  SUBSCRIPTION_PURCHASED: { label: "Subscription purchased", category: "Subscription", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "plan_name", "start_date", "end_date"] },
  SUBSCRIPTION_RENEWAL_REMINDER: { label: "Subscription renewal reminder", category: "Subscription", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "plan_name", "end_date", "renewal_link"] },
  SUBSCRIPTION_EXPIRED: { label: "Subscription expired", category: "Subscription", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "plan_name", "renewal_link"] },
  CREDITS_LOW: { label: "Credits running low", category: "Subscription", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "credit_type", "remaining", "plans_link"] },
  CREDITS_EXHAUSTED: { label: "Credits exhausted", category: "Subscription", audiences: ["EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["company_name", "credit_type", "plans_link"] },
  VIDEO_RESUME_PROCESSING_COMPLETE: { label: "Video resume processed", category: "Candidate", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "video_resume_link"] },
  ASSESSMENT_INVITATION: { label: "Assessment invitation", category: "Assessment", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "assessment_name", "assessment_link", "expires_at"] },
  ASSESSMENT_COMPLETED: { label: "Assessment completed", category: "Assessment", audiences: ["CANDIDATE", "EMPLOYER"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "assessment_name"] },
  CANDIDATE_SERVICE_SCHEDULED: { label: "Candidate service scheduled", category: "Candidate Service", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "service_name", "scheduled_at"] },
  CANDIDATE_SERVICE_COMPLETED: { label: "Candidate service completed", category: "Candidate Service", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "service_name"] },
  CANDIDATE_SERVICE_REFUNDED: { label: "Candidate service refunded", category: "Candidate Service", audiences: ["CANDIDATE"], channels: ["EMAIL", "WHATSAPP"], variables: ["candidate_name", "service_name", "amount", "currency"] },
  TEAM_INVITATION: { label: "Employer team invitation", category: "Employer", audiences: ["EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["name", "company_name", "inviter_name", "invitation_link", "expires_at"] },
  SUPPORT_ACKNOWLEDGEMENT: { label: "Support acknowledgement", category: "Support", audiences: ["CANDIDATE", "EMPLOYER", "RECRUITER"], channels: ["EMAIL", "WHATSAPP"], variables: ["name", "ticket_reference"] },
};

export function communicationEventDefinition(eventKey: string) {
  return COMMUNICATION_EVENT_REGISTRY[eventKey as CommunicationEventKey] ?? null;
}

export function extractTemplateVariables(value: string): string[] {
  return [...new Set(Array.from(value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g), (match) => match[1]))];
}

export function validateTemplateVariables(eventKey: CommunicationEventKey, ...content: Array<string | null | undefined>) {
  const allowed = new Set(COMMUNICATION_EVENT_REGISTRY[eventKey].variables);
  const used = new Set(content.flatMap((value) => extractTemplateVariables(value || "")));
  const unknown = [...used].filter((variable) => !allowed.has(variable));
  const optional = new Set(COMMUNICATION_EVENT_REGISTRY[eventKey].optionalVariables || []);
  const required = [...allowed].filter((variable) => !optional.has(variable));
  const missing = required.filter((variable) => !used.has(variable));
  return { valid: unknown.length === 0 && missing.length === 0, unknown, missing, required, used: [...used], allowed: [...allowed] };
}
