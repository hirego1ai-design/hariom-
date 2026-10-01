import { prisma } from "@/lib/prisma";

export async function hasCurrentLiveProctoringConsent(params: {
  candidateUserId: string;
  interviewId: string;
  policyVersion: string;
}): Promise<boolean> {
  const evidence = await prisma.auditLog.findFirst({
    where: {
      userId: params.candidateUserId,
      action: "LIVE_INTERVIEW_PROCTORING_CONSENT",
      resource: `Interview:${params.interviewId}`,
      details: { contains: `"policyVersion":"${params.policyVersion}"` },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return Boolean(evidence);
}
