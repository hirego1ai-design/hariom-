import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CONFIG_ID = "global-admin-config";

export const jobSpecificAssessmentPolicySchema = z.object({
  passingPercentage: z.number().int().min(0).max(100),
  validityDays: z.number().int().min(1).max(3650),
  retakeCooldownHours: z.number().int().min(0).max(8760),
}).strict();

export type JobSpecificAssessmentPolicy = z.infer<typeof jobSpecificAssessmentPolicySchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getJobSpecificAssessmentPolicy(): Promise<JobSpecificAssessmentPolicy> {
  const row = await prisma.adminConfiguration.findUnique({
    where: { id: CONFIG_ID },
    select: { platformConfig: true },
  });
  if (!row || !isRecord(row.platformConfig)) {
    throw new Error("Job-specific assessment policy is not configured.");
  }
  const parsed = jobSpecificAssessmentPolicySchema.safeParse(row.platformConfig.jobSpecificAssessment);
  if (!parsed.success) {
    throw new Error("Job-specific assessment policy is missing or invalid.");
  }
  return parsed.data;
}

export async function saveJobSpecificAssessmentPolicy(
  policy: JobSpecificAssessmentPolicy,
): Promise<void> {
  const parsed = jobSpecificAssessmentPolicySchema.parse(policy);

  await prisma.$transaction(async (tx) => {
    await tx.adminConfiguration.upsert({
      where: { id: CONFIG_ID },
      create: {
        id: CONFIG_ID,
        platformConfig: { jobSpecificAssessment: parsed } as Prisma.InputJsonValue,
      },
      update: {},
    });

    await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
    const row = await tx.adminConfiguration.findUniqueOrThrow({
      where: { id: CONFIG_ID },
      select: { platformConfig: true },
    });
    const platformConfig = isRecord(row.platformConfig) ? { ...row.platformConfig } : {};
    platformConfig.jobSpecificAssessment = parsed;

    await tx.adminConfiguration.update({
      where: { id: CONFIG_ID },
      data: { platformConfig: platformConfig as Prisma.InputJsonValue },
    });
  });
}
