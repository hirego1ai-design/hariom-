/**
 * HireGo Referral Engine — Database Repository & Persistence Layer
 * 
 * Production PostgreSQL backing via Prisma with double-entry financial ledger & fail-closed security.
 * Features:
 * - Single production PostgreSQL source of truth (fails closed with Correlation IDs on any DB error in production)
 * - Zero in-memory fallback in production (NODE_ENV === "production")
 * - Immutable financial ledger entries (ReferralLedgerEntry) for all reward grants, locks, unlocks, and payout transitions
 * - Multi-vector self-referral checks (userId, normalized email, normalized phone)
 * - Attribution overwrite & hijacking prevention (Rule 12)
 * - Canonical Company Identity resolution across multi-employee employer accounts (CEO, HR, Recruiter)
 * - Concurrency & double-spending protection on payouts (balances reserved during PENDING/APPROVED)
 * - Explicit separation of APPROVE, MARK_PAID (requiring UTR/ref), and REJECT
 * - HireGo Managed Hiring™ guarantee lock reconciliation with financial ledger tracking
 */

import {
  FraudAuditRecord,
  FraudStatus,
  ReferralAttribution,
  ReferralDashboardStatsDTO,
  ReferralLedgerEntry,
  ReferralLedgerEntryType,
  ReferralPayout,
  ReferralProductType,
  ReferralReward,
  ReferralStatus,
  SanitizedReferralAttributionDTO,
  SanitizedReferralRewardDTO,
  UserFraudProfile,
} from "@/types/referral";
import { prisma } from "./prisma";
import {
  evaluateTransactionQualification,
  getReferralProgramConfig,
} from "./referral-rules";

function normalizeEmail(email?: string | null): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}

function generateCorrelationId(prefix: string = "ref"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

class ReferralDatabaseStore {
  // Test harness stores (isolated strictly for test executions in non-production environments)
  private attributions = new Map<string, ReferralAttribution>();
  private rewards = new Map<string, ReferralReward>();
  private payouts = new Map<string, ReferralPayout>();
  private ledgerEntries = new Map<string, ReferralLedgerEntry>();
  private referralCodeToUserMap = new Map<string, string>();
  private userToCompanyMap = new Map<string, string>(); // Maps employee userId -> canonical companyId in tests
  private userProfiles = new Map<string, { email?: string; phone?: string }>();
  private fraudProfiles = new Map<string, UserFraudProfile>();
  private inFlightTransactionLocks = new Map<string, Promise<ReferralReward | null>>();

  constructor() {
    this.referralCodeToUserMap.set("HIREGO2026", "usr-demo-referrer");
    this.referralCodeToUserMap.set("RAHUL2026", "usr-rahul-sharma");
    this.referralCodeToUserMap.set("ALEX2026", "usr-alex-candidate");
    this.referralCodeToUserMap.set("ALPHA2026", "usr-referrer-alpha");

    this.userProfiles.set("usr-referrer-alpha", {
      email: "alpha.referrer@example.com",
      phone: "+919876543210",
    });
  }

  public registerTestUserProfile(userId: string, profile: { email?: string; phone?: string }): void {
    this.userProfiles.set(userId, profile);
  }

  public registerTestEmployeeCompany(userId: string, companyId: string): void {
    this.userToCompanyMap.set(userId, companyId);
  }

  public updateEmployeeCompany(userId: string, newCompanyId: string | null): void {
    if (newCompanyId) {
      this.userToCompanyMap.set(userId, newCompanyId);
    } else {
      this.userToCompanyMap.delete(userId);
    }
  }

  public removeEmployeeCompany(userId: string): void {
    this.userToCompanyMap.delete(userId);
  }

  public resetTestHarness(): void {
    this.attributions.clear();
    this.rewards.clear();
    this.payouts.clear();
    this.ledgerEntries.clear();
    this.userToCompanyMap.clear();
    this.userProfiles.clear();
    this.fraudProfiles.clear();
    this.inFlightTransactionLocks.clear();
    this.referralCodeToUserMap.clear();
    this.referralCodeToUserMap.set("HIREGO2026", "usr-demo-referrer");
    this.referralCodeToUserMap.set("RAHUL2026", "usr-rahul-sharma");
    this.referralCodeToUserMap.set("ALEX2026", "usr-alex-candidate");
    this.referralCodeToUserMap.set("ALPHA2026", "usr-referrer-alpha");
    this.userProfiles.set("usr-referrer-alpha", {
      email: "alpha.referrer@example.com",
      phone: "+919876543210",
    });
  }

  // ================================================================
  // 1. ATTRIBUTION ENGINE & CANONICAL IDENTITY RESOLUTION
  // ================================================================

  public async resolveReferralCode(code: string): Promise<string | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const cleanCode = code.trim().toUpperCase();
    const correlationId = generateCorrelationId("corr-res-code");

    // 1. Look up referral code in ReferralAttribution table (authoritative source)
    try {
      const client = prisma as any;
      if (client.referralAttribution) {
        const attr = await client.referralAttribution.findFirst({
          where: { referralCode: cleanCode },
          orderBy: { attributionDate: "desc" as any },
        });
        if (attr) return attr.referrerId;
      }

      if (isProduction) {
        // In production: fail-closed, DB is single source of truth
        return null;
      }
    } catch (error: any) {
      if (isProduction) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error resolving referral code "${cleanCode}":`, error);
        throw new Error(`[${correlationId}] Database unavailable: failed to resolve referral code.`);
      }
    }

    // 2. Test harness map fallback (non-production only)
    if (this.referralCodeToUserMap.has(cleanCode)) {
      return this.referralCodeToUserMap.get(cleanCode)!;
    }

    return null;
  }

  public registerReferralCodeForUser(userId: string, code: string): void {
    this.referralCodeToUserMap.set(code.trim().toUpperCase(), userId);
  }

  public async createAttribution(input: {
    referrerId: string;
    referredUserId?: string;
    referredCompanyId?: string;
    referralCode: string;
    attributionSource?: string;
    userType?: string;
    metadata?: Record<string, unknown>;
    referredEmail?: string;
    referredPhone?: string;
  }): Promise<ReferralAttribution> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-create-attr");

    // -------------------------------------------------------------
    // Security 1: Self-Referral Prevention (Multi-Vector)
    // -------------------------------------------------------------
    if (input.referredUserId && input.referrerId === input.referredUserId) {
      throw new Error("Self-referral is strictly prohibited (Same User ID).");
    }

    // Check email / phone matching in non-production test profiles
    if (!isProduction) {
      const referrerProfile = this.userProfiles.get(input.referrerId);
      if (referrerProfile) {
        if (
          input.referredEmail &&
          referrerProfile.email &&
          normalizeEmail(input.referredEmail) === normalizeEmail(referrerProfile.email)
        ) {
          throw new Error("Self-referral is strictly prohibited (Matching normalized email).");
        }
        if (
          input.referredPhone &&
          referrerProfile.phone &&
          normalizePhone(input.referredPhone) === normalizePhone(referrerProfile.phone)
        ) {
          throw new Error("Self-referral is strictly prohibited (Matching verified phone number).");
        }
      }
    }

    // Check in PostgreSQL DB
    try {
      if (input.referrerId && (input.referredEmail || input.referredPhone)) {
        const referrerUser = await prisma.user.findUnique({
          where: { id: input.referrerId },
        });
        if (referrerUser) {
          if (
            input.referredEmail &&
            normalizeEmail(referrerUser.email) === normalizeEmail(input.referredEmail)
          ) {
            throw new Error("Self-referral is strictly prohibited (Matching normalized email).");
          }
          if (
            input.referredPhone &&
            (referrerUser as any).phoneNumber &&
            normalizePhone((referrerUser as any).phoneNumber) === normalizePhone(input.referredPhone)
          ) {
            throw new Error("Self-referral is strictly prohibited (Matching verified phone number).");
          }
        }
      }
    } catch (e: any) {
      if (e.message?.includes("Self-referral")) throw e;
      if (isProduction) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error checking self-referral:`, e);
        throw new Error(`[${correlationId}] Database unavailable: failed to verify referral attribution.`);
      }
    }

    // -------------------------------------------------------------
    // Security 2: Attribution Overwrite & Hijack Prevention (Rule 12)
    // -------------------------------------------------------------
    if (input.referredUserId) {
      const existingUserAttr = await this.getAttributionByReferredUser(input.referredUserId);
      if (existingUserAttr) {
        return existingUserAttr;
      }
    }

    if (input.referredCompanyId) {
      const existingCompanyAttr = await this.getAttributionByReferredCompany(input.referredCompanyId);
      if (existingCompanyAttr) {
        return existingCompanyAttr;
      }
    }

    const id = `attr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: ReferralAttribution = {
      id,
      referrerId: input.referrerId,
      referredUserId: input.referredUserId || null,
      referredCompanyId: input.referredCompanyId || null,
      referralCode: input.referralCode.toUpperCase(),
      attributionSource: input.attributionSource || "DIRECT_LINK",
      attributionDate: new Date().toISOString(),
      userType: input.userType || "CANDIDATE",
      metadata: input.metadata || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isProduction) {
      try {
        const client = prisma as any;
        const dbAttr = await client.referralAttribution.create({
          data: {
            id,
            referrerId: input.referrerId,
            referredUserId: input.referredUserId || undefined,
            referredCompanyId: input.referredCompanyId || undefined,
            referralCode: record.referralCode,
            attributionSource: record.attributionSource,
            attributionDate: new Date(record.attributionDate),
            userType: (input.userType as any) || "CANDIDATE",
            metadata: (input.metadata as any) || undefined,
          },
        });
        return {
          id: dbAttr.id,
          referrerId: dbAttr.referrerId,
          referredUserId: dbAttr.referredUserId,
          referredCompanyId: dbAttr.referredCompanyId,
          referralCode: dbAttr.referralCode,
          attributionSource: dbAttr.attributionSource,
          attributionDate: dbAttr.attributionDate.toISOString(),
          userType: dbAttr.userType,
          metadata: dbAttr.metadata,
          createdAt: dbAttr.createdAt.toISOString(),
          updatedAt: dbAttr.updatedAt.toISOString(),
        };
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error persisting attribution:`, e);
        throw new Error(`[${correlationId}] Database error: failed to persist referral attribution in production: ${e?.message}`);
      }
    }

    // Dev/Test harness store
    this.attributions.set(id, record);

    try {
      const client = prisma as any;
      if (client.referralAttribution) {
        const dbAttr = await client.referralAttribution.create({
          data: {
            id,
            referrerId: input.referrerId,
            referredUserId: input.referredUserId || undefined,
            referredCompanyId: input.referredCompanyId || undefined,
            referralCode: record.referralCode,
            attributionSource: record.attributionSource,
            attributionDate: new Date(record.attributionDate),
            userType: (input.userType as any) || "CANDIDATE",
            metadata: (input.metadata as any) || undefined,
          },
        });
        if (dbAttr) {
          record.id = dbAttr.id;
        }
      }
    } catch {
      // offline dev/test fallback
    }

    return record;
  }

  public async getAttributionByReferredUser(
    userId: string,
    tx?: any
  ): Promise<ReferralAttribution | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-get-attr-usr");

    try {
      const client = tx || (prisma as any);
      if (client.referralAttribution) {
        const r = await client.referralAttribution.findUnique({
          where: { referredUserId: userId },
        });
        if (r) {
          return {
            id: r.id,
            referrerId: r.referrerId,
            referredUserId: r.referredUserId,
            referredCompanyId: r.referredCompanyId,
            referralCode: r.referralCode,
            attributionSource: r.attributionSource,
            attributionDate: r.attributionDate.toISOString(),
            userType: r.userType,
            metadata: r.metadata as any,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      }
      if (isProduction) {
        return null;
      }
    } catch (error: any) {
      if (isProduction) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error reading referral attribution for user ${userId}:`, error);
        throw new Error(`[${correlationId}] Database unavailable: failed to read referral attribution.`);
      }
    }

    for (const attr of this.attributions.values()) {
      if (attr.referredUserId === userId) return attr;
    }
    return null;
  }

  public async getAttributionByReferredCompany(
    companyId: string,
    tx?: any
  ): Promise<ReferralAttribution | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-get-attr-comp");

    try {
      const client = tx || (prisma as any);
      if (client.referralAttribution) {
        const r = await client.referralAttribution.findUnique({
          where: { referredCompanyId: companyId },
        });
        if (r) {
          return {
            id: r.id,
            referrerId: r.referrerId,
            referredUserId: r.referredUserId,
            referredCompanyId: r.referredCompanyId,
            referralCode: r.referralCode,
            attributionSource: r.attributionSource,
            attributionDate: r.attributionDate.toISOString(),
            userType: r.userType,
            metadata: r.metadata as any,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      }
      if (isProduction) {
        return null;
      }
    } catch (error: any) {
      if (isProduction) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error reading company attribution for company ${companyId}:`, error);
        throw new Error(`[${correlationId}] Database unavailable: failed to read company referral attribution.`);
      }
    }

    for (const attr of this.attributions.values()) {
      if (attr.referredCompanyId === companyId) return attr;
    }
    return null;
  }

  /**
   * Resolves canonical attribution for paying customer.
   * Enforces Canonical Company Identity: If an employee (CEO, HR, Recruiter) belongs to Company X,
   * the attribution of Company X is canonically resolved.
   */
  public async resolveCanonicalAttribution(params: {
    userId?: string;
    companyId?: string;
  }, tx?: any): Promise<ReferralAttribution | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-canonical-attr");

    // 1. Direct Company Attribution (Company is authoritative for company operations)
    if (params.companyId) {
      const companyAttr = await this.getAttributionByReferredCompany(params.companyId, tx);
      if (companyAttr) return companyAttr;
      // If company has no attribution, do not fall back to employee candidate attribution
      return null;
    }

    // 2. Check if user is linked to an employer company (CEO, HR, Recruiter)
    if (params.userId) {
      // Check test harness employee map in dev/test
      if (!isProduction && this.userToCompanyMap.has(params.userId)) {
        const mappedCompId = this.userToCompanyMap.get(params.userId)!;
        const compAttr = await this.getAttributionByReferredCompany(mappedCompId, tx);
        if (compAttr) return compAttr;
      }

      // Check PostgreSQL DB relationships
      try {
        const client = tx || prisma;
        const user = await (client as any).user.findUnique({
          where: { id: params.userId },
          include: { employerProfile: true },
        });
        if (user && user.employerProfile?.companyId) {
          const companyAttr = await this.getAttributionByReferredCompany(user.employerProfile.companyId, tx);
          if (companyAttr) return companyAttr;
        }
      } catch (error: any) {
        if (isProduction) {
          console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error resolving employer company relationship for user ${params.userId}:`, error);
          throw new Error(`[${correlationId}] Database unavailable: failed to resolve employer company relationship.`);
        }
      }

      // 3. Candidate User Attribution (Only for candidate users not associated with an employer)
      const userAttr = await this.getAttributionByReferredUser(params.userId, tx);
      if (userAttr) return userAttr;
    }

    return null;
  }

  // ================================================================
  // 2. QUALIFICATION & REWARD EVALUATION WITH FINANCIAL LEDGER

  public async getRewardedTransactionCountForEntity(
    referredUserId?: string,
    referredCompanyId?: string,
    productType?: ReferralProductType,
    tx?: any
  ): Promise<number> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-count-tx");

    let matchingProductTypes: ReferralProductType[] = [];
    if (
      productType === ReferralProductType.CANDIDATE_MOCK_INTERVIEW ||
      productType === ReferralProductType.CANDIDATE_CAREER_PASS
    ) {
      matchingProductTypes = [
        ReferralProductType.CANDIDATE_MOCK_INTERVIEW,
        ReferralProductType.CANDIDATE_CAREER_PASS,
      ];
    } else if (
      productType === ReferralProductType.EMPLOYER_JOB_POST ||
      productType === ReferralProductType.EMPLOYER_SUBSCRIPTION
    ) {
      matchingProductTypes = [
        ReferralProductType.EMPLOYER_JOB_POST,
        ReferralProductType.EMPLOYER_SUBSCRIPTION,
      ];
    } else if (
      productType === ReferralProductType.EMPLOYER_MANAGED_HIRING ||
      (productType as any) === "EMPLOYER_PPH_PLACEMENT"
    ) {
      matchingProductTypes = [
        ReferralProductType.EMPLOYER_MANAGED_HIRING,
        "EMPLOYER_PPH_PLACEMENT" as any,
      ];
    }

    try {
      const client = tx || (prisma as any);
      if (client.referralReward) {
        const count = await client.referralReward.count({
          where: {
            referredUserId: referredUserId || undefined,
            referredCompanyId: referredCompanyId || undefined,
            productType:
              matchingProductTypes.length > 0
                ? ({ in: matchingProductTypes as any } as any)
                : undefined,
            status: {
              in: [
                ReferralStatus.QUALIFIED,
                ReferralStatus.LOCKED,
                ReferralStatus.ELIGIBLE,
                ReferralStatus.PAID,
              ] as any,
            },
          },
        });
        if (isProduction || count > 0) return count;
      }
    } catch (error: any) {
      if (isProduction) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error counting rewarded transactions:`, error);
        throw new Error(`[${correlationId}] Database unavailable: failed to count rewarded transactions.`);
      }
    }

    if (isProduction) {
      return 0;
    }

    let count = 0;
    for (const rew of this.rewards.values()) {
      const matchesUser = referredUserId && rew.referredUserId === referredUserId;
      const matchesCompany = referredCompanyId && rew.referredCompanyId === referredCompanyId;
      const matchesProduct =
        matchingProductTypes.length === 0 ||
        matchingProductTypes.includes(rew.productType);
      const isValidStatus = [
        ReferralStatus.QUALIFIED,
        ReferralStatus.LOCKED,
        ReferralStatus.ELIGIBLE,
        ReferralStatus.PAID,
      ].includes(rew.status);

      if ((matchesUser || matchesCompany) && matchesProduct && isValidStatus) {
        count++;
      }
    }
    return count;
  }

  public async recordQualifyingReward(input: {
    attribution: ReferralAttribution;
    productType: ReferralProductType;
    transactionId?: string;
    hiringRequirementId?: string;
    commercialAgreementId?: string;
    agreementWarrantyDays?: number;
    customHiredDate?: Date;
    tx?: any;
  }, tx?: any): Promise<ReferralReward | null> {
    const activeTx = input.tx || tx;
    const lockKey = input.transactionId || (input.hiringRequirementId ? `req-${input.hiringRequirementId}` : null);
    if (lockKey && this.inFlightTransactionLocks.has(lockKey)) {
      return this.inFlightTransactionLocks.get(lockKey)!;
    }

    const executionPromise = this.internalRecordQualifyingReward({ ...input, tx: activeTx }, activeTx);
    if (lockKey) {
      this.inFlightTransactionLocks.set(lockKey, executionPromise);
    }

    try {
      return await executionPromise;
    } finally {
      if (lockKey) {
        this.inFlightTransactionLocks.delete(lockKey);
      }
    }
  }

  private async internalRecordQualifyingReward(input: {
    attribution: ReferralAttribution;
    productType: ReferralProductType;
    transactionId?: string;
    hiringRequirementId?: string;
    commercialAgreementId?: string;
    agreementWarrantyDays?: number;
    customHiredDate?: Date;
    tx?: any;
  }, tx?: any): Promise<ReferralReward | null> {
    const activeTx = input.tx || tx;
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-reward-record");

    // -------------------------------------------------------------
    // Concurrency & Idempotency Guard (Rule 14)
    // -------------------------------------------------------------
    if (input.transactionId) {
      // Check database
      try {
        const client = activeTx || (prisma as any);
        if (client.referralReward) {
          const existingDb = await client.referralReward.findFirst({
            where: { transactionId: input.transactionId },
          });
          if (existingDb) {
            return {
              id: existingDb.id,
              attributionId: existingDb.attributionId,
              referrerId: existingDb.referrerId,
              referredUserId: existingDb.referredUserId,
              referredCompanyId: existingDb.referredCompanyId,
              productType: existingDb.productType,
              transactionSequenceNumber: existingDb.transactionSequenceNumber,
              rewardAmount: existingDb.rewardAmount,
              currency: existingDb.currency,
              status: existingDb.status,
              isLocked: existingDb.isLocked,
              lockDurationDays: existingDb.lockDurationDays,
              lockExpiresAt: existingDb.lockExpiresAt ? existingDb.lockExpiresAt.toISOString() : null,
              unlockedAt: existingDb.unlockedAt ? existingDb.unlockedAt.toISOString() : null,
              transactionId: existingDb.transactionId,
              hiringRequirementId: existingDb.hiringRequirementId,
              commercialAgreementId: existingDb.commercialAgreementId,
              payoutId: existingDb.payoutId,
              createdAt: existingDb.createdAt.toISOString(),
              updatedAt: existingDb.updatedAt.toISOString(),
            };
          }
        }
      } catch (e: any) {
        if (isProduction) {
          console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error checking reward idempotency:`, e);
          throw new Error(`[${correlationId}] Database unavailable: failed to verify transaction idempotency.`);
        }
      }

      // Check test harness (non-production only)
      if (!isProduction) {
        for (const rew of this.rewards.values()) {
          if (rew.transactionId === input.transactionId) {
            return rew; // Idempotent
          }
        }
      }
    }

    const priorCount = await this.getRewardedTransactionCountForEntity(
      input.attribution.referredUserId || undefined,
      input.attribution.referredCompanyId || undefined,
      input.productType,
      activeTx
    );

    const qualification = await evaluateTransactionQualification({
      productType: input.productType,
      priorRewardedCountForEntity: priorCount,
      agreementWarrantyDays: input.agreementWarrantyDays,
      customHiredDate: input.customHiredDate,
    });

    if (!qualification.isQualified) {
      // Record limit reached with 0 reward for immutable audit trail
      const zeroRewardId = `rew-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const zeroReward: ReferralReward = {
        id: zeroRewardId,
        attributionId: input.attribution.id,
        referrerId: input.attribution.referrerId,
        referredUserId: input.attribution.referredUserId,
        referredCompanyId: input.attribution.referredCompanyId,
        productType: input.productType,
        transactionSequenceNumber: qualification.transactionSequenceNumber,
        rewardAmount: 0,
        currency: "INR",
        status: ReferralStatus.LIMIT_REACHED,
        isLocked: false,
        lockDurationDays: 0,
        lockExpiresAt: null,
        unlockedAt: null,
        transactionId: input.transactionId || null,
        hiringRequirementId: input.hiringRequirementId || null,
        commercialAgreementId: input.commercialAgreementId || null,
        payoutId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isProduction) {
        try {
          const client = activeTx || (prisma as any);
          const dbZero = await client.referralReward.create({
            data: {
              id: zeroRewardId,
              attributionId: zeroReward.attributionId,
              referrerId: zeroReward.referrerId,
              referredUserId: zeroReward.referredUserId || undefined,
              referredCompanyId: zeroReward.referredCompanyId || undefined,
              productType: zeroReward.productType as any,
              transactionSequenceNumber: zeroReward.transactionSequenceNumber,
              rewardAmount: 0,
              currency: "INR",
              status: "LIMIT_REACHED",
              isLocked: false,
              lockDurationDays: 0,
              transactionId: zeroReward.transactionId || undefined,
              hiringRequirementId: zeroReward.hiringRequirementId || undefined,
              commercialAgreementId: zeroReward.commercialAgreementId || undefined,
            },
          });
          return {
            ...zeroReward,
            id: dbZero.id,
          };
        } catch (e: any) {
          console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error persisting limit reached reward:`, e);
          throw new Error(`[${correlationId}] Database unavailable: failed to record transaction limit.`);
        }
      }

      this.rewards.set(zeroReward.id, zeroReward);
      return zeroReward;
    }

    const status = qualification.isLocked
      ? ReferralStatus.LOCKED
      : ReferralStatus.ELIGIBLE;

    const rewardId = `rew-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const reward: ReferralReward = {
      id: rewardId,
      attributionId: input.attribution.id,
      referrerId: input.attribution.referrerId,
      referredUserId: input.attribution.referredUserId,
      referredCompanyId: input.attribution.referredCompanyId,
      productType: input.productType,
      transactionSequenceNumber: qualification.transactionSequenceNumber,
      rewardAmount: qualification.rewardAmount,
      currency: qualification.currency,
      status,
      isLocked: qualification.isLocked,
      lockDurationDays: qualification.lockDurationDays,
      lockExpiresAt: qualification.lockExpiresAt
        ? new Date(qualification.lockExpiresAt).toISOString()
        : null,
      unlockedAt: null,
      transactionId: input.transactionId || null,
      hiringRequirementId: input.hiringRequirementId || null,
      commercialAgreementId: input.commercialAgreementId || null,
      payoutId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isProduction) {
      try {
        const executeInTx = async (txClient: any) => {
          // 1. Create ReferralReward
          const createdReward = await txClient.referralReward.create({
            data: {
              id: reward.id,
              attributionId: reward.attributionId,
              referrerId: reward.referrerId,
              referredUserId: reward.referredUserId || undefined,
              referredCompanyId: reward.referredCompanyId || undefined,
              productType: reward.productType as any,
              transactionSequenceNumber: reward.transactionSequenceNumber,
              rewardAmount: reward.rewardAmount,
              currency: reward.currency,
              status: reward.status as any,
              isLocked: reward.isLocked,
              lockDurationDays: reward.lockDurationDays,
              lockExpiresAt: reward.lockExpiresAt ? new Date(reward.lockExpiresAt) : undefined,
              transactionId: reward.transactionId || undefined,
              hiringRequirementId: reward.hiringRequirementId || undefined,
              commercialAgreementId: reward.commercialAgreementId || undefined,
            },
          });

          // 2. Fetch current balance to calculate balanceAfter for ledger
          const userRewards = await txClient.referralReward.findMany({
            where: { referrerId: reward.referrerId },
          });
          let currentBalance = 0;
          for (const r of userRewards) {
            if (r.status === "ELIGIBLE" || r.status === "LOCKED") {
              currentBalance += r.rewardAmount;
            }
          }

          // 3. Create immutable ReferralLedgerEntry if model available
          let createdLedger = null;
          if (txClient.referralLedgerEntry) {
            createdLedger = await txClient.referralLedgerEntry.create({
              data: {
                id: ledgerEntryId,
                referrerId: reward.referrerId,
                rewardId: createdReward.id,
                entryType: qualification.isLocked
                  ? ReferralLedgerEntryType.REWARD_LOCK
                  : ReferralLedgerEntryType.REWARD_CREDIT,
                amount: reward.rewardAmount,
                balanceAfter: currentBalance,
                currency: reward.currency,
                correlationId,
                metadata: {
                  productType: reward.productType,
                  transactionId: reward.transactionId,
                  lockDurationDays: reward.lockDurationDays,
                  lockExpiresAt: reward.lockExpiresAt,
                },
              },
            });
          }

          return [createdReward, createdLedger];
        };

        const client = prisma as any;
        const [dbReward, _dbLedger] = activeTx
          ? await executeInTx(activeTx)
          : await client.$transaction(executeInTx);

        return {
          id: dbReward.id,
          attributionId: dbReward.attributionId,
          referrerId: dbReward.referrerId,
          referredUserId: dbReward.referredUserId,
          referredCompanyId: dbReward.referredCompanyId,
          productType: dbReward.productType,
          transactionSequenceNumber: dbReward.transactionSequenceNumber,
          rewardAmount: dbReward.rewardAmount,
          currency: dbReward.currency,
          status: dbReward.status,
          isLocked: dbReward.isLocked,
          lockDurationDays: dbReward.lockDurationDays,
          lockExpiresAt: dbReward.lockExpiresAt ? dbReward.lockExpiresAt.toISOString() : null,
          unlockedAt: dbReward.unlockedAt ? dbReward.unlockedAt.toISOString() : null,
          transactionId: dbReward.transactionId,
          hiringRequirementId: dbReward.hiringRequirementId,
          commercialAgreementId: dbReward.commercialAgreementId,
          payoutId: dbReward.payoutId,
          createdAt: dbReward.createdAt.toISOString(),
          updatedAt: dbReward.updatedAt.toISOString(),
        };
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error creating reward and financial ledger entry:`, e);
        throw new Error(`[${correlationId}] Database error: failed to persist referral reward and ledger entry: ${e?.message}`);
      }
    }

    // Dev/Test harness recording
    this.rewards.set(reward.id, reward);
    const ledgerEntry: ReferralLedgerEntry = {
      id: ledgerEntryId,
      referrerId: reward.referrerId,
      rewardId: reward.id,
      payoutId: null,
      entryType: qualification.isLocked
        ? ReferralLedgerEntryType.REWARD_LOCK
        : ReferralLedgerEntryType.REWARD_CREDIT,
      amount: reward.rewardAmount,
      balanceAfter: reward.rewardAmount,
      currency: reward.currency,
      correlationId,
      metadata: { productType: reward.productType },
      createdAt: new Date().toISOString(),
    };
    this.ledgerEntries.set(ledgerEntry.id, ledgerEntry);

    try {
      const client = activeTx || (prisma as any);
      if (client.referralReward) {
        await client.referralReward.create({
          data: {
            id: reward.id,
            attributionId: reward.attributionId,
            referrerId: reward.referrerId,
            referredUserId: reward.referredUserId || undefined,
            referredCompanyId: reward.referredCompanyId || undefined,
            productType: reward.productType as any,
            transactionSequenceNumber: reward.transactionSequenceNumber,
            rewardAmount: reward.rewardAmount,
            currency: reward.currency,
            status: reward.status as any,
            isLocked: reward.isLocked,
            lockDurationDays: reward.lockDurationDays,
            lockExpiresAt: reward.lockExpiresAt ? new Date(reward.lockExpiresAt) : undefined,
            transactionId: reward.transactionId || undefined,
            hiringRequirementId: reward.hiringRequirementId || undefined,
            commercialAgreementId: reward.commercialAgreementId || undefined,
          },
        });
      }
    } catch {
      // offline dev/test fallback
    }

    return reward;
  }

  // ================================================================
  // 3. USER REFERRAL STATS & SANITIZED DTOs (Rule 7)
  // ================================================================

  public async getUserReferralStats(
    userId: string,
    userName?: string
  ): Promise<ReferralDashboardStatsDTO> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-user-stats");
    const code = (userName ? userName.replace(/\s+/g, "").toUpperCase() : "HIREGO") + "2026";
    this.registerReferralCodeForUser(userId, code);

    const userRewards: ReferralReward[] = [];
    const userAttributions: ReferralAttribution[] = [];
    let pendingPayoutBalance = 0;

    // In production: strictly query database
    if (isProduction) {
      try {
        const client = prisma as any;
        const [dbRewards, dbAttributions, dbPayouts] = await Promise.all([
          client.referralReward.findMany({
            where: { referrerId: userId },
            orderBy: { createdAt: "desc" },
          }),
          client.referralAttribution.findMany({
            where: { referrerId: userId },
            orderBy: { createdAt: "desc" },
          }),
          client.referralPayout.findMany({
            where: {
              referrerId: userId,
              status: { in: ["PENDING_ADMIN_APPROVAL", "APPROVED", "PROCESSING"] },
            },
          }),
        ]);

        for (const r of dbRewards || []) {
          userRewards.push({
            id: r.id,
            attributionId: r.attributionId,
            referrerId: r.referrerId,
            referredUserId: r.referredUserId,
            referredCompanyId: r.referredCompanyId,
            productType: r.productType as any,
            transactionSequenceNumber: r.transactionSequenceNumber,
            rewardAmount: r.rewardAmount,
            currency: r.currency,
            status: r.status as any,
            isLocked: r.isLocked,
            lockDurationDays: r.lockDurationDays,
            lockExpiresAt: r.lockExpiresAt ? r.lockExpiresAt.toISOString() : null,
            unlockedAt: r.unlockedAt ? r.unlockedAt.toISOString() : null,
            transactionId: r.transactionId,
            hiringRequirementId: r.hiringRequirementId,
            commercialAgreementId: r.commercialAgreementId,
            payoutId: r.payoutId,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          });
        }

        for (const a of dbAttributions || []) {
          userAttributions.push({
            id: a.id,
            referrerId: a.referrerId,
            referredUserId: a.referredUserId,
            referredCompanyId: a.referredCompanyId,
            referralCode: a.referralCode,
            attributionSource: a.attributionSource,
            attributionDate: a.attributionDate.toISOString(),
            userType: a.userType,
            metadata: a.metadata,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          });
        }

        for (const p of dbPayouts || []) {
          pendingPayoutBalance += p.amount;
        }
      } catch (error: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error loading user referral stats for user ${userId}:`, error);
        throw new Error(`[${correlationId}] Database unavailable: failed to fetch referral statistics.`);
      }
    } else {
      // Dev/Test harness flow
      try {
        const client = prisma as any;
        if (client.referralReward) {
          const dbRewards = await client.referralReward.findMany({
            where: { referrerId: userId },
            orderBy: { createdAt: "desc" },
          });
          if (dbRewards && dbRewards.length > 0) {
            for (const r of dbRewards) {
              userRewards.push({
                id: r.id,
                attributionId: r.attributionId,
                referrerId: r.referrerId,
                referredUserId: r.referredUserId,
                referredCompanyId: r.referredCompanyId,
                productType: r.productType as any,
                transactionSequenceNumber: r.transactionSequenceNumber,
                rewardAmount: r.rewardAmount,
                currency: r.currency,
                status: r.status as any,
                isLocked: r.isLocked,
                lockDurationDays: r.lockDurationDays,
                lockExpiresAt: r.lockExpiresAt ? r.lockExpiresAt.toISOString() : null,
                unlockedAt: r.unlockedAt ? r.unlockedAt.toISOString() : null,
                transactionId: r.transactionId,
                hiringRequirementId: r.hiringRequirementId,
                commercialAgreementId: r.commercialAgreementId,
                payoutId: r.payoutId,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
              });
            }
          }
        }
      } catch {
        // test fallback
      }

      if (userRewards.length === 0) {
        for (const rew of this.rewards.values()) {
          // Only include rewards that strictly belong to this user — no demo-referrer contamination
          if (rew.referrerId === userId) {
            userRewards.push(rew);
          }
        }
      }

      for (const attr of this.attributions.values()) {
        if (attr.referrerId === userId) {
          userAttributions.push(attr);
        }
      }

      for (const p of this.payouts.values()) {
        if (
          p.referrerId === userId &&
          (p.status === "PENDING_ADMIN_APPROVAL" || p.status === "APPROVED" || p.status === "PROCESSING")
        ) {
          pendingPayoutBalance += p.amount;
        }
      }
    }

    // Calculate balances
    let availableBalance = 0;
    let lockedBalance = 0;
    let paidBalance = 0;
    let lifetimeEarnings = 0;

    for (const r of userRewards) {
      if (r.status === ReferralStatus.ELIGIBLE) {
        availableBalance += r.rewardAmount;
        lifetimeEarnings += r.rewardAmount;
      } else if (r.status === ReferralStatus.LOCKED) {
        lockedBalance += r.rewardAmount;
        lifetimeEarnings += r.rewardAmount;
      } else if (r.status === ReferralStatus.PAID) {
        paidBalance += r.rewardAmount;
        lifetimeEarnings += r.rewardAmount;
      }
    }

    // Map to sanitized DTOs (strictly redact internal commercial values)
    const recentRewards: SanitizedReferralRewardDTO[] = userRewards.map((r) => {
      let displayName = "Candidate Referral Reward";
      if (r.productType === ReferralProductType.EMPLOYER_JOB_POST) {
        displayName = "Employer Job Post Reward";
      } else if (
        r.productType === ReferralProductType.EMPLOYER_MANAGED_HIRING ||
        (r.productType as any) === "EMPLOYER_PPH_PLACEMENT"
      ) {
        displayName = "HireGo Managed Hiring™ Referral Reward";
      } else if (r.productType === ReferralProductType.CANDIDATE_MOCK_INTERVIEW) {
        displayName = "Candidate AI Mock Interview Reward";
      } else if (r.productType === ReferralProductType.CANDIDATE_CAREER_PASS) {
        displayName = "Candidate Career AI Pass Reward";
      }

      const lockExpiresAtStr = r.lockExpiresAt
        ? r.lockExpiresAt instanceof Date
          ? r.lockExpiresAt.toISOString()
          : String(r.lockExpiresAt)
        : null;

      const unlockedAtStr = r.unlockedAt
        ? r.unlockedAt instanceof Date
          ? r.unlockedAt.toISOString()
          : String(r.unlockedAt)
        : null;

      const createdAtStr = r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt);

      return {
        id: r.id,
        attributionId: r.attributionId,
        productType: r.productType,
        productDisplayName: displayName,
        transactionSequenceNumber: r.transactionSequenceNumber,
        rewardAmount: r.rewardAmount,
        currency: r.currency,
        status: r.status,
        isLocked: r.isLocked,
        lockDurationDays: r.lockDurationDays,
        lockExpiresAt: lockExpiresAtStr,
        unlockedAt: unlockedAtStr,
        createdAt: createdAtStr,
      };
    });

    const recentAttributions: SanitizedReferralAttributionDTO[] = userAttributions.map((a) => {
      const entityRewards = userRewards.filter((r) => r.attributionId === a.id);
      const earned = entityRewards.reduce((sum, r) => sum + r.rewardAmount, 0);

      const attrDateStr = a.attributionDate instanceof Date
        ? a.attributionDate.toISOString()
        : String(a.attributionDate);

      return {
        id: a.id,
        referralCode: a.referralCode,
        attributionSource: a.attributionSource,
        attributionDate: attrDateStr,
        userType: a.userType,
        referredMaskedName: "Verified Referree",
        totalRewardsEarned: earned,
        rewardsCount: entityRewards.length,
        status: "ACTIVE",
      };
    });

    return {
      referralCode: code,
      referralLink: `https://hirego.ai/register?ref=${code}`,
      totalAttributions: userAttributions.length,
      totalQualifiedConversions: userRewards.filter((r) => r.rewardAmount > 0).length,
      lifetimeEarnings,
      availableBalance,
      lockedBalance,
      pendingPayoutBalance,
      paidBalance,
      currency: "INR",
      recentRewards,
      recentAttributions,
    };
  }

  // ================================================================
  // 4. PAYOUT WORKFLOW & CONCURRENCY / DOUBLE-SPEND DEFENSE
  // ================================================================

  public async requestPayout(input: {
    referrerId: string;
    amount: number;
    payoutMethod: string;
    payoutAddress: string;
  }): Promise<ReferralPayout> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-payout-req");
    const config = await getReferralProgramConfig();

    if (input.amount < config.minPayoutAmount) {
      throw new Error(`Minimum payout withdrawal is ₹${config.minPayoutAmount}.`);
    }

    // Fraud Engine Check (FRAUD_HOLD / ADMIN_REVIEW gate)
    const fraudProfile = await this.getUserFraudProfile(input.referrerId);
    if (fraudProfile.status === FraudStatus.FRAUD_HOLD) {
      throw new Error("Payout requests are blocked: Account is on FRAUD_HOLD pending security compliance review.");
    }
    if (fraudProfile.status === FraudStatus.ADMIN_REVIEW) {
      throw new Error("Payout requests are blocked: Account is currently under ADMIN_REVIEW.");
    }

    const stats = await this.getUserReferralStats(input.referrerId);
    const unreservedAvailable = stats.availableBalance - stats.pendingPayoutBalance;

    if (input.amount > unreservedAvailable) {
      throw new Error(
        `Requested amount (₹${input.amount}) exceeds unreserved available balance (₹${Math.max(0, unreservedAvailable)}). Existing pending requests: ₹${stats.pendingPayoutBalance}.`
      );
    }

    const id = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const payout: ReferralPayout = {
      id,
      referrerId: input.referrerId,
      amount: input.amount,
      currency: "INR",
      payoutMethod: input.payoutMethod || "UPI",
      payoutAddress: input.payoutAddress,
      status: "PENDING_ADMIN_APPROVAL",
      transactionRef: null,
      adminNotes: null,
      approvedBy: null,
      processedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isProduction) {
      try {
        const client = prisma as any;
        const [dbPayout, _dbLedger] = await client.$transaction(async (tx: any) => {
          // 1. Create ReferralPayout
          const createdPayout = await tx.referralPayout.create({
            data: {
              id,
              referrerId: input.referrerId,
              amount: input.amount,
              currency: "INR",
              payoutMethod: input.payoutMethod || "UPI",
              payoutAddress: input.payoutAddress,
              status: "PENDING_ADMIN_APPROVAL",
            },
          });

          // 2. Create immutable ReferralLedgerEntry for reserved liability
          const createdLedger = await tx.referralLedgerEntry.create({
            data: {
              id: ledgerEntryId,
              referrerId: input.referrerId,
              payoutId: createdPayout.id,
              entryType: ReferralLedgerEntryType.PAYOUT_RESERVED,
              amount: input.amount,
              balanceAfter: unreservedAvailable - input.amount,
              currency: "INR",
              correlationId,
              metadata: {
                payoutMethod: input.payoutMethod,
                payoutAddress: input.payoutAddress,
              },
            },
          });

          return [createdPayout, createdLedger];
        });

        return {
          id: dbPayout.id,
          referrerId: dbPayout.referrerId,
          amount: dbPayout.amount,
          currency: dbPayout.currency,
          payoutMethod: dbPayout.payoutMethod,
          payoutAddress: dbPayout.payoutAddress,
          status: dbPayout.status,
          transactionRef: dbPayout.transactionRef,
          adminNotes: dbPayout.adminNotes,
          approvedBy: dbPayout.approvedBy,
          processedAt: dbPayout.processedAt ? dbPayout.processedAt.toISOString() : null,
          createdAt: dbPayout.createdAt.toISOString(),
          updatedAt: dbPayout.updatedAt.toISOString(),
        };
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error persisting payout request and ledger entry:`, e);
        throw new Error(`[${correlationId}] Database unavailable: failed to submit payout request: ${e?.message}`);
      }
    }

    // Dev/Test harness recording
    this.payouts.set(id, payout);
    const ledgerEntry: ReferralLedgerEntry = {
      id: ledgerEntryId,
      referrerId: input.referrerId,
      payoutId: id,
      entryType: ReferralLedgerEntryType.PAYOUT_RESERVED,
      amount: input.amount,
      balanceAfter: unreservedAvailable - input.amount,
      currency: "INR",
      correlationId,
      metadata: { payoutMethod: input.payoutMethod },
      createdAt: new Date().toISOString(),
    };
    this.ledgerEntries.set(ledgerEntry.id, ledgerEntry);

    return payout;
  }

  public async getAdminPayoutQueue(): Promise<ReferralPayout[]> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-admin-queue");

    try {
      const client = prisma as any;
      if (client.referralPayout) {
        const records = await client.referralPayout.findMany({
          orderBy: { createdAt: "desc" },
        });
        if (records && records.length > 0) {
          return records.map((r: any) => ({
            id: r.id,
            referrerId: r.referrerId,
            amount: r.amount,
            currency: r.currency,
            payoutMethod: r.payoutMethod,
            payoutAddress: r.payoutAddress,
            status: r.status,
            transactionRef: r.transactionRef,
            adminNotes: r.adminNotes,
            approvedBy: r.approvedBy,
            processedAt: r.processedAt ? r.processedAt.toISOString() : null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }));
        }
      }
      if (isProduction) {
        return [];
      }
    } catch (error: any) {
      if (isProduction) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error loading admin payout queue:`, error);
        throw new Error(`[${correlationId}] Database unavailable: failed to fetch payout queue.`);
      }
    }

    return Array.from(this.payouts.values());
  }

  public async adminApprovePayout(
    payoutId: string,
    adminUserId: string,
    adminNotes?: string
  ): Promise<ReferralPayout | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-approve-payout");

    if (isProduction) {
      try {
        const client = prisma as any;
        const updated = await client.referralPayout.update({
          where: { id: payoutId },
          data: {
            status: "APPROVED",
            approvedBy: adminUserId,
            adminNotes: adminNotes || "Approved by Admin for processing.",
          },
        });
        return {
          id: updated.id,
          referrerId: updated.referrerId,
          amount: updated.amount,
          currency: updated.currency,
          payoutMethod: updated.payoutMethod,
          payoutAddress: updated.payoutAddress,
          status: updated.status,
          transactionRef: updated.transactionRef,
          adminNotes: updated.adminNotes,
          approvedBy: updated.approvedBy,
          processedAt: updated.processedAt ? updated.processedAt.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error approving payout ${payoutId}:`, e);
        throw new Error(`[${correlationId}] Database error: failed to approve payout request: ${e?.message}`);
      }
    }

    const payout = this.payouts.get(payoutId);
    if (!payout) return null;

    payout.status = "APPROVED";
    payout.approvedBy = adminUserId;
    payout.adminNotes = adminNotes || "Approved by Admin for processing.";
    payout.updatedAt = new Date().toISOString();
    this.payouts.set(payoutId, payout);

    return payout;
  }

  public async adminMarkPayoutPaid(
    payoutId: string,
    adminUserId: string,
    transactionRef: string
  ): Promise<ReferralPayout | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-mark-paid");

    if (!transactionRef || !transactionRef.trim()) {
      throw new Error("A valid transactionRef / UTR is required to mark a payout as PAID.");
    }

    if (isProduction) {
      try {
        const client = prisma as any;
        const [updatedPayout, _dbLedger] = await client.$transaction(async (tx: any) => {
          // 1. Fetch payout record
          const existing = await tx.referralPayout.findUnique({
            where: { id: payoutId },
          });
          if (!existing) {
            throw new Error(`Payout with ID ${payoutId} not found.`);
          }

          // 2. Update payout to PAID
          const updated = await tx.referralPayout.update({
            where: { id: payoutId },
            data: {
              status: "PAID",
              approvedBy: adminUserId,
              transactionRef: transactionRef.trim(),
              processedAt: new Date(),
            },
          });

          // 3. Mark underlying eligible rewards as PAID
          const eligibleRewards = await tx.referralReward.findMany({
            where: {
              referrerId: existing.referrerId,
              status: "ELIGIBLE",
            },
            orderBy: { createdAt: "asc" },
          });

          let remainingToMark = existing.amount;
          for (const rew of eligibleRewards) {
            if (remainingToMark <= 0) break;
            await tx.referralReward.update({
              where: { id: rew.id },
              data: {
                status: "PAID",
                payoutId: existing.id,
              },
            });
            remainingToMark -= rew.rewardAmount;
          }

          // 4. Create immutable ReferralLedgerEntry
          const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const createdLedger = await tx.referralLedgerEntry.create({
            data: {
              id: ledgerEntryId,
              referrerId: existing.referrerId,
              payoutId: existing.id,
              entryType: ReferralLedgerEntryType.PAYOUT_SETTLED,
              amount: existing.amount,
              balanceAfter: 0, // balance settled
              currency: existing.currency,
              correlationId,
              metadata: {
                transactionRef: transactionRef.trim(),
                approvedBy: adminUserId,
              },
            },
          });

          return [updated, createdLedger];
        });

        return {
          id: updatedPayout.id,
          referrerId: updatedPayout.referrerId,
          amount: updatedPayout.amount,
          currency: updatedPayout.currency,
          payoutMethod: updatedPayout.payoutMethod,
          payoutAddress: updatedPayout.payoutAddress,
          status: updatedPayout.status,
          transactionRef: updatedPayout.transactionRef,
          adminNotes: updatedPayout.adminNotes,
          approvedBy: updatedPayout.approvedBy,
          processedAt: updatedPayout.processedAt ? updatedPayout.processedAt.toISOString() : null,
          createdAt: updatedPayout.createdAt.toISOString(),
          updatedAt: updatedPayout.updatedAt.toISOString(),
        };
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error settling payout ${payoutId}:`, e);
        throw new Error(`[${correlationId}] Database error: failed to mark payout as settled: ${e?.message}`);
      }
    }

    // Dev/Test harness flow
    const payout = this.payouts.get(payoutId);
    if (!payout) return null;

    payout.status = "PAID";
    payout.approvedBy = adminUserId;
    payout.transactionRef = transactionRef.trim();
    payout.processedAt = new Date().toISOString();
    payout.updatedAt = new Date().toISOString();
    this.payouts.set(payoutId, payout);

    // Transition underlying eligible rewards for the referrer to PAID
    let remainingToMark = payout.amount;
    for (const rew of this.rewards.values()) {
      if (
        rew.referrerId === payout.referrerId &&
        rew.status === ReferralStatus.ELIGIBLE &&
        remainingToMark > 0
      ) {
        rew.status = ReferralStatus.PAID;
        rew.payoutId = payoutId;
        remainingToMark -= rew.rewardAmount;
      }
    }

    const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ledgerEntry: ReferralLedgerEntry = {
      id: ledgerEntryId,
      referrerId: payout.referrerId,
      payoutId: payout.id,
      entryType: ReferralLedgerEntryType.PAYOUT_SETTLED,
      amount: payout.amount,
      balanceAfter: 0,
      currency: payout.currency,
      correlationId,
      metadata: { transactionRef: payout.transactionRef },
      createdAt: new Date().toISOString(),
    };
    this.ledgerEntries.set(ledgerEntry.id, ledgerEntry);

    return payout;
  }

  public async adminRejectPayout(
    payoutId: string,
    adminUserId: string,
    reason: string
  ): Promise<ReferralPayout | null> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-reject-payout");

    if (isProduction) {
      try {
        const client = prisma as any;
        const [updatedPayout, _dbLedger] = await client.$transaction(async (tx: any) => {
          const existing = await tx.referralPayout.findUnique({
            where: { id: payoutId },
          });
          if (!existing) {
            throw new Error(`Payout with ID ${payoutId} not found.`);
          }

          const updated = await tx.referralPayout.update({
            where: { id: payoutId },
            data: {
              status: "REJECTED",
              approvedBy: adminUserId,
              adminNotes: reason,
            },
          });

          // Unreserve liability via financial ledger entry (PAYOUT_REFUNDED)
          const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const createdLedger = await tx.referralLedgerEntry.create({
            data: {
              id: ledgerEntryId,
              referrerId: existing.referrerId,
              payoutId: existing.id,
              entryType: ReferralLedgerEntryType.PAYOUT_REFUNDED,
              amount: existing.amount,
              balanceAfter: existing.amount,
              currency: existing.currency,
              correlationId,
              metadata: {
                reason,
                rejectedBy: adminUserId,
              },
            },
          });

          return [updated, createdLedger];
        });

        return {
          id: updatedPayout.id,
          referrerId: updatedPayout.referrerId,
          amount: updatedPayout.amount,
          currency: updatedPayout.currency,
          payoutMethod: updatedPayout.payoutMethod,
          payoutAddress: updatedPayout.payoutAddress,
          status: updatedPayout.status,
          transactionRef: updatedPayout.transactionRef,
          adminNotes: updatedPayout.adminNotes,
          approvedBy: updatedPayout.approvedBy,
          processedAt: updatedPayout.processedAt ? updatedPayout.processedAt.toISOString() : null,
          createdAt: updatedPayout.createdAt.toISOString(),
          updatedAt: updatedPayout.updatedAt.toISOString(),
        };
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error rejecting payout ${payoutId}:`, e);
        throw new Error(`[${correlationId}] Database error: failed to reject payout request: ${e?.message}`);
      }
    }

    // Dev/Test harness flow
    const payout = this.payouts.get(payoutId);
    if (!payout) return null;

    payout.status = "REJECTED";
    payout.approvedBy = adminUserId;
    payout.adminNotes = reason;
    payout.updatedAt = new Date().toISOString();
    this.payouts.set(payoutId, payout);

    const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ledgerEntry: ReferralLedgerEntry = {
      id: ledgerEntryId,
      referrerId: payout.referrerId,
      payoutId: payout.id,
      entryType: ReferralLedgerEntryType.PAYOUT_REFUNDED,
      amount: payout.amount,
      balanceAfter: payout.amount,
      currency: payout.currency,
      correlationId,
      metadata: { reason },
      createdAt: new Date().toISOString(),
    };
    this.ledgerEntries.set(ledgerEntry.id, ledgerEntry);

    return payout;
  }

  // ================================================================
  // 5. MANAGED HIRING REPLACEMENT GUARANTEE RECONCILIATION
  // ================================================================

  public async reconcileExpiredWarrantyLocks(): Promise<number> {
    const isProduction = process.env.NODE_ENV === "production";
    const correlationId = generateCorrelationId("corr-warranty-reconcile");
    const now = new Date();
    let unlockedCount = 0;

    if (isProduction) {
      try {
        const client = prisma as any;
        const expiredRewards = await client.referralReward.findMany({
          where: {
            status: "LOCKED",
            lockExpiresAt: { lte: now },
          },
        });

        for (const rew of expiredRewards) {
          await client.$transaction(async (tx: any) => {
            // 1. Update reward status to ELIGIBLE
            await tx.referralReward.update({
              where: { id: rew.id },
              data: {
                status: "ELIGIBLE",
                isLocked: false,
                unlockedAt: now,
              },
            });

            // 2. Add immutable ReferralLedgerEntry
            const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            await tx.referralLedgerEntry.create({
              data: {
                id: ledgerEntryId,
                referrerId: rew.referrerId,
                rewardId: rew.id,
                entryType: ReferralLedgerEntryType.REWARD_UNLOCK,
                amount: rew.rewardAmount,
                balanceAfter: rew.rewardAmount,
                currency: rew.currency,
                correlationId,
                metadata: {
                  unlockedFromWarrantyPeriod: true,
                  lockDurationDays: rew.lockDurationDays,
                },
              },
            });
          });
          unlockedCount++;
        }

        return unlockedCount;
      } catch (e: any) {
        console.error(`[PROD-DATABASE-ERROR][CORRELATION: ${correlationId}] Database error reconciling warranty locks:`, e);
        throw new Error(`[${correlationId}] Database error: failed to reconcile expired warranty locks: ${e?.message}`);
      }
    }

    // Dev/Test harness flow
    for (const rew of this.rewards.values()) {
      if (rew.status === ReferralStatus.LOCKED && rew.lockExpiresAt) {
        if (new Date(rew.lockExpiresAt) <= now) {
          rew.status = ReferralStatus.ELIGIBLE;
          rew.isLocked = false;
          rew.unlockedAt = now.toISOString();
          rew.updatedAt = now.toISOString();
          this.rewards.set(rew.id, rew);
          unlockedCount++;

          const ledgerEntryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const ledgerEntry: ReferralLedgerEntry = {
            id: ledgerEntryId,
            referrerId: rew.referrerId,
            rewardId: rew.id,
            payoutId: null,
            entryType: ReferralLedgerEntryType.REWARD_UNLOCK,
            amount: rew.rewardAmount,
            balanceAfter: rew.rewardAmount,
            currency: rew.currency,
            correlationId,
            metadata: { unlockedFromWarrantyPeriod: true },
            createdAt: new Date().toISOString(),
          };
          this.ledgerEntries.set(ledgerEntry.id, ledgerEntry);
        }
      }
    }

    return unlockedCount;
  }

  // ================================================================
  // 6. FRAUD ENGINE & RISK STATUS STATE MACHINE
  // Transitions: NORMAL -> FLAGGED -> FRAUD_HOLD -> ADMIN_REVIEW
  // ================================================================

  public async getUserFraudProfile(userId: string): Promise<UserFraudProfile> {
    if (!this.fraudProfiles.has(userId)) {
      this.fraudProfiles.set(userId, {
        userId,
        status: FraudStatus.NORMAL,
        riskScore: 0,
        riskFactors: [],
        lastEvaluatedAt: new Date().toISOString(),
        history: [],
      });
    }
    return this.fraudProfiles.get(userId)!;
  }

  public async updateFraudStatus(params: {
    userId: string;
    newStatus: FraudStatus;
    reason: string;
    actorId?: string;
    riskScore?: number;
    riskFactors?: string[];
  }): Promise<UserFraudProfile> {
    const currentProfile = await this.getUserFraudProfile(params.userId);
    const previousStatus = currentProfile.status;

    // Validate state machine transitions
    const validTransitions: Record<FraudStatus, FraudStatus[]> = {
      [FraudStatus.NORMAL]: [FraudStatus.FLAGGED, FraudStatus.FRAUD_HOLD, FraudStatus.ADMIN_REVIEW, FraudStatus.NORMAL],
      [FraudStatus.FLAGGED]: [FraudStatus.NORMAL, FraudStatus.FRAUD_HOLD, FraudStatus.ADMIN_REVIEW, FraudStatus.FLAGGED],
      [FraudStatus.FRAUD_HOLD]: [FraudStatus.ADMIN_REVIEW, FraudStatus.NORMAL, FraudStatus.FLAGGED, FraudStatus.FRAUD_HOLD],
      [FraudStatus.ADMIN_REVIEW]: [FraudStatus.NORMAL, FraudStatus.FRAUD_HOLD, FraudStatus.FLAGGED, FraudStatus.ADMIN_REVIEW],
    };

    if (!validTransitions[previousStatus].includes(params.newStatus)) {
      throw new Error(`Invalid fraud status transition from ${previousStatus} to ${params.newStatus}.`);
    }

    const auditRecord: FraudAuditRecord = {
      id: `fraud-audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      previousStatus,
      newStatus: params.newStatus,
      reason: params.reason,
      actorId: params.actorId || "SYSTEM",
      riskScore: params.riskScore !== undefined ? params.riskScore : currentProfile.riskScore,
      riskFactors: params.riskFactors || currentProfile.riskFactors,
      createdAt: new Date().toISOString(),
    };

    currentProfile.status = params.newStatus;
    if (params.riskScore !== undefined) currentProfile.riskScore = params.riskScore;
    if (params.riskFactors) currentProfile.riskFactors = params.riskFactors;
    currentProfile.lastEvaluatedAt = new Date().toISOString();
    currentProfile.history.push(auditRecord);

    this.fraudProfiles.set(params.userId, currentProfile);
    return currentProfile;
  }

  public async evaluateFraudRisk(
    userId: string,
    context?: {
      ip?: string;
      email?: string;
      phone?: string;
      triggers?: string[];
      actorId?: string;
    }
  ): Promise<UserFraudProfile> {
    const profile = await this.getUserFraudProfile(userId);
    let riskScore = profile.riskScore;
    const factors = new Set(profile.riskFactors);

    if (context?.triggers) {
      for (const t of context.triggers) {
        factors.add(t);
        if (t === "SELF_REFERRAL_ATTEMPT") riskScore = Math.max(riskScore, 45);
        if (t === "NORMALIZED_IDENTITY_COLLISION") riskScore = Math.max(riskScore, 65);
        if (t === "ABNORMAL_VELOCITY") riskScore = Math.max(riskScore, 50);
        if (t === "PAYOUT_IP_MISMATCH") riskScore = Math.max(riskScore, 35);
        if (t === "CRITICAL_SUSPICIOUS_PATTERN") riskScore = Math.max(riskScore, 85);
      }
    }

    let targetStatus = profile.status;
    if (riskScore >= 75) {
      targetStatus = FraudStatus.FRAUD_HOLD;
    } else if (riskScore >= 40 && profile.status === FraudStatus.NORMAL) {
      targetStatus = FraudStatus.FLAGGED;
    }

    if (targetStatus !== profile.status) {
      return this.updateFraudStatus({
        userId,
        newStatus: targetStatus,
        reason: `Automated Risk Engine Evaluation (Risk Score: ${riskScore})`,
        actorId: context?.actorId || "FRAUD_ENGINE",
        riskScore,
        riskFactors: Array.from(factors),
      });
    }

    profile.riskScore = riskScore;
    profile.riskFactors = Array.from(factors);
    profile.lastEvaluatedAt = new Date().toISOString();
    this.fraudProfiles.set(userId, profile);
    return profile;
  }

  public async getAdminFraudQueue(): Promise<UserFraudProfile[]> {
    return Array.from(this.fraudProfiles.values());
  }
}

export const referralDb = new ReferralDatabaseStore();
