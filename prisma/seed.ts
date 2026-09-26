if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for seeding. Refusing to guess a database target.");
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting HireGo AI database seeding...");

  const plans = [
    {
      id: "plan-bootstrapped",
      name: "Free Trial",
      description: "First-time employers can experience HireGo with three job posts.",
      price: 0,
      currency: "INR",
      jobPostsQuota: 3,
      resumeUnlocksQuota: 25,
      aiInterviewsQuota: 10,
      applicationsQuota: 100,
      resumeDownloadsQuota: 25,
      backgroundVerificationsQuota: 2,
      featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING"],
      marketingBenefits: ["3 job posts", "7-day validity per job", "AI JD generation", "Candidate-job matching score", "Applicant dashboard", "Assessment tools", "Virtual interview access", "Proctoring evidence report"],
      validityMonths: 1,
      jobValidityDays: 7,
      firstTimeOnly: true,
      copilotIncluded: false,
      copilotJobLimit: 0,
      isFeatured: false,
      badgeText: "First-time users",
      displayOrder: 10,
    },
    {
      id: "plan-hypergrowth",
      name: "Hire One",
      description: "A focused package for one immediate hiring requirement.",
      price: 299,
      currency: "INR",
      jobPostsQuota: 1,
      resumeUnlocksQuota: 50,
      aiInterviewsQuota: 25,
      applicationsQuota: 250,
      resumeDownloadsQuota: 50,
      backgroundVerificationsQuota: 5,
      featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "INTERVIEW_FEEDBACK"],
      marketingBenefits: ["1 job post", "7-day validity", "AI JD generation", "Candidate-job matching score", "Assessments", "Virtual interview suite", "Proctoring evidence report", "Interview feedback tools"],
      validityMonths: 1,
      jobValidityDays: 7,
      firstTimeOnly: false,
      copilotIncluded: false,
      copilotJobLimit: 0,
      isFeatured: false,
      badgeText: "Best for one role",
      displayOrder: 20,
    },
    {
      id: "plan-unicorn",
      name: "Build Team",
      description: "For growing teams hiring across multiple roles.",
      price: 999,
      currency: "INR",
      jobPostsQuota: 4,
      resumeUnlocksQuota: 200,
      aiInterviewsQuota: 100,
      applicationsQuota: 1000,
      resumeDownloadsQuota: 250,
      backgroundVerificationsQuota: 20,
      featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "ANALYTICS", "TEAM_COLLABORATION"],
      marketingBenefits: ["4 job posts", "7-day validity per job", "AI JD generation", "Advanced candidate matching", "Assessments and analytics", "Virtual interview suite", "Proctoring evidence report", "Team collaboration"],
      validityMonths: 1,
      jobValidityDays: 7,
      firstTimeOnly: false,
      copilotIncluded: false,
      copilotJobLimit: 0,
      isFeatured: true,
      badgeText: "Popular",
      displayOrder: 30,
    },
    {
      id: "plan-hiring-sprint",
      name: "Hiring Sprint",
      description: "One role with HireGo Co-Pilot included from the start.",
      price: 799,
      currency: "INR",
      jobPostsQuota: 1,
      resumeUnlocksQuota: 50,
      aiInterviewsQuota: 50,
      applicationsQuota: 500,
      resumeDownloadsQuota: 100,
      backgroundVerificationsQuota: 10,
      featuresAllowed: ["JOB_POSTING", "AI_JD_GENERATION", "MATCHING", "ASSESSMENTS", "VIRTUAL_INTERVIEW", "PROCTORING", "COPILOT"],
      marketingBenefits: ["1 job post", "7-day hiring sprint", "HireGo Co-Pilot included", "Candidate prioritisation", "Assessment coordination", "Interview scheduling", "Reminder follow-ups", "Feedback tracking", "Next-step recommendations", "Human approval at key steps"],
      validityMonths: 1,
      jobValidityDays: 7,
      firstTimeOnly: false,
      copilotIncluded: true,
      copilotJobLimit: 1,
      isFeatured: true,
      badgeText: "Co-Pilot included",
      displayOrder: 40,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  await prisma.hiringCopilotConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: true,
      addonPrice: 499,
      currency: "INR",
      addonJobLimit: 1,
      title: "Add HireGo Co-Pilot",
      description: "Let HireGo actively assist this hiring workflow.",
      badgeText: "Recommended",
      benefits: ["Candidate prioritisation", "Assessment coordination", "Interview scheduling", "Reminder follow-ups", "Feedback tracking", "Next-step recommendations", "Human approval at key steps"],
    },
  });

  const aiCosts = [
    { serviceKey: "resume_screening", serviceName: "AI Resume Screening", creditCost: 0, billingType: "INCLUDED" },
    { serviceKey: "jd_generation", serviceName: "AI JD Generation", creditCost: 0, billingType: "INCLUDED" },
    { serviceKey: "candidate_match", serviceName: "AI Candidate Matching", creditCost: 0, billingType: "INCLUDED" },
    { serviceKey: "interview_evaluation", serviceName: "AI Interview Evaluation", creditCost: 0, billingType: "INCLUDED" },
  ];

  for (const cost of aiCosts) {
    await prisma.aiServiceCost.upsert({
      where: { serviceKey: cost.serviceKey },
      update: cost,
      create: cost,
    });
  }

  console.log("Database seeding completed without sample users, companies, candidates or jobs.");
}

main()
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
