/**
 * HireGo Referral Engine — TypeScript Type Definitions
 * Phase 1 Database Models, Enums, Sanitized DTOs, Payout & Admin Config Types
 * Terminology: HireGo Managed Hiring™ (Contingency / Success-Based Placement)
 */

import { UserRole } from "./user";

// ================================================================
// 1. ENUMS
// ================================================================

export enum ReferralStatus {
  ATTRIBUTED = "ATTRIBUTED",
  QUALIFIED = "QUALIFIED",
  LOCKED = "LOCKED",
  ELIGIBLE = "ELIGIBLE",
  PAYABLE = "PAYABLE",
  PAID = "PAID",
  REJECTED = "REJECTED",
  REVERSED = "REVERSED",
  FRAUD_HOLD = "FRAUD_HOLD",
  LIMIT_REACHED = "LIMIT_REACHED",
}

export enum ReferralProductType {
  CANDIDATE_MOCK_INTERVIEW = "CANDIDATE_MOCK_INTERVIEW",
  CANDIDATE_CAREER_PASS = "CANDIDATE_CAREER_PASS",
  EMPLOYER_JOB_POST = "EMPLOYER_JOB_POST",
  EMPLOYER_SUBSCRIPTION = "EMPLOYER_SUBSCRIPTION",
  EMPLOYER_MANAGED_HIRING = "EMPLOYER_MANAGED_HIRING",
  EMPLOYER_PPH_PLACEMENT = "EMPLOYER_PPH_PLACEMENT",
}

export enum PayoutMethod {
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
  PAYPAL = "PAYPAL",
  STRIPE = "STRIPE",
}

export enum PayoutStatus {
  PENDING_ADMIN_APPROVAL = "PENDING_ADMIN_APPROVAL",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  REJECTED = "REJECTED",
}

export enum ReferralLedgerEntryType {
  REWARD_CREDIT = "REWARD_CREDIT",
  REWARD_LOCK = "REWARD_LOCK",
  REWARD_UNLOCK = "REWARD_UNLOCK",
  REWARD_REVERSAL = "REWARD_REVERSAL",
  PAYOUT_RESERVED = "PAYOUT_RESERVED",
  PAYOUT_SETTLED = "PAYOUT_SETTLED",
  PAYOUT_REFUNDED = "PAYOUT_REFUNDED",
}

export enum FraudStatus {
  NORMAL = "NORMAL",
  FLAGGED = "FLAGGED",
  FRAUD_HOLD = "FRAUD_HOLD",
  ADMIN_REVIEW = "ADMIN_REVIEW",
}

export interface FraudAuditRecord {
  id: string;
  userId: string;
  previousStatus: FraudStatus;
  newStatus: FraudStatus;
  reason: string;
  actorId: string;
  riskScore: number;
  riskFactors: string[];
  createdAt: string;
}

export interface UserFraudProfile {
  userId: string;
  status: FraudStatus;
  riskScore: number;
  riskFactors: string[];
  lastEvaluatedAt: string;
  history: FraudAuditRecord[];
}

// ================================================================
// 2. CORE DATABASE INTERFACES (Full Prisma-Equivalent Types)
// ================================================================

export interface ReferralAttribution {
  id: string;
  referrerId: string;
  referredUserId: string | null;
  referredCompanyId: string | null;
  referralCode: string;
  attributionSource: string;
  attributionDate: Date | string;
  userType: UserRole | string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  rewards?: ReferralReward[];
}

export interface ReferralReward {
  id: string;
  attributionId: string;
  referrerId: string;
  referredUserId: string | null;
  referredCompanyId: string | null;
  productType: ReferralProductType;
  transactionSequenceNumber: number;
  rewardAmount: number;
  currency: string;
  status: ReferralStatus;
  isLocked: boolean;
  lockDurationDays: number;
  lockExpiresAt: Date | string | null;
  unlockedAt: Date | string | null;
  transactionId: string | null;
  hiringRequirementId: string | null;
  commercialAgreementId: string | null;
  payoutId: string | null;
  ledgerEntries?: ReferralLedgerEntry[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReferralPayout {
  id: string;
  referrerId: string;
  amount: number;
  currency: string;
  payoutMethod: string;
  payoutAddress: string;
  status: string;
  transactionRef: string | null;
  adminNotes: string | null;
  approvedBy: string | null;
  processedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  rewards?: ReferralReward[];
  ledgerEntries?: ReferralLedgerEntry[];
}

export interface ReferralLedgerEntry {
  id: string;
  referrerId: string;
  rewardId?: string | null;
  payoutId?: string | null;
  entryType: ReferralLedgerEntryType;
  amount: number;
  balanceAfter: number;
  currency: string;
  correlationId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface ReferralProgramConfig {
  id: string;
  isEnabled: boolean;
  candidateRewardAmount: number;
  candidateMaxQualifyingTransactions: number;
  employerJobRewardAmount: number;
  employerMaxQualifyingTransactions: number;
  managedHiringRewardAmount: number;
  managedHiringMaxRewards: number;
  managedHiringDefaultLockDays: number;
  pphRewardAmount?: number;
  pphMaxQualifyingHires?: number;
  pphDefaultLockingPeriodDays?: number;
  minPayoutAmount: number;
  attributionWindowDays: number;
  updatedAt: Date | string;
}

// ================================================================
// 3. SANITIZED DTOs (Public / Dashboard-Safe)
// (Omits internal commercial values, employer contract amounts & margins)
// ================================================================

export interface SanitizedReferralRewardDTO {
  id: string;
  attributionId: string;
  productType: ReferralProductType;
  productDisplayName: string;
  transactionSequenceNumber: number;
  rewardAmount: number;
  currency: string;
  status: ReferralStatus;
  isLocked: boolean;
  lockDurationDays: number;
  lockExpiresAt: string | null;
  unlockedAt: string | null;
  createdAt: string;
}

export interface SanitizedReferralAttributionDTO {
  id: string;
  referralCode: string;
  attributionSource: string;
  attributionDate: string;
  userType: UserRole | string;
  referredMaskedName?: string;
  totalRewardsEarned: number;
  rewardsCount: number;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
}

export interface ReferralDashboardStatsDTO {
  referralCode: string;
  referralLink: string;
  totalAttributions: number;
  totalQualifiedConversions: number;
  lifetimeEarnings: number;
  availableBalance: number;
  lockedBalance: number;
  pendingPayoutBalance: number;
  paidBalance: number;
  currency: string;
  recentRewards: SanitizedReferralRewardDTO[];
  recentAttributions: SanitizedReferralAttributionDTO[];
}

// ================================================================
// 4. PAYOUT REQUEST & RESPONSE TYPES
// ================================================================

export interface CreatePayoutRequestBody {
  payoutMethod: PayoutMethod | string;
  payoutAddress: string;
  amount?: number;
  accountHolderName?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    swiftCode?: string;
  };
  upiDetails?: {
    vpa?: string;
  };
}

export interface PayoutResponseDTO {
  id: string;
  referrerId: string;
  amount: number;
  currency: string;
  payoutMethod: string;
  payoutAddress: string;
  status: string;
  transactionRef: string | null;
  adminNotes: string | null;
  approvedBy: string | null;
  createdAt: string;
  processedAt: string | null;
  rewardsCount?: number;
}

export interface AdminPayoutActionRequest {
  payoutId: string;
  action: "APPROVE" | "REJECT" | "PROCESS";
  transactionRef?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

// ================================================================
// 5. ADMIN CONFIGURATION DTOs & INPUTS
// ================================================================

export interface ReferralProgramConfigDTO {
  id: string;
  isEnabled: boolean;
  candidateRewardAmount: number;
  candidateMaxQualifyingTransactions: number;
  employerJobRewardAmount: number;
  employerMaxQualifyingTransactions: number;
  managedHiringRewardAmount: number;
  managedHiringMaxRewards: number;
  managedHiringDefaultLockDays: number;
  minPayoutAmount: number;
  attributionWindowDays: number;
  updatedAt: string;
}

export interface UpdateReferralProgramConfigInput {
  isEnabled?: boolean;
  candidateRewardAmount?: number;
  candidateMaxQualifyingTransactions?: number;
  employerJobRewardAmount?: number;
  employerMaxQualifyingTransactions?: number;
  managedHiringRewardAmount?: number;
  managedHiringMaxRewards?: number;
  managedHiringDefaultLockDays?: number;
  minPayoutAmount?: number;
  attributionWindowDays?: number;
}

// ================================================================
// 6. ENGINE EVENT & EVALUATION TYPES
// ================================================================

export interface AttributionCreationInput {
  referrerId: string;
  referralCode: string;
  referredUserId?: string;
  referredCompanyId?: string;
  attributionSource: string;
  userType: UserRole | string;
  metadata?: Record<string, unknown>;
}

export interface RewardQualificationResult {
  isQualified: boolean;
  rejectionReason?: string;
  productType: ReferralProductType;
  rewardAmount: number;
  currency: string;
  isLocked: boolean;
  lockDurationDays: number;
  lockExpiresAt?: Date | string | null;
  transactionSequenceNumber: number;
}
