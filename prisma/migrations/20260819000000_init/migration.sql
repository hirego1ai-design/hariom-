-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'EMPLOYER', 'RECRUITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'AI_INTERVIEW', 'ASSESSMENT', 'SHORTLISTED', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CustomSkillStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('SUBMITTED', 'IN_DISCUSSION', 'AGREEMENT_DRAFTED', 'AGREEMENT_SENT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'SENT_TO_EMPLOYER', 'AMENDMENT_REQUESTED', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('GLOBAL', 'TENANT');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'RUNNING', 'PAUSED_FOR_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('WORKING', 'DOMAIN', 'KNOWLEDGE');

-- CreateEnum
CREATE TYPE "MemoryScopeLevel" AS ENUM ('COMPANY', 'JOB', 'CANDIDATE', 'APPLICATION', 'INTERVIEW', 'WORKFLOW');

-- CreateEnum
CREATE TYPE "KillSwitchType" AS ENUM ('GLOBAL', 'AGENT', 'WORKFLOW', 'MODEL', 'TOOL');

-- CreateEnum
CREATE TYPE "AgentLifecycleState" AS ENUM ('REGISTERED', 'IDLE', 'PLANNING', 'EXECUTING', 'AWAITING_APPROVAL', 'EVALUATING', 'COMPLETED', 'FAILED', 'SUSPENDED', 'KILLED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('ATTRIBUTED', 'QUALIFIED', 'LOCKED', 'ELIGIBLE', 'PAYABLE', 'PAID', 'REJECTED', 'REVERSED', 'FRAUD_HOLD', 'LIMIT_REACHED');

-- CreateEnum
CREATE TYPE "ReferralProductType" AS ENUM ('CANDIDATE_MOCK_INTERVIEW', 'CANDIDATE_CAREER_PASS', 'EMPLOYER_JOB_POST', 'EMPLOYER_SUBSCRIPTION', 'EMPLOYER_MANAGED_HIRING', 'EMPLOYER_PPH_PLACEMENT');

-- CreateEnum
CREATE TYPE "ReferralLedgerEntryType" AS ENUM ('REWARD_CREDIT', 'REWARD_LOCK', 'REWARD_UNLOCK', 'REWARD_REVERSAL', 'PAYOUT_RESERVED', 'PAYOUT_SETTLED', 'PAYOUT_REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" JSONB,
    "experience" JSONB,
    "preferences" JSONB,
    "experienceYears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hireGoScore" INTEGER NOT NULL DEFAULT 0,
    "resumeUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobListing" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Full-time',
    "salaryRange" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSkillMapping" (
    "id" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "industry" TEXT,
    "department" TEXT,
    "skillId" TEXT NOT NULL,
    "skillCategory" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'preferred',
    "recommendedProficiency" TEXT NOT NULL DEFAULT 'intermediate',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleSkillMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSkillRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "suggestedForRole" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "CustomSkillStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomSkillRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'VERIFY_EMAIL',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoResume" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "transcript" TEXT,
    "communicationScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "clarityScore" INTEGER NOT NULL DEFAULT 0,
    "professionalism" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "roomUrl" TEXT,
    "transcript" TEXT,
    "aiFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "agentType" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringRequirement" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "primaryMobile" TEXT NOT NULL,
    "secondaryMobile" TEXT,
    "industry" TEXT NOT NULL,
    "numberOfPositions" INTEGER NOT NULL,
    "jobTitles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceYears" TEXT NOT NULL,
    "skillsRequired" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT NOT NULL,
    "certifications" TEXT,
    "salaryRangeMin" DOUBLE PRECISION NOT NULL,
    "salaryRangeMax" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "workMode" TEXT NOT NULL DEFAULT 'Hybrid',
    "location" TEXT NOT NULL,
    "joiningTimeline" TEXT NOT NULL,
    "hiringPriority" TEXT NOT NULL DEFAULT 'Standard',
    "replacementExpectation" TEXT NOT NULL DEFAULT '90 Days',
    "additionalNotes" TEXT,
    "jdFileUrl" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assignedSalesLead" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiringRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "feeType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "feeValue" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "invoiceRule" TEXT NOT NULL DEFAULT 'ON_JOINING',
    "replacementDays" INTEGER NOT NULL DEFAULT 90,
    "validityMonths" INTEGER NOT NULL DEFAULT 12,
    "advancePayment" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "creditTermsDays" INTEGER NOT NULL DEFAULT 15,
    "standardDiscountPct" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "taxRatePct" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "specialClauses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commercialNotes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreementTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialAgreement" (
    "id" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "requirementId" TEXT,
    "templateId" TEXT,
    "companyName" TEXT NOT NULL,
    "clientLegalName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "feeType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "feeValue" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "invoiceRule" TEXT NOT NULL DEFAULT 'ON_JOINING',
    "replacementDays" INTEGER NOT NULL DEFAULT 90,
    "validityStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityEndDate" TIMESTAMP(3) NOT NULL,
    "advancePaymentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "creditDays" INTEGER NOT NULL DEFAULT 15,
    "taxRatePct" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "customClauses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commercialNotes" TEXT,
    "salesExecutiveNotes" TEXT,
    "signedByName" TEXT,
    "signedByDesignation" TEXT,
    "signedAt" TIMESTAMP(3),
    "signerIpAddress" TEXT,
    "amendmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementEvent" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "candidateName" TEXT,
    "jobTitle" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TEXT NOT NULL,
    "paidDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "gatewayTxId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "rawPayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "jobId" TEXT,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL DEFAULT 'global-gateway-config',
    "mode" TEXT NOT NULL DEFAULT 'AUTO',
    "primaryGateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "autoFailover" BOOLEAN NOT NULL DEFAULT true,
    "allowEmployerSelection" BOOLEAN NOT NULL DEFAULT true,
    "gatewaysStatus" JSONB NOT NULL,
    "priorities" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExecutionLog" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "costEstUsd" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "jobPostsQuota" INTEGER NOT NULL,
    "resumeUnlocksQuota" INTEGER NOT NULL,
    "aiInterviewsQuota" INTEGER NOT NULL,
    "applicationsQuota" INTEGER NOT NULL DEFAULT 100,
    "resumeDownloadsQuota" INTEGER NOT NULL DEFAULT 50,
    "backgroundVerificationsQuota" INTEGER NOT NULL DEFAULT 5,
    "featuresAllowed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validityMonths" INTEGER NOT NULL DEFAULT 1,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyCredits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobPostsLeft" INTEGER NOT NULL DEFAULT 0,
    "resumeUnlocksLeft" INTEGER NOT NULL DEFAULT 0,
    "aiInterviewsLeft" INTEGER NOT NULL DEFAULT 0,
    "applicationsLeft" INTEGER NOT NULL DEFAULT 0,
    "resumeDownloadsLeft" INTEGER NOT NULL DEFAULT 0,
    "backgroundVerificationsLeft" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCredits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxUsage" INTEGER NOT NULL DEFAULT 9999,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiServiceCost" (
    "id" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL,
    "billingType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiServiceCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "scope" "EventScope" NOT NULL DEFAULT 'TENANT',
    "companyId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "actorId" TEXT,
    "correlationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEntry" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "correlationId" TEXT NOT NULL,
    "companyId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventConsumerCheckpoint" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventConsumerCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "jobId" TEXT,
    "candidateId" TEXT,
    "applicationId" TEXT,
    "interviewId" TEXT,
    "workflowType" TEXT NOT NULL,
    "workflowVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" TEXT NOT NULL,
    "checkpointState" JSONB NOT NULL,
    "correlationId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStepLog" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "executionKey" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "sideEffectDone" BOOLEAN NOT NULL DEFAULT false,
    "inputPayload" JSONB,
    "outputPayload" JSONB,
    "errorMessage" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemoryRecord" (
    "id" TEXT NOT NULL,
    "memoryType" "MemoryType" NOT NULL DEFAULT 'DOMAIN',
    "scopeLevel" "MemoryScopeLevel" NOT NULL DEFAULT 'COMPANY',
    "scopeId" TEXT NOT NULL,
    "companyId" TEXT,
    "agentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "ttlSeconds" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemoryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCompanyBudget" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "monthlyLimitMinorUnits" BIGINT NOT NULL DEFAULT 5000000,
    "costPerCandidateLimitMinor" BIGINT NOT NULL DEFAULT 50000,
    "costPerInterviewLimitMinor" BIGINT NOT NULL DEFAULT 20000,
    "currentSpendMinorUnits" BIGINT NOT NULL DEFAULT 0,
    "reservedSpendMinorUnits" BIGINT NOT NULL DEFAULT 0,
    "isHardCapEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCompanyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetReservation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "reservedMinor" BIGINT NOT NULL,
    "actualMinor" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciledAt" TIMESTAMP(3),

    CONSTRAINT "BudgetReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentEvaluationLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "correlationId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'hirego-score-v1.2',
    "score" DOUBLE PRECISION NOT NULL,
    "fairnessChecked" BOOLEAN NOT NULL DEFAULT true,
    "policyCompliant" BOOLEAN NOT NULL DEFAULT true,
    "biasScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "schemaValid" BOOLEAN NOT NULL DEFAULT true,
    "factualConsistency" BOOLEAN NOT NULL DEFAULT true,
    "verdict" TEXT NOT NULL,
    "humanApprovedBy" TEXT,
    "humanApprovedRole" TEXT,
    "humanNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentEvaluationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KillSwitchConfig" (
    "id" TEXT NOT NULL,
    "targetType" "KillSwitchType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "activatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KillSwitchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShadowExecutionLog" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "productionResult" JSONB NOT NULL,
    "shadowResult" JSONB NOT NULL,
    "diffSummary" JSONB NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShadowExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringOutcomeFeedback" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "aiRecommendedScore" INTEGER NOT NULL,
    "hiringVerdict" TEXT NOT NULL,
    "actualRetentionDays" INTEGER,
    "performanceRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiringOutcomeFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "autoAnonymize" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetentionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLifecycleLog" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "previousState" "AgentLifecycleState" NOT NULL,
    "currentState" "AgentLifecycleState" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLifecycleLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadLetterJob" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "payload" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "DeadLetterJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceRecord" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "executionId" TEXT,
    "companyId" TEXT,
    "jobId" TEXT,
    "candidateId" TEXT,
    "agentId" TEXT,
    "workflowId" TEXT,
    "stepName" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "costMinorUnits" BIGINT NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "toolCalls" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pending Audit',
    "riskScore" TEXT NOT NULL DEFAULT 'Low',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerificationLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralAttribution" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredCompanyId" TEXT,
    "referralCode" TEXT NOT NULL,
    "attributionSource" TEXT NOT NULL,
    "attributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userType" "Role" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredCompanyId" TEXT,
    "productType" "ReferralProductType" NOT NULL,
    "transactionSequenceNumber" INTEGER NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "ReferralStatus" NOT NULL DEFAULT 'ATTRIBUTED',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockDurationDays" INTEGER NOT NULL DEFAULT 0,
    "lockExpiresAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "hiringRequirementId" TEXT,
    "commercialAgreementId" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralPayout" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "payoutMethod" TEXT NOT NULL,
    "payoutAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ADMIN_APPROVAL',
    "transactionRef" TEXT,
    "adminNotes" TEXT,
    "approvedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralLedgerEntry" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "rewardId" TEXT,
    "payoutId" TEXT,
    "entryType" "ReferralLedgerEntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "correlationId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProgramConfig" (
    "id" TEXT NOT NULL DEFAULT 'global-referral-config',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "candidateRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 250.0,
    "candidateMaxQualifyingTransactions" INTEGER NOT NULL DEFAULT 2,
    "employerJobRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "employerMaxQualifyingTransactions" INTEGER NOT NULL DEFAULT 2,
    "managedHiringRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 5000.0,
    "managedHiringMaxRewards" INTEGER NOT NULL DEFAULT 1,
    "managedHiringDefaultLockDays" INTEGER NOT NULL DEFAULT 90,
    "pphRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 5000.0,
    "pphMaxQualifyingHires" INTEGER NOT NULL DEFAULT 1,
    "pphDefaultLockingPeriodDays" INTEGER NOT NULL DEFAULT 90,
    "minPayoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "attributionWindowDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralProgramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppContact" (
    "id" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "userId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "linkStatus" TEXT NOT NULL DEFAULT 'UNLINKED',
    "optInStatus" TEXT NOT NULL DEFAULT 'OPTED_IN',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppOnboardingSession" (
    "id" TEXT NOT NULL,
    "whatsAppContactId" TEXT NOT NULL,
    "userId" TEXT,
    "candidateId" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'START',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "collectedData" JSONB NOT NULL DEFAULT '{}',
    "referralCode" TEXT,
    "attributionSource" TEXT DEFAULT 'whatsapp',
    "campaignMeta" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppOnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppInboundEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppInboundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillMaster_name_key" ON "SkillMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillMaster_slug_key" ON "SkillMaster"("slug");

-- CreateIndex
CREATE INDEX "RoleSkillMapping_roleTitle_industry_department_idx" ON "RoleSkillMapping"("roleTitle", "industry", "department");

-- CreateIndex
CREATE UNIQUE INDEX "RoleSkillMapping_roleTitle_skillId_key" ON "RoleSkillMapping"("roleTitle", "skillId");

-- CreateIndex
CREATE INDEX "CustomSkillRequest_status_createdAt_idx" ON "CustomSkillRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomSkillRequest_normalizedName_idx" ON "CustomSkillRequest"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");

-- CreateIndex
CREATE INDEX "OtpVerification_email_type_idx" ON "OtpVerification"("email", "type");

-- CreateIndex
CREATE UNIQUE INDEX "HiringRequirement_referenceCode_key" ON "HiringRequirement"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementTemplate_slug_key" ON "AgreementTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialAgreement_agreementNumber_key" ON "CommercialAgreement"("agreementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_gatewayTxId_key" ON "PaymentTransaction"("gatewayTxId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_companyId_idx" ON "PaymentTransaction"("companyId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_companyId_idx" ON "IdempotencyRecord"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_companyId_idempotencyKey_key" ON "IdempotencyRecord"("companyId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCredits_companyId_key" ON "CompanyCredits"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AiServiceCost_serviceKey_key" ON "AiServiceCost"("serviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "SystemEvent_idempotencyKey_key" ON "SystemEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SystemEvent_scope_companyId_idx" ON "SystemEvent"("scope", "companyId");

-- CreateIndex
CREATE INDEX "SystemEvent_eventType_idx" ON "SystemEvent"("eventType");

-- CreateIndex
CREATE INDEX "SystemEvent_correlationId_idx" ON "SystemEvent"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEntry_idempotencyKey_key" ON "OutboxEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OutboxEntry_status_createdAt_idx" ON "OutboxEntry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventConsumerCheckpoint_idempotencyKey_consumerId_key" ON "EventConsumerCheckpoint"("idempotencyKey", "consumerId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowInstance_correlationId_key" ON "WorkflowInstance"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStepLog_executionKey_key" ON "WorkflowStepLog"("executionKey");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_workflowInstanceId_stepName_idx" ON "WorkflowStepLog"("workflowInstanceId", "stepName");

-- CreateIndex
CREATE INDEX "AgentMemoryRecord_companyId_scopeLevel_scopeId_idx" ON "AgentMemoryRecord"("companyId", "scopeLevel", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMemoryRecord_scopeLevel_scopeId_agentId_key_key" ON "AgentMemoryRecord"("scopeLevel", "scopeId", "agentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AiCompanyBudget_companyId_key" ON "AiCompanyBudget"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetReservation_executionId_key" ON "BudgetReservation"("executionId");

-- CreateIndex
CREATE INDEX "BudgetReservation_companyId_status_idx" ON "BudgetReservation"("companyId", "status");

-- CreateIndex
CREATE INDEX "BudgetReservation_expiresAt_idx" ON "BudgetReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "AgentEvaluationLog_correlationId_idx" ON "AgentEvaluationLog"("correlationId");

-- CreateIndex
CREATE INDEX "AgentEvaluationLog_executionId_idx" ON "AgentEvaluationLog"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "KillSwitchConfig_targetType_targetId_key" ON "KillSwitchConfig"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ShadowExecutionLog_agentId_correlationId_idx" ON "ShadowExecutionLog"("agentId", "correlationId");

-- CreateIndex
CREATE INDEX "HiringOutcomeFeedback_companyId_idx" ON "HiringOutcomeFeedback"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionConfig_companyId_dataType_key" ON "DataRetentionConfig"("companyId", "dataType");

-- CreateIndex
CREATE INDEX "AgentLifecycleLog_agentId_executionId_idx" ON "AgentLifecycleLog"("agentId", "executionId");

-- CreateIndex
CREATE INDEX "AgentLifecycleLog_correlationId_idx" ON "AgentLifecycleLog"("correlationId");

-- CreateIndex
CREATE INDEX "DeadLetterJob_status_createdAt_idx" ON "DeadLetterJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DeadLetterJob_correlationId_idx" ON "DeadLetterJob"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "TraceRecord_traceId_key" ON "TraceRecord"("traceId");

-- CreateIndex
CREATE INDEX "TraceRecord_correlationId_idx" ON "TraceRecord"("correlationId");

-- CreateIndex
CREATE INDEX "TraceRecord_companyId_jobId_candidateId_idx" ON "TraceRecord"("companyId", "jobId", "candidateId");

-- CreateIndex
CREATE INDEX "TraceRecord_agentId_idx" ON "TraceRecord"("agentId");

-- CreateIndex
CREATE INDEX "DocumentVerification_employerId_idx" ON "DocumentVerification"("employerId");

-- CreateIndex
CREATE INDEX "DocumentVerification_status_idx" ON "DocumentVerification"("status");

-- CreateIndex
CREATE INDEX "DocumentVerification_riskScore_idx" ON "DocumentVerification"("riskScore");

-- CreateIndex
CREATE INDEX "DocumentVerificationLog_documentId_idx" ON "DocumentVerificationLog"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVerificationLog_performedBy_idx" ON "DocumentVerificationLog"("performedBy");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralAttribution_referredUserId_key" ON "ReferralAttribution"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralAttribution_referredCompanyId_key" ON "ReferralAttribution"("referredCompanyId");

-- CreateIndex
CREATE INDEX "ReferralAttribution_referrerId_idx" ON "ReferralAttribution"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralAttribution_referralCode_idx" ON "ReferralAttribution"("referralCode");

-- CreateIndex
CREATE INDEX "ReferralAttribution_attributionDate_idx" ON "ReferralAttribution"("attributionDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_transactionId_key" ON "ReferralReward"("transactionId");

-- CreateIndex
CREATE INDEX "ReferralReward_attributionId_idx" ON "ReferralReward"("attributionId");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_idx" ON "ReferralReward"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralReward_status_idx" ON "ReferralReward"("status");

-- CreateIndex
CREATE INDEX "ReferralReward_payoutId_idx" ON "ReferralReward"("payoutId");

-- CreateIndex
CREATE INDEX "ReferralReward_lockExpiresAt_idx" ON "ReferralReward"("lockExpiresAt");

-- CreateIndex
CREATE INDEX "ReferralPayout_referrerId_idx" ON "ReferralPayout"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralPayout_status_idx" ON "ReferralPayout"("status");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_referrerId_idx" ON "ReferralLedgerEntry"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_correlationId_idx" ON "ReferralLedgerEntry"("correlationId");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_entryType_idx" ON "ReferralLedgerEntry"("entryType");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_createdAt_idx" ON "ReferralLedgerEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_waId_key" ON "WhatsAppContact"("waId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_userId_key" ON "WhatsAppContact"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppContact_normalizedPhone_idx" ON "WhatsAppContact"("normalizedPhone");

-- CreateIndex
CREATE INDEX "WhatsAppContact_userId_idx" ON "WhatsAppContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppOnboardingSession_whatsAppContactId_key" ON "WhatsAppOnboardingSession"("whatsAppContactId");

-- CreateIndex
CREATE INDEX "WhatsAppOnboardingSession_status_expiresAt_idx" ON "WhatsAppOnboardingSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "WhatsAppOnboardingSession_userId_idx" ON "WhatsAppOnboardingSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppInboundEvent_providerEventId_key" ON "WhatsAppInboundEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "WhatsAppInboundEvent_waId_receivedAt_idx" ON "WhatsAppInboundEvent"("waId", "receivedAt");

-- CreateIndex
CREATE INDEX "WhatsAppInboundEvent_processed_receivedAt_idx" ON "WhatsAppInboundEvent"("processed", "receivedAt");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkillMapping" ADD CONSTRAINT "RoleSkillMapping_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomSkillRequest" ADD CONSTRAINT "CustomSkillRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoResume" ADD CONSTRAINT "VideoResume_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "HiringRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementEvent" ADD CONSTRAINT "AgreementEvent_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommercialAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCredits" ADD CONSTRAINT "CompanyCredits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerificationLog" ADD CONSTRAINT "DocumentVerificationLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_referredCompanyId_fkey" FOREIGN KEY ("referredCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "ReferralAttribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "ReferralPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralPayout" ADD CONSTRAINT "ReferralPayout_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLedgerEntry" ADD CONSTRAINT "ReferralLedgerEntry_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLedgerEntry" ADD CONSTRAINT "ReferralLedgerEntry_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "ReferralReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLedgerEntry" ADD CONSTRAINT "ReferralLedgerEntry_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "ReferralPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppContact" ADD CONSTRAINT "WhatsAppContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppOnboardingSession" ADD CONSTRAINT "WhatsAppOnboardingSession_whatsAppContactId_fkey" FOREIGN KEY ("whatsAppContactId") REFERENCES "WhatsAppContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppInboundEvent" ADD CONSTRAINT "WhatsAppInboundEvent_waId_fkey" FOREIGN KEY ("waId") REFERENCES "WhatsAppContact"("waId") ON DELETE CASCADE ON UPDATE CASCADE;

