if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for seeding. Refusing to guess or target a local production-named database.");
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const launchPlans = [
  {
    id: "plan-free-trial",
    name: "Free Trial",
    description: "First-time employers can experience HireGo with three job posts.",
    price: 0,
    currency: "INR",
    jobPostsQuota: 3,
    resumeUnlocksQuota: 0,
    aiInterviewsQuota: 0,
    applicationsQuota: 0,
    resumeDownloadsQuota: 0,
    backgroundVerificationsQuota: 0,
    featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING_SCORE", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING"],
    displayBenefits: ["AI JD generation", "Candidate-job matching score", "Applicant dashboard", "Assessment tools", "Virtual interview room", "Proctoring evidence for human review"],
    validityMonths: 1,
    jobValidityDays: 7,
    planType: "FREE_TRIAL",
    firstTimeOnly: true,
    copilotJobsQuota: 0,
    copilotAutoActivate: false,
    badge: "First-time users",
    isFeatured: false,
    displayOrder: 10,
    isArchived: false,
  },
  {
    id: "plan-hire-one",
    name: "Hire One",
    description: "A focused self-service plan for one immediate hiring requirement.",
    price: 299,
    currency: "INR",
    jobPostsQuota: 1,
    resumeUnlocksQuota: 0,
    aiInterviewsQuota: 0,
    applicationsQuota: 0,
    resumeDownloadsQuota: 0,
    backgroundVerificationsQuota: 0,
    featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING_SCORE", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "INTERVIEW_WORKFLOW"],
    displayBenefits: ["AI JD generation", "Candidate-job matching score", "Assessment workflow", "Virtual interview suite", "Proctoring evidence & review", "Structured interview feedback"],
    validityMonths: 1,
    jobValidityDays: 7,
    planType: "STANDARD",
    firstTimeOnly: false,
    copilotJobsQuota: 0,
    copilotAutoActivate: false,
    badge: "Best for one role",
    isFeatured: false,
    displayOrder: 20,
    isArchived: false,
  },
  {
    id: "plan-hiring-sprint",
    name: "Hiring Sprint",
    description: "One role with HireGo Co-Pilot actively assisting the hiring workflow.",
    price: 799,
    currency: "INR",
    jobPostsQuota: 1,
    resumeUnlocksQuota: 0,
    aiInterviewsQuota: 0,
    applicationsQuota: 0,
    resumeDownloadsQuota: 0,
    backgroundVerificationsQuota: 0,
    featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING_SCORE", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "INTERVIEW_WORKFLOW", "COPILOT"],
    displayBenefits: ["HireGo Co-Pilot included", "Candidate prioritisation", "Assessment coordination", "Interview scheduling & reminders", "Feedback tracking", "Next-step recommendations", "Human-approved final decisions"],
    validityMonths: 1,
    jobValidityDays: 7,
    planType: "COPILOT",
    firstTimeOnly: false,
    copilotJobsQuota: 1,
    copilotAutoActivate: true,
    badge: "Co-Pilot included",
    isFeatured: true,
    displayOrder: 30,
    isArchived: false,
  },
  {
    id: "plan-build-team",
    name: "Build Team",
    description: "Self-service hiring for growing teams across multiple roles.",
    price: 999,
    currency: "INR",
    jobPostsQuota: 4,
    resumeUnlocksQuota: 0,
    aiInterviewsQuota: 0,
    applicationsQuota: 0,
    resumeDownloadsQuota: 0,
    backgroundVerificationsQuota: 0,
    featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING_SCORE", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "CANDIDATE_COMPARISON", "INTERVIEW_WORKFLOW", "ANALYTICS", "TEAM_COLLABORATION", "PROACTIVE_SOURCING", "OFFER_WORKFLOW"],
    displayBenefits: ["Four independent job posts", "Advanced candidate matching insights", "Assessments", "Virtual interviews & proctoring", "Candidate comparison", "Team collaboration", "Hiring analytics", "Offer workflow"],
    validityMonths: 1,
    jobValidityDays: 7,
    planType: "STANDARD",
    firstTimeOnly: false,
    copilotJobsQuota: 0,
    copilotAutoActivate: false,
    badge: "Popular",
    isFeatured: false,
    displayOrder: 40,
    isArchived: false,
  },
  {
    id: "plan-copilot-team",
    name: "Co-Pilot Team",
    description: "Multi-role hiring with HireGo Co-Pilot included for every job credit.",
    price: 1999,
    currency: "INR",
    jobPostsQuota: 4,
    resumeUnlocksQuota: 0,
    aiInterviewsQuota: 0,
    applicationsQuota: 0,
    resumeDownloadsQuota: 0,
    backgroundVerificationsQuota: 0,
    featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING_SCORE", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "CANDIDATE_COMPARISON", "INTERVIEW_WORKFLOW", "ANALYTICS", "TEAM_COLLABORATION", "PROACTIVE_SOURCING", "OFFER_WORKFLOW", "COPILOT"],
    displayBenefits: ["Co-Pilot on all four jobs", "Candidate prioritisation", "Assessment coordination", "Interview scheduling & reminders", "Feedback tracking", "Next-step recommendations", "Virtual interviews & proctoring", "Team collaboration & analytics"],
    validityMonths: 1,
    jobValidityDays: 7,
    planType: "COPILOT",
    firstTimeOnly: false,
    copilotJobsQuota: 4,
    copilotAutoActivate: true,
    badge: "Full Co-Pilot",
    isFeatured: false,
    displayOrder: 50,
    isArchived: false,
  },
] as const;

async function main() {
  console.log("Starting HireGo AI database seeding...");

  await prisma.subscriptionPlan.updateMany({
    where: { id: { in: ["plan-bootstrapped", "plan-hypergrowth", "plan-unicorn"] } },
    data: { isArchived: true },
  });

  for (const plan of launchPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }

  console.log("Seeded production subscription catalog:", launchPlans.map(plan => plan.name));

  // Internal service metadata only. Customer AI calls are not billed per invocation.
  const aiServices = [
    { serviceKey: "resume_screening", serviceName: "AI Resume Screening", creditCost: 0, billingType: "INCLUDED" },
    { serviceKey: "jd_generation", serviceName: "AI JD Generation", creditCost: 0, billingType: "INCLUDED" },
    { serviceKey: "candidate_match", serviceName: "AI Candidate Ranking", creditCost: 0, billingType: "INCLUDED" },
    { serviceKey: "interview_evaluation", serviceName: "AI Interview Proctor & Scorer", creditCost: 0, billingType: "INCLUDED" },
  ];

  for (const service of aiServices) {
    await prisma.aiServiceCost.upsert({
      where: { serviceKey: service.serviceKey },
      update: {},
      create: service,
    });
  }

  // Do not seed sample companies, users, candidates, or jobs into application databases.
  console.log("Database seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
