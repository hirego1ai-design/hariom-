if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/hirego_prod?schema=public";
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting HireGo AI database seeding...");

  // Seed default Subscription Plans
  const bootstrappedPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-bootstrapped" },
    update: {},
    create: {
      id: "plan-bootstrapped",
      name: "Bootstrapped",
      description: "Ideal for early-stage startups and quick hiring needs.",
      price: 4999.0,
      currency: "INR",
      jobPostsQuota: 3,
      resumeUnlocksQuota: 25,
      aiInterviewsQuota: 10,
      applicationsQuota: 100,
      resumeDownloadsQuota: 50,
      backgroundVerificationsQuota: 5,
      featuresAllowed: ["Job Posting", "Basic Resume Screening", "Email Support"],
      validityMonths: 1,
    },
  });

  const hypergrowthPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-hypergrowth" },
    update: {},
    create: {
      id: "plan-hypergrowth",
      name: "Hypergrowth",
      description: "Designed for scaling tech teams with active hiring funnels.",
      price: 14999.0,
      currency: "INR",
      jobPostsQuota: 10,
      resumeUnlocksQuota: 100,
      aiInterviewsQuota: 50,
      applicationsQuota: 500,
      resumeDownloadsQuota: 250,
      backgroundVerificationsQuota: 20,
      featuresAllowed: ["Unlimited Job Postings", "AI Interview Copilot", "Candidate Ranking Engine", "Priority Support"],
      validityMonths: 1,
    },
  });

  const unicornPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-unicorn" },
    update: {},
    create: {
      id: "plan-unicorn",
      name: "Unicorn Mode",
      description: "Enterprise tier with managed SLA contracts and dedicated recruiter access.",
      price: 49999.0,
      currency: "INR",
      jobPostsQuota: 50,
      resumeUnlocksQuota: 500,
      aiInterviewsQuota: 250,
      applicationsQuota: 2500,
      resumeDownloadsQuota: 1000,
      backgroundVerificationsQuota: 100,
      featuresAllowed: ["Managed Hiring SLA", "Dedicated Recruiter Hub", "Custom Proctoring Engine", "API Access"],
      validityMonths: 3,
    },
  });

  console.log("Seeded Subscription Plans:", [bootstrappedPlan.name, hypergrowthPlan.name, unicornPlan.name]);

  // Seed default AI Service Costs
  const aiCosts = [
    { serviceKey: "resume_screening", serviceName: "AI Resume Screening", creditCost: 1, billingType: "CREDIT_BASED" },
    { serviceKey: "jd_generation", serviceName: "AI JD Generation", creditCost: 1, billingType: "CREDIT_BASED" },
    { serviceKey: "candidate_match", serviceName: "AI Candidate Ranking", creditCost: 2, billingType: "CREDIT_BASED" },
    { serviceKey: "interview_evaluation", serviceName: "AI Interview Proctor & Scorer", creditCost: 5, billingType: "CREDIT_BASED" },
  ];

  for (const cost of aiCosts) {
    await prisma.aiServiceCost.upsert({
      where: { serviceKey: cost.serviceKey },
      update: {},
      create: cost,
    });
  }

  console.log("Seeded AI Service Costs");

  // Seed sample company & admin
  const sampleCompany = await prisma.company.upsert({
    where: { id: "company-hirego" },
    update: {},
    create: {
      id: "company-hirego",
      name: "HireGo AI Technologies",
      website: "https://hirego.ai",
      description: "Next-gen Autonomous AI Recruitment Platform",
      industry: "Human Resources / AI",
      size: "50-200",
      location: "Bangalore, India",
    },
  });

  console.log("Seeded Sample Company:", sampleCompany.name);
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
