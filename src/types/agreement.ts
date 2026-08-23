export type RequirementStatus =
  | "NEW"
  | "SUBMITTED"
  | "IN_DISCUSSION"
  | "UNDER_REVIEW"
  | "COMMERCIAL_DISCUSSION"
  | "AGREEMENT_DRAFTED"
  | "AGREEMENT_SENT"
  | "ACTIVE"
  | "CLOSED";

export type AgreementStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "SENT"
  | "SENT_TO_EMPLOYER"
  | "EMPLOYER_REVIEW"
  | "NEGOTIATION"
  | "AMENDMENT_REQUESTED"
  | "ACCEPTED"
  | "ACTIVE"
  | "REJECTED"
  | "EXPIRED"
  | "RENEWED";

export interface HiringRequirementRecord {
  id: string;
  referenceCode: string;
  companyId?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  primaryMobile: string;
  secondaryMobile?: string;
  alternatePhone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  industry: string;
  numberOfPositions: number;
  multipleRoles?: boolean;
  jobTitles: string[];
  department?: string;
  experienceYears: string;
  skillsRequired: string[];
  mandatorySkills?: string[];
  preferredSkills?: string[];
  education: string;
  certifications?: string;
  languages?: string;
  tools?: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  currency: string;
  budgetMin?: number;
  budgetMax?: number;
  variableComponent?: string;
  bonusIncentives?: string;
  benefits?: string[];
  workMode: "Remote" | "Hybrid" | "Onsite" | string;
  location: string;
  shift?: string;
  joiningTimeline: string;
  hiringPriority: "Standard" | "High" | "Urgent" | "Urgent / Critical" | string;
  replacementExpectation: string;
  additionalNotes?: string;
  jdFileName?: string;
  jdFileUrl?: string;
  status: RequirementStatus;
  assignedSalesLead?: string;
  activeAgreementId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementTemplateRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "Startup" | "Growth" | "Enterprise" | "Executive" | "Campus" | "Custom" | string;
  feeType: "PERCENTAGE" | "FIXED" | string;
  feeValue: number;
  invoiceRule: "ON_OFFER" | "ON_JOINING" | "DAY_30" | "SPLIT_50_50" | string;
  replacementDays: number;
  validityMonths?: number;
  validityDays?: number;
  advancePayment?: number;
  creditTermsDays?: number;
  creditDays?: number;
  standardDiscountPct?: number;
  taxRatePct?: number;
  taxRate?: number;
  discountRules?: string;
  penaltyClause?: string;
  terminationClause?: string;
  confidentialityClause?: string;
  jurisdiction?: string;
  specialClauses: string[];
  commercialNotes?: string;
  isArchived?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommercialAgreementRecord {
  id: string;
  agreementNumber: string;
  companyId?: string;
  requirementId?: string;
  templateId?: string;
  companyName: string;
  clientLegalName?: string;
  contactPerson: string;
  clientEmail?: string;
  email?: string;
  clientPhone?: string;
  status: AgreementStatus;

  feeType: "PERCENTAGE" | "FIXED" | string;
  feeValue: number;
  invoiceRule: "ON_OFFER" | "ON_JOINING" | "DAY_30" | "SPLIT_50_50" | string;
  replacementDays: number;
  validityStartDate?: string;
  validityEndDate?: string;
  validityDays?: number;
  advancePaymentAmount?: number;
  discountPercentage?: number;
  creditDays?: number;
  paymentTermsDays?: number;
  hiringQuantity?: number;
  taxRatePct?: number;

  customClauses?: string[];
  commercialNotes?: string;
  salesExecutiveNotes?: string;
  notes?: string;

  signedByName?: string;
  signedByDesignation?: string;
  signedAt?: string;
  signerIpAddress?: string;
  amendmentNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AgreementEventRecord {
  id: string;
  agreementId: string;
  eventType: string;
  performedBy: string;
  notes?: string;
  timestamp?: string;
  createdAt?: string;
}
