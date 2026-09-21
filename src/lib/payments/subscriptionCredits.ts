type PlanQuotas = {
  jobPostsQuota: number; resumeUnlocksQuota: number; aiInterviewsQuota: number;
  applicationsQuota: number; resumeDownloadsQuota: number; backgroundVerificationsQuota: number;
};

/** Calendar-month renewal, clamped to the target month's last day in UTC. */
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

/** Agent calls currently share the plan's configured AI interview allowance. */
export function subscriptionCredits(plan: PlanQuotas) {
  const credits = {
    jobPostsLeft: plan.jobPostsQuota,
    resumeUnlocksLeft: plan.resumeUnlocksQuota,
    aiInterviewsLeft: plan.aiInterviewsQuota,
    aiAgentCreditsLeft: plan.aiInterviewsQuota,
    applicationsLeft: plan.applicationsQuota,
    resumeDownloadsLeft: plan.resumeDownloadsQuota,
    backgroundVerificationsLeft: plan.backgroundVerificationsQuota,
  };
  if (Object.values(credits).some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Subscription plan has invalid credit quotas");
  }
  return credits;
}

