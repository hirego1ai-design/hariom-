type PlanQuotas = {
  jobPostsQuota: number;
  resumeUnlocksQuota: number;
  aiInterviewsQuota: number;
  applicationsQuota: number;
  resumeDownloadsQuota: number;
  backgroundVerificationsQuota: number;
  copilotJobLimit?: number;
};

/** Calendar-month plan access, clamped to the target month's last day in UTC. */
export function subscriptionExpiry(start: Date, months: number): Date {
  if (!Number.isFinite(start.getTime()) || !Number.isInteger(months) || months < 1 || months > 120) {
    throw new Error("Invalid subscription validity");
  }
  const expiry = new Date(start);
  const day = expiry.getUTCDate();
  expiry.setUTCDate(1);
  expiry.setUTCMonth(expiry.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0)).getUTCDate();
  expiry.setUTCDate(Math.min(day, lastDay));
  return expiry;
}

export function jobExpiry(start: Date, validityDays: number): Date {
  if (!Number.isFinite(start.getTime()) || !Number.isInteger(validityDays) || validityDays < 1 || validityDays > 365) {
    throw new Error("Invalid job validity");
  }
  return new Date(start.getTime() + validityDays * 86_400_000);
}

/**
 * Customer plan quotas. aiAgentCreditsLeft is retained as a legacy column only;
 * normal subscription AI assistance is included and is not customer-metered.
 */
export function subscriptionCredits(plan: PlanQuotas) {
  const credits = {
    jobPostsLeft: plan.jobPostsQuota,
    resumeUnlocksLeft: plan.resumeUnlocksQuota,
    aiInterviewsLeft: plan.aiInterviewsQuota,
    aiAgentCreditsLeft: 0,
    applicationsLeft: plan.applicationsQuota,
    resumeDownloadsLeft: plan.resumeDownloadsQuota,
    backgroundVerificationsLeft: plan.backgroundVerificationsQuota,
    copilotJobsLeft: plan.copilotJobLimit ?? 0,
  };
  if (Object.values(credits).some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Subscription plan has invalid quotas");
  }
  return credits;
}
