import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const liveInterviewProctoringPolicySchema = z.object({
  enabled: z.boolean(),
  trackTabSwitch: z.boolean(),
  trackClipboard: z.boolean(),
  trackContextMenu: z.boolean(),
  policyVersion: z.string().trim().min(1).max(64),
}).strict();

export type LiveInterviewProctoringPolicy = z.infer<typeof liveInterviewProctoringPolicySchema>;

const DEFAULT_POLICY: LiveInterviewProctoringPolicy = {
  enabled: false,
  trackTabSwitch: true,
  trackClipboard: true,
  trackContextMenu: false,
  policyVersion: "live-interview-browser-v1",
};

export async function getLiveInterviewProctoringPolicy(): Promise<LiveInterviewProctoringPolicy> {
  const config = await prisma.adminConfiguration.findUnique({
    where: { id: "global-admin-config" },
    select: { securityPolicy: true },
  });
  const root = config?.securityPolicy;
  if (!root || typeof root !== "object" || Array.isArray(root)) return DEFAULT_POLICY;
  const candidate = (root as Record<string, unknown>).liveInterviewProctoring;
  const parsed = liveInterviewProctoringPolicySchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_POLICY;
}

export async function saveLiveInterviewProctoringPolicy(policy: LiveInterviewProctoringPolicy) {
  const parsed = liveInterviewProctoringPolicySchema.parse(policy);
  const existing = await prisma.adminConfiguration.findUnique({
    where: { id: "global-admin-config" },
    select: { securityPolicy: true },
  });
  const current = existing?.securityPolicy && typeof existing.securityPolicy === "object" && !Array.isArray(existing.securityPolicy)
    ? existing.securityPolicy as Record<string, unknown>
    : {};
  await prisma.adminConfiguration.upsert({
    where: { id: "global-admin-config" },
    update: { securityPolicy: { ...current, liveInterviewProctoring: parsed } },
    create: { id: "global-admin-config", securityPolicy: { liveInterviewProctoring: parsed } },
  });
  return parsed;
}
