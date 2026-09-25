import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CONFIG_ID = "global-admin-config";

export const universalSkillValidationPolicySchema = z.object({
  passingPercentage: z.number().int().min(0).max(100),
  validityDays: z.number().int().min(1).max(3650),
  retakeCooldownHours: z.number().int().min(0).max(8760),
  feedbackEnabled: z.boolean(),
  mockInterviewRecommendationEnabled: z.boolean(),
}).strict();

export type UniversalSkillValidationPolicy = z.infer<typeof universalSkillValidationPolicySchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getUniversalSkillValidationPolicy(): Promise<UniversalSkillValidationPolicy> {
  const row = await prisma.adminConfiguration.findUnique({
    where: { id: CONFIG_ID },
    select: { platformConfig: true },
  });

  if (!row || !isRecord(row.platformConfig)) {
    throw new Error("Universal Skill Validation policy is not configured.");
  }

  const parsed = universalSkillValidationPolicySchema.safeParse(row.platformConfig.universalSkillValidation);
  if (!parsed.success) {
    throw new Error("Universal Skill Validation policy is missing or invalid.");
  }
  return parsed.data;
}

export async function saveUniversalSkillValidationPolicy(
  policy: UniversalSkillValidationPolicy,
): Promise<void> {
  const parsed = universalSkillValidationPolicySchema.parse(policy);

  await prisma.$transaction(async (tx) => {
    await tx.adminConfiguration.upsert({
      where: { id: CONFIG_ID },
      create: {
        id: CONFIG_ID,
        platformConfig: { universalSkillValidation: parsed } as Prisma.InputJsonValue,
      },
      update: {},
    });

    await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
    const row = await tx.adminConfiguration.findUniqueOrThrow({
      where: { id: CONFIG_ID },
      select: { platformConfig: true },
    });

    const platformConfig = isRecord(row.platformConfig)
      ? { ...row.platformConfig }
      : {};
    platformConfig.universalSkillValidation = parsed;

    await tx.adminConfiguration.update({
      where: { id: CONFIG_ID },
      data: { platformConfig: platformConfig as Prisma.InputJsonValue },
    });
  });
}
