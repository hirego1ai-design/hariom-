type PlanQuotas = {
  jobPostsQuota: number; resumeUnlocksQuota: number; aiInterviewsQuota: number;
  applicationsQuota: number; resumeDownloadsQuota: number; backgroundVerificationsQuota: number;
};

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

export function razorpayCheckoutFields(order: {
  keyId?: string; gatewayOrderId?: string; finalAmount?: number; currency?: string;
}) {
  if (!order.keyId || !order.gatewayOrderId || !order.currency ||
      !Number.isFinite(order.finalAmount) || (order.finalAmount ?? 0) <= 0) {
    throw new Error("Checkout returned incomplete Razorpay configuration");
  }
  return { key: order.keyId, order_id: order.gatewayOrderId,
    amount: Math.round(order.finalAmount! * 100), currency: order.currency };
}
