import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CONFIG_ID = "global-admin-config";

export const liveInterviewProctoringPolicySchema = z.object({
  enabled: z.boolean(),
  events: z.object({
    TAB_SWITCH: z.boolean(),
    BROWSER_UNFOCUSED: z.boolean(),
    COPY_PASTE_DETECTED: z.boolean(),
    SCREEN_SHARE_STOPPED: z.boolean(),
  }).strict(),
}).strict();

export type LiveInterviewProctoringPolicy = z.infer<typeof liveInterviewProctoringPolicySchema>;
export type LiveInterviewProctorEvent = keyof LiveInterviewProctoringPolicy["events"];

export const DEFAULT_LIVE_INTERVIEW_PROCTORING_POLICY: LiveInterviewProctoringPolicy = {
  enabled: true,
  events: {
    TAB_SWITCH: true,
    BROWSER_UNFOCUSED: true,
    COPY_PASTE_DETECTED: true,
    SCREEN_SHARE_STOPPED: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getLiveInterviewProctoringPolicy(): Promise<LiveInterviewProctoringPolicy> {
  const row = await prisma.adminConfiguration.findUnique({
    where: { id: CONFIG_ID },
    select: { securityPolicy: true },
  });
  if (!row || !isRecord(row.securityPolicy)) return DEFAULT_LIVE_INTERVIEW_PROCTORING_POLICY;
  const parsed = liveInterviewProctoringPolicySchema.safeParse(row.securityPolicy.liveInterviewProctoring);
  return parsed.success ? parsed.data : DEFAULT_LIVE_INTERVIEW_PROCTORING_POLICY;
}

export async function saveLiveInterviewProctoringPolicy(policy: LiveInterviewProctoringPolicy): Promise<void> {
  const parsed = liveInterviewProctoringPolicySchema.parse(policy);
  await prisma.$transaction(async (tx) => {
    await tx.adminConfiguration.upsert({
      where: { id: CONFIG_ID },
      create: {
        id: CONFIG_ID,
        securityPolicy: { liveInterviewProctoring: parsed } as Prisma.InputJsonValue,
      },
      update: {},
    });
    await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
    const row = await tx.adminConfiguration.findUniqueOrThrow({
      where: { id: CONFIG_ID },
      select: { securityPolicy: true },
    });
    const securityPolicy = isRecord(row.securityPolicy) ? { ...row.securityPolicy } : {};
    securityPolicy.liveInterviewProctoring = parsed;
    await tx.adminConfiguration.update({
      where: { id: CONFIG_ID },
      data: { securityPolicy: securityPolicy as Prisma.InputJsonValue },
    });
  });
}

export function isLiveInterviewProctorEventEnabled(
  policy: LiveInterviewProctoringPolicy,
  event: string,
): event is LiveInterviewProctorEvent {
  return policy.enabled && event in policy.events && Boolean(policy.events[event as LiveInterviewProctorEvent]);
}
